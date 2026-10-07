import vm from "node:vm";

function runUserFunction(code, functionName, args) {
  const context = vm.createContext({});
  const wrapped = `
    ${code}
    if (typeof ${functionName} !== "function") {
      throw new Error("Function '${functionName}' not found");
    }
    ${functionName}(...__ARGS__);
  `;

  const script = new vm.Script(wrapped);
  context.__ARGS__ = args;
  return script.runInContext(context, { timeout: 300 }); // ms
}

export async function RunTests(TEST_CASES, functionName, code) {
  try {
    if (!code || !functionName) {
      return { ok: false, message: "Missing code or functionName" };
    }

    const failedTests = [];

    for (const test of TEST_CASES) {
      let actual;
      try {
        const args = Array.isArray(test.input) ? test.input : [test.input];

        actual = runUserFunction(code, functionName, args);
      } catch (error) {
        failedTests.push({
          name: test.name || "NoName",
          input: test.input,
          expected: test.expected,
          actual: null,
          message: error.message,
        });
        continue;
      }

      if (actual !== test.expected) {
        failedTests.push({
          name: test.name || "NoName",
          input: test.input,
          expected: test.expected,
          actual,
          message: `Expected ${test.expected}, got ${actual}`,
        });
      }
    }

    const passed = TEST_CASES.length - failedTests.length;
    const ok = failedTests.length === 0;

    return {
      ok,
      summary: `${passed}/${TEST_CASES.length} tests passed`,
      failedTests,
      returnValue: ok ? "FUNCTION_CORRECT" : "FUNCTION_INCORRECT",
    };
  } catch (error) {
    return { ok: false, message: "Invalid request", error: error.message };
  }
}
