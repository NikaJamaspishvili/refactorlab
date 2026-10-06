import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import fs from "node:fs";

const babelTraverse = traverse.default ?? traverse;

function parseCode(code) {
  return parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
}

export function getContext(filepath, line, column, type) {
  const code = fs.readFileSync(filepath, "utf8");

  const ast = parseCode(code);

  let found = null;

  babelTraverse(ast, {
    enter(path) {
      const loc = path.node.loc;
      if (!loc) return;

      const startsBefore =
        loc.start.line < line ||
        (loc.start.line === line && loc.start.column <= column);

      const endsAfter =
        loc.end.line > line ||
        (loc.end.line === line && loc.end.column >= column);

      if (startsBefore && endsAfter) {
        found = path; // keeps becoming the smallest matching node
      }
    },
  });

  if (!found) return null;

  let target = found;

  switch (type) {
    case "EXPRESSION":
      target = found.findParent((p) => p.isExpression()) ?? found;
      break;

    case "STATEMENT":
      target = found.findParent((p) => p.isStatement()) ?? found;
      break;

    case "CONTROL_FLOW": {
      const isControlFlow = (p) =>
        p.isIfStatement() ||
        p.isSwitchStatement() ||
        p.isConditionalExpression() ||
        p.isForStatement() ||
        p.isWhileStatement() ||
        p.isDoWhileStatement() ||
        p.isForInStatement() ||
        p.isForOfStatement();

      let cursor = found;
      let outermostControlFlow = null;

      while (cursor && !cursor.isFunction()) {
        if (isControlFlow(cursor)) {
          outermostControlFlow = cursor; // keep updating as we go up
        }
        cursor = cursor.parentPath;
      }

      target = outermostControlFlow ?? found;
      break;
    }

    case "FUNCTION":
      target = found.getFunctionParent() ?? found;
      break;

    case "MULTI_LOCATION":
      // Usually handled using multiple Sonar issue locations,
      // not one parent traversal.
      target = found;
      break;
  }

  return {
    type: target.node.type,
    startLine: target.node.loc?.start.line,
    endLine: target.node.loc?.end.line,
    code: code.slice(target.node.start, target.node.end),
  };
}
