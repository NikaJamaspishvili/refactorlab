export const STATUS = {
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
};

export const METRIC = {
  COMPLEXITY: "complexity",
  DUPLICATION: "duplication",
  FUNCTION_SIZE: "function_size",
};

export const DEDUCTION_PER_ISSUE = 5;

export const RULE_TO_METRIC = {
  "sonarjs/expression-complexity": METRIC.COMPLEXITY,
  "sonarjs/nested-control-flow": METRIC.COMPLEXITY,
  "sonarjs/no-nested-functions": METRIC.COMPLEXITY,
  "sonarjs/no-collapsible-if": METRIC.COMPLEXITY,
  "sonarjs/elseif-without-else": METRIC.COMPLEXITY,
  "sonarjs/too-many-break-or-continue-in-loop": METRIC.COMPLEXITY,
  "sonarjs/no-nested-switch": METRIC.COMPLEXITY,
  "sonarjs/no-identical-conditions": METRIC.COMPLEXITY,
  "sonarjs/no-duplicated-branches": METRIC.COMPLEXITY,
  "sonarjs/no-gratuitous-expressions": METRIC.COMPLEXITY,
  "sonarjs/max-lines": METRIC.COMPLEXITY,
  "sonarjs/regex-complexity": METRIC.COMPLEXITY,
  "sonarjs/max-lines-per-function": METRIC.FUNCTION_SIZE,
};

export const COMPLEXITY_RULE_GROUP = {
  "sonarjs/nested-control-flow": "Too much nesting 🪜",
  "sonarjs/no-nested-functions": "Too much nesting 🪜",
  "sonarjs/no-nested-switch": "Too much nesting 🪜",
  "sonarjs/expression-complexity": "Hard to read logic 🤯",
  "sonarjs/no-gratuitous-expressions": "Hard to read logic 🤯",
  "sonarjs/regex-complexity": "Hard to read logic 🤯",
  "sonarjs/no-collapsible-if": "If/else can be cleaner 🌿",
  "sonarjs/elseif-without-else": "If/else can be cleaner 🌿",
  "sonarjs/no-identical-conditions": "If/else can be cleaner 🌿",
  "sonarjs/no-duplicated-branches": "If/else can be cleaner 🌿",
  "sonarjs/too-many-break-or-continue-in-loop": "Loop is hard to follow 🔁",
  "sonarjs/max-lines": "File is too big 📦",
};

export const RULE_HINTS = {
  "sonarjs/expression-complexity":
    "This line is doing too much 🤯. Split it into small steps with clear names.",
  "sonarjs/nested-control-flow":
    "Too many nested blocks 🪜. Try early returns so the code stays flat and easier to read.",
  "sonarjs/no-nested-functions":
    "Function inside function inside function is hard to read. Move inner code into small helper functions.",
  "sonarjs/no-collapsible-if":
    "These `if` checks can be combined 🌿. Merge them to make the logic shorter.",
  "sonarjs/elseif-without-else":
    "Your `if / else if` chain has no final fallback. Add a final `else` when needed.",
  "sonarjs/too-many-break-or-continue-in-loop":
    "This loop has too many exits 🔁. Simplify loop conditions so flow is easier to follow.",
  "sonarjs/no-nested-switch":
    "Nested `switch` is hard to track. Move inner decision logic to a helper function.",
  "sonarjs/no-identical-conditions":
    "Some conditions are repeated. Remove duplicates so logic is clearer.",
  "sonarjs/no-duplicated-branches":
    "Different branches do the same thing. Keep one shared path instead ✂️.",
  "sonarjs/no-gratuitous-expressions":
    "This boolean check is longer than needed. Simplify it ✅.",
  "sonarjs/max-lines":
    "This file is too big 📦. Split it into smaller files by responsibility.",
  "sonarjs/regex-complexity":
    "This regex is hard to read. Make it simpler or split it into smaller parts.",
  "sonarjs/max-lines-per-function":
    "This function is too long ✂️. Split it into smaller steps.",
};

export function fallbackHintForMetric(metric) {
  if (metric === METRIC.COMPLEXITY) {
    return "This part feels complex 🤯. Try smaller steps and less nesting.";
  }

  if (metric === METRIC.DUPLICATION) {
    return "I found repeated code 🔁. Move shared logic into one helper.";
  }

  return "This function is bigger than it should be 📏. Split it into smaller focused functions.";
}

export function metricLabel(metric) {
  if (metric === METRIC.COMPLEXITY) return "Complexity";
  if (metric === METRIC.DUPLICATION) return "Duplication";
  return "Function size";
}
