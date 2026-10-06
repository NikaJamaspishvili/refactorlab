export const STATUS = {
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
};

export const GROUPS = {
  LOGIC: "Program Logic & Bugs",
  MAINTAINABILITY: "Maintainability & Structure",
  READABILITY: "Modern Readability",
  SECURITY: "Security & Safety",
};
export let sonarRuleDictionary = {
  // --- 1. PROGRAM LOGIC & BUGS 🔴 ---

  "sonarjs/no-all-duplicated-branches": {
    group: GROUPS.LOGIC,
    context: "CONTROL_FLOW",
    title: "Identical Conditional Branches",
    description:
      "All branches in an if/else or switch statement execute the exact same logic.",
    hint_1: `
      <ul>
        <li>Compare the code inside each conditional branch.</li>
        <li>Look for identical returns, assignments, or function calls.</li>
        <li>Check whether the condition is actually creating different behavior.</li>
        <li>Move shared logic outside the conditional when possible.</li>
        <li>Merge equivalent branches or restore missing branch-specific behavior.</li>
        <li>Make sure the final condition represents a meaningful decision.</li>
      </ul>
    `,
  },

  "sonarjs/void-use": {
    group: GROUPS.LOGIC,
    context: "STATEMENT",
    title: "Void Return Used as Value",
    description:
      "The output of a function returning void/undefined is used in an assignment or expression.",
    hint_1: `
      <ul>
        <li>Find where the result of the function call is being used.</li>
        <li>Check whether the called function actually returns a meaningful value.</li>
        <li>Remove assignments or expressions that depend on an undefined result.</li>
        <li>If a value is required, consider changing the function to return one explicitly.</li>
        <li>Separate side-effect operations from calculations that expect a returned value.</li>
      </ul>
    `,
  },

  "sonarjs/no-element-overwrite": {
    group: GROUPS.LOGIC,
    context: "STATEMENT",
    title: "Overwritten Array or Object Value",
    description:
      "An array index or object key is assigned a value that is overwritten before being read.",
    hint_1: `
      <ul>
        <li>Inspect repeated assignments to the same array index or object property.</li>
        <li>Check whether the earlier assigned value is ever used before being replaced.</li>
        <li>Remove assignments that have no effect on the final result.</li>
        <li>Verify that the correct key or index is being updated each time.</li>
        <li>Make sure an accidental overwrite is not hiding a missing read or operation.</li>
      </ul>
    `,
  },

  "sonarjs/no-ignored-return": {
    group: GROUPS.LOGIC,
    context: "STATEMENT",
    title: "Ignored Method Return Value",
    description:
      "Calling an immutable method without saving its return value leaves original state unchanged.",
    hint_1: `
      <ul>
        <li>Check methods that return a new value instead of modifying the original one.</li>
        <li>Look for calls whose returned result is immediately discarded.</li>
        <li>Assign the returned value when the updated result is needed later.</li>
        <li>Return or pass the new value directly when storing it is unnecessary.</li>
        <li>Verify whether the method is mutable or immutable before assuming state changed.</li>
      </ul>
    `,
  },

  "sonarjs/no-collection-size-mischeck": {
    group: GROUPS.LOGIC,
    context: "EXPRESSION",
    title: "Invalid Collection Size Check",
    description:
      "Checking collection length with impossible logical conditions (e.g., length < 0).",
    hint_1: `
      <ul>
        <li>Review conditions that compare a collection's length or size.</li>
        <li>Check whether the comparison can ever realistically become true.</li>
        <li>Use zero when checking whether a collection is empty.</li>
        <li>Verify comparison operators such as &lt;, &gt;, ===, and !==.</li>
        <li>Rewrite the condition so it represents the actual size requirement.</li>
      </ul>
    `,
  },

  "sonarjs/no-identical-expressions": {
    group: GROUPS.LOGIC,
    context: "EXPRESSION",
    title: "Identical Expressions",
    description:
      "Both sides of a comparison or logical expression are identical, making the condition suspicious or redundant.",
    hint_1: `
      <ul>
        <li>Compare the expressions on both sides of the operator.</li>
        <li>Check whether the same variable, property, or function call was used accidentally.</li>
        <li>Replace the duplicated expression with the intended comparison value or condition.</li>
        <li>Remove the comparison entirely if it does not affect program behavior.</li>
        <li>Verify that copy-paste code did not introduce the duplicated expression.</li>
      </ul>
    `,
  },

  "sonarjs/no-identical-conditions": {
    group: GROUPS.LOGIC,
    context: "CONTROL_FLOW",
    title: "Duplicate Conditional Check",
    description:
      "Multiple branches test the same condition, making later branches unreachable or redundant.",
    hint_1: `
      <ul>
        <li>Compare conditions across if, else-if, and related branches.</li>
        <li>Check whether an earlier branch already handles the exact same condition.</li>
        <li>Correct the later condition if it was copied accidentally.</li>
        <li>Merge branches when they intentionally represent the same case.</li>
        <li>Verify that every branch can actually be reached.</li>
      </ul>
    `,
  },

  "sonarjs/no-use-of-empty-return-value": {
    group: GROUPS.LOGIC,
    context: "STATEMENT",
    title: "Empty Return Value Used",
    description:
      "A function result that can be empty or undefined is used as though it contains a meaningful value.",
    hint_1: `
      <ul>
        <li>Find where the returned value is consumed after the function call.</li>
        <li>Check every return path to see whether a usable value is always produced.</li>
        <li>Avoid using the result when the function may return without a value.</li>
        <li>Return an explicit value when callers are expected to consume the result.</li>
        <li>Separate side-effect-only functions from functions intended to produce values.</li>
      </ul>
    `,
  },

  // --- 2. MAINTAINABILITY & STRUCTURE 🟡 ---

  "sonarjs/max-lines-per-function": {
    group: GROUPS.MAINTAINABILITY,
    context: "FUNCTION",
    title: "Function Too Long",
    description:
      "A function contains too many lines and should be divided into smaller, focused units.",
    hint_1: `
      <ul>
        <li>Identify sections of the function that perform separate responsibilities.</li>
        <li>Extract self-contained calculations or transformations into helper functions.</li>
        <li>Move validation, formatting, persistence, or side effects into focused functions.</li>
        <li>Reduce repeated setup and cleanup logic where possible.</li>
        <li>Keep the main function focused on coordinating high-level steps.</li>
      </ul>
    `,
  },

  "sonarjs/nested-control-flow": {
    group: GROUPS.MAINTAINABILITY,
    context: "CONTROL_FLOW",
    title: "Deeply Nested Control Flow",
    description:
      "Control-flow statements are nested too deeply, making the execution path difficult to follow.",
    hint_1: `
      <ul>
        <li>Look for deeply nested if statements, loops, switches, or callbacks.</li>
        <li>Use early returns or guard clauses to reduce nesting.</li>
        <li>Extract nested logic into clearly named helper functions.</li>
        <li>Simplify complex conditions before adding another nesting level.</li>
        <li>Keep the main execution path visually shallow and easy to scan.</li>
      </ul>
    `,
  },

  "sonarjs/max-switch-cases": {
    group: GROUPS.MAINTAINABILITY,
    context: "CONTROL_FLOW",
    title: "Excessive Switch Cases",
    description:
      "Switch statement has too many cases; refactoring to map/object lookups improves readability.",
    hint_1: `
      <ul>
        <li>Review whether every switch case really requires separate control-flow logic.</li>
        <li>Look for cases that simply map one value to another value or function.</li>
        <li>Consider replacing simple mappings with an object, Map, or lookup table.</li>
        <li>Group cases that perform the same behavior.</li>
        <li>Extract complex case logic into clearly named functions.</li>
        <li>Keep the main decision structure focused and easy to scan.</li>
      </ul>
    `,
  },

  "sonarjs/no-identical-functions": {
    group: GROUPS.MAINTAINABILITY,
    context: "MULTI_LOCATION",
    title: "Duplicate Function Implementation",
    description:
      "Two or more functions contain identical implementation details.",
    hint_1: `
      <ul>
        <li>Compare functions that contain the same or nearly identical statements.</li>
        <li>Identify the common behavior shared by those functions.</li>
        <li>Move duplicated logic into a single reusable function.</li>
        <li>Pass differing values as parameters instead of duplicating the implementation.</li>
        <li>Keep separate functions only when they genuinely represent different behavior.</li>
      </ul>
    `,
  },

  "sonarjs/no-duplicate-string": {
    group: GROUPS.MAINTAINABILITY,
    context: "MULTI_LOCATION",
    title: "Repeated String Literal",
    description:
      "The same string literal is repeated across multiple lines; extract to a constant.",
    hint_1: `
      <ul>
        <li>Look for the same meaningful string repeated in multiple places.</li>
        <li>Determine whether those occurrences represent the same concept.</li>
        <li>Extract the shared value into a clearly named constant when appropriate.</li>
        <li>Reuse the constant instead of maintaining several copies of the string.</li>
        <li>Avoid extracting unrelated short strings that only happen to have identical text.</li>
      </ul>
    `,
  },

  "sonarjs/no-nested-template-literals": {
    group: GROUPS.MAINTAINABILITY,
    context: "EXPRESSION",
    title: "Nested Template Literal",
    description:
      "Template literals nested inside template expressions reduce code readability.",
    hint_1: `
      <ul>
        <li>Find template literals placed inside another template expression.</li>
        <li>Identify the inner value being constructed separately.</li>
        <li>Store complex interpolated content in a variable before building the final string.</li>
        <li>Consider using a small helper function for repeated formatting logic.</li>
        <li>Keep each template literal simple enough to understand at a glance.</li>
      </ul>
    `,
  },

  // --- 3. MODERN READABILITY 🟢 ---

  "sonarjs/prefer-object-literal": {
    group: GROUPS.READABILITY,
    context: "STATEMENT",
    title: "Use Object Literal Syntax",
    description:
      "Use modern object literal syntax instead of dynamic programmatic creation.",
    hint_1: `
      <ul>
        <li>Look for objects created first and populated property-by-property afterward.</li>
        <li>Check whether the object's properties are already known when it is created.</li>
        <li>Define known properties directly inside an object literal.</li>
        <li>Use computed property syntax only when property names are genuinely dynamic.</li>
        <li>Prefer the form that makes the object's final structure easiest to see.</li>
      </ul>
    `,
  },

  "sonarjs/prefer-single-boolean-return": {
    group: GROUPS.READABILITY,
    context: "CONTROL_FLOW",
    title: "Redundant Boolean Return",
    description:
      "Replace multi-line if/else boolean returns with direct expression return.",
    hint_1: `
      <ul>
        <li>Look for conditions where one branch returns true and the other returns false.</li>
        <li>Check whether the condition itself already produces a boolean value.</li>
        <li>Return the boolean expression directly when possible.</li>
        <li>Remove unnecessary if/else blocks that only translate a boolean into another boolean.</li>
        <li>Keep the longer form only when additional branch-specific work is required.</li>
      </ul>
    `,
  },

  "sonarjs/no-redundant-boolean": {
    group: GROUPS.READABILITY,
    context: "EXPRESSION",
    title: "Redundant Boolean Comparison",
    description:
      "Comparing boolean variables directly to true or false adds unnecessary noise.",
    hint_1: `
      <ul>
        <li>Find boolean values explicitly compared with true or false.</li>
        <li>Use the boolean variable or expression directly when checking for true.</li>
        <li>Use logical negation when checking whether a boolean value is false.</li>
        <li>Make sure the value is actually boolean before simplifying the comparison.</li>
        <li>Choose the form that communicates the condition with the least unnecessary syntax.</li>
      </ul>
    `,
  },

  "sonarjs/prefer-immediate-return": {
    group: GROUPS.READABILITY,
    context: "STATEMENT",
    title: "Unnecessary Local Variable",
    description:
      "Declaring a temporary variable solely to return it on the next line is redundant.",
    hint_1: `
      <ul>
        <li>Look for variables assigned immediately before a return statement.</li>
        <li>Check whether the variable is used anywhere else in the function.</li>
        <li>Return the expression directly when the variable adds no useful meaning.</li>
        <li>Keep the variable when its name improves understanding of a complex expression.</li>
        <li>Avoid temporary variables that only add an extra step without clarifying intent.</li>
      </ul>
    `,
  },

  "sonarjs/no-collapsible-if": {
    group: GROUPS.READABILITY,
    context: "CONTROL_FLOW",
    title: "Collapsible Nested If",
    description:
      "Nested if statements can be combined into a single condition without changing behavior.",
    hint_1: `
      <ul>
        <li>Look for an if statement whose only meaningful statement is another if.</li>
        <li>Combine compatible conditions with a logical operator when behavior stays the same.</li>
        <li>Check that neither level contains separate else behavior before merging.</li>
        <li>Prefer one clear condition over unnecessary nesting.</li>
        <li>Keep complex combined conditions readable by naming intermediate checks when needed.</li>
      </ul>
    `,
  },

  "sonarjs/no-nested-conditional": {
    group: GROUPS.READABILITY,
    context: "EXPRESSION",
    title: "Nested Conditional Expression",
    description:
      "Nested ternary or conditional expressions make code difficult to read and understand.",
    hint_1: `
      <ul>
        <li>Find conditional expressions placed inside another conditional expression.</li>
        <li>Replace complex nested ternaries with clearer if/else logic when appropriate.</li>
        <li>Extract intermediate decisions into clearly named variables or helper functions.</li>
        <li>Keep each conditional expression focused on one simple decision.</li>
        <li>Prefer readability over compressing several branches into one expression.</li>
      </ul>
    `,
  },

  // --- 4. SECURITY & SAFETY 🔵 ---

  "sonarjs/code-eval": {
    group: GROUPS.SECURITY,
    context: "STATEMENT",
    title: "Dynamic Code Evaluation",
    description:
      "Dynamically evaluating strings as executable code can introduce code-injection vulnerabilities.",
    hint_1: `
      <ul>
        <li>Look for eval, Function constructors, or similar dynamic code execution.</li>
        <li>Do not execute strings built from user-controlled or external input.</li>
        <li>Replace dynamic evaluation with explicit parsing or predefined operations.</li>
        <li>Use allowlisted commands or mappings when selecting behavior dynamically.</li>
        <li>Treat any externally influenced executable string as untrusted.</li>
      </ul>
    `,
  },

  "sonarjs/sql-queries": {
    group: GROUPS.SECURITY,
    context: "EXPRESSION",
    title: "Unsafe SQL Query Construction",
    description:
      "SQL queries built with untrusted values may allow SQL injection or unsafe query behavior.",
    hint_1: `
      <ul>
        <li>Look for SQL strings built with concatenation or interpolation.</li>
        <li>Use parameterized queries or prepared statements for external values.</li>
        <li>Keep query structure separate from user-controlled data.</li>
        <li>Validate dynamic identifiers when table or column names must be selected.</li>
        <li>Avoid relying on manual escaping as the primary injection defense.</li>
      </ul>
    `,
  },

  "sonarjs/weak-ssl": {
    group: GROUPS.SECURITY,
    context: "EXPRESSION",
    title: "Weak SSL/TLS Configuration",
    description:
      "Outdated or insecure SSL/TLS settings can weaken encrypted network communication.",
    hint_1: `
      <ul>
        <li>Check whether obsolete SSL or TLS protocol versions are enabled.</li>
        <li>Prefer modern TLS versions supported by the target environment.</li>
        <li>Avoid disabling certificate or hostname verification.</li>
        <li>Review cipher and protocol configuration for insecure legacy options.</li>
        <li>Use secure platform defaults unless there is a well-understood reason to override them.</li>
      </ul>
    `,
  },

  "sonarjs/no-hardcoded-secrets": {
    group: GROUPS.SECURITY,
    context: "EXPRESSION",
    title: "Hardcoded Credential Risk",
    description:
      "Secrets, private keys, or credentials detected directly in source code.",
    hint_1: `
      <ul>
        <li>Look for passwords, tokens, API keys, private keys, or credentials written directly in source code.</li>
        <li>Remove sensitive values from files that may be committed or shared.</li>
        <li>Load secrets from environment variables or an appropriate secret-management system.</li>
        <li>Use configuration placeholders rather than real credentials in examples.</li>
        <li>If a real secret was exposed, treat it as compromised and rotate it.</li>
      </ul>
    `,
  },

  "sonarjs/slow-regex": {
    group: GROUPS.SECURITY,
    context: "EXPRESSION",
    title: "Potential ReDoS Vulnerability",
    description:
      "Regular expression with catastrophic backtracking risk during evaluation.",
    hint_1: `
      <ul>
        <li>Inspect regular expressions containing nested or repeated quantifiers.</li>
        <li>Look for ambiguous patterns that can match the same input in many different ways.</li>
        <li>Simplify repeated groups and make matching boundaries more explicit.</li>
        <li>Avoid broad patterns when a more specific character set or structure can be used.</li>
        <li>Consider how the expression behaves with long or intentionally difficult input.</li>
      </ul>
    `,
  },
};
