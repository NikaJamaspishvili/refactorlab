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

function addReferencedIdentifiers(path, bucket) {
  if (!path?.node) return;

  if (path.isReferencedIdentifier()) {
    bucket.add(path.node.name);
  }

  path.traverse({
    Function(inner) {
      inner.skip();
    },
    Identifier(inner) {
      if (!inner.isReferencedIdentifier()) return;
      bucket.add(inner.node.name);
    },
  });
}

function getAssignedNames(path) {
  if (!path?.node) return [];

  if (path.isIdentifier()) {
    return [path.node.name];
  }

  if (path.isPattern()) {
    return Object.keys(path.getBindingIdentifiers());
  }

  if (path.isMemberExpression()) {
    const names = new Set();
    addReferencedIdentifiers(path.get("object"), names);
    if (path.node.computed) {
      addReferencedIdentifiers(path.get("property"), names);
    }
    return [...names];
  }

  return [];
}

function intersects(names, relevantNames) {
  return names.some((name) => relevantNames.has(name));
}

function findNamedFunctionPath(ast, mainFunctionName) {
  let found = null;

  babelTraverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id?.name === mainFunctionName) {
        found = path;
        path.stop();
      }
    },
    VariableDeclarator(path) {
      if (found) return;
      if (!path.get("id").isIdentifier({ name: mainFunctionName })) return;

      const init = path.get("init");
      if (!init.node) return;
      if (init.isFunctionExpression() || init.isArrowFunctionExpression()) {
        found = init;
        path.stop();
      }
    },
  });

  return found;
}

function processStatementPath(path, relevantNames, includedNodes) {
  if (!path?.node) return;

  const include = () => includedNodes.add(path.node);

  if (path.isReturnStatement()) {
    include();
    const arg = path.get("argument");
    if (arg.node) addReferencedIdentifiers(arg, relevantNames);
    return;
  }

  if (path.isVariableDeclaration()) {
    for (const declarator of path.get("declarations").reverse()) {
      const idPath = declarator.get("id");
      const assignedNames = getAssignedNames(idPath);
      if (!intersects(assignedNames, relevantNames)) continue;

      include();
      const init = declarator.get("init");
      if (init.node) addReferencedIdentifiers(init, relevantNames);
    }
    return;
  }

  if (path.isExpressionStatement()) {
    const expression = path.get("expression");

    if (expression.isAssignmentExpression()) {
      const left = expression.get("left");
      const assignedNames = getAssignedNames(left);
      if (!intersects(assignedNames, relevantNames)) return;

      include();
      addReferencedIdentifiers(expression.get("right"), relevantNames);
      return;
    }

    if (expression.isUpdateExpression()) {
      const assignedNames = getAssignedNames(expression.get("argument"));
      if (!intersects(assignedNames, relevantNames)) return;

      include();
    }

    return;
  }

  if (path.isIfStatement()) {
    const before = includedNodes.size;

    const consequent = path.get("consequent");
    if (consequent.isBlockStatement()) {
      processBlockPaths(consequent.get("body"), relevantNames, includedNodes);
    } else {
      processStatementPath(consequent, relevantNames, includedNodes);
    }

    const alternate = path.get("alternate");
    if (alternate.node) {
      if (alternate.isBlockStatement()) {
        processBlockPaths(alternate.get("body"), relevantNames, includedNodes);
      } else {
        processStatementPath(alternate, relevantNames, includedNodes);
      }
    }

    if (includedNodes.size > before) {
      include();
      addReferencedIdentifiers(path.get("test"), relevantNames);
    }

    return;
  }

  if (
    path.isForStatement() ||
    path.isForInStatement() ||
    path.isForOfStatement() ||
    path.isWhileStatement() ||
    path.isDoWhileStatement()
  ) {
    const before = includedNodes.size;

    const body = path.get("body");
    if (body.isBlockStatement()) {
      processBlockPaths(body.get("body"), relevantNames, includedNodes);
    } else {
      processStatementPath(body, relevantNames, includedNodes);
    }

    if (includedNodes.size > before) {
      include();
      const test = path.get("test");
      if (test.node) addReferencedIdentifiers(test, relevantNames);

      const init = path.get("init");
      if (init?.node) addReferencedIdentifiers(init, relevantNames);

      const update = path.get("update");
      if (update?.node) addReferencedIdentifiers(update, relevantNames);
    }
  }
}

function processBlockPaths(statementPaths, relevantNames, includedNodes) {
  for (const path of [...statementPaths].reverse()) {
    processStatementPath(path, relevantNames, includedNodes);
  }
}

function toLineResult(code, nodes) {
  const sortedNodes = [...nodes].sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }

    return right.end - left.end;
  });

  const dedupedNodes = [];

  for (const node of sortedNodes) {
    const isContained = dedupedNodes.some(
      (outer) => node.start >= outer.start && node.end <= outer.end,
    );

    if (isContained) continue;

    dedupedNodes.push(node);
  }

  return dedupedNodes
    .sort((left, right) => {
      const leftLine = left.loc?.start.line ?? Number.MAX_SAFE_INTEGER;
      const rightLine = right.loc?.start.line ?? Number.MAX_SAFE_INTEGER;
      return leftLine - rightLine;
    })
    .map((node) => ({
      startLine: node.loc?.start.line,
      endLine: node.loc?.end.line,
      content: code.slice(node.start, node.end),
    }));
}

export function findOutputAffectingLines(code, mainFunctionName) {
  const ast = parseCode(code);
  const mainFunctionPath = findNamedFunctionPath(ast, mainFunctionName);

  if (!mainFunctionPath?.node) return [];

  const bodyPath = mainFunctionPath.get("body");
  if (!bodyPath.isBlockStatement()) {
    return [
      {
        startLine: mainFunctionPath.node.loc?.start.line,
        endLine: mainFunctionPath.node.loc?.end.line,
        content: code.slice(mainFunctionPath.node.start, mainFunctionPath.node.end),
      },
    ];
  }

  const relevantNames = new Set();
  const includedNodes = new Set();

  mainFunctionPath.traverse({
    Function(inner) {
      if (inner !== mainFunctionPath) {
        inner.skip();
      }
    },
    ReturnStatement(path) {
      includedNodes.add(path.node);
      const arg = path.get("argument");
      if (arg.node) addReferencedIdentifiers(arg, relevantNames);
    },
  });

  processBlockPaths(bodyPath.get("body"), relevantNames, includedNodes);

  return toLineResult(code, includedNodes);
}

export function getOutputAffectingLines(filepath, mainFunctionName) {
  const code = fs.readFileSync(filepath, "utf8");
  return findOutputAffectingLines(code, mainFunctionName);
}
