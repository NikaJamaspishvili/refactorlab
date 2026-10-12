const exercises = [
  {
    id: 1,
    code: "EX-001",
    title: "Two Sum Indices",
    description:
      "Given an array of integers and a target value, return the indices of two numbers that add up to the target.",
    mainFunctionName: "twoSum",
    tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
    ],
    HotLines: "Use a hash map for O(n) lookup of complement values.",
    submissionScore: 76,
    difficulty: "EASY",
  },
  {
    id: 2,
    code: "EX-002",
    title: "Validate Balanced Brackets",
    description:
      "Check whether a string containing brackets is valid by ensuring all opening brackets are properly closed in order.",
    mainFunctionName: "isValidBrackets",
    tests: [
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false },
    ],
    HotLines: "A stack is the most reliable way to track opening brackets.",
    submissionScore: 70,
    difficulty: "EASY",
  },
  {
    id: 3,
    code: "EX-003",
    title: "Group Anagrams",
    description:
      "Group a list of words into arrays where each group contains words that are anagrams of one another.",
    mainFunctionName: "groupAnagrams",
    tests: [
      {
        input: [["eat", "tea", "tan", "ate", "nat", "bat"]],
        expected: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]],
      },
    ],
    HotLines: "Sort each word to build a stable grouping key.",
    submissionScore: 45,
    difficulty: "NORMAL",
  },
  {
    id: 4,
    code: "EX-004",
    title: "LRU Cache Implementation",
    description:
      "Implement an LRU cache supporting get and put in near O(1) time with fixed capacity.",
    mainFunctionName: "createLRUCache",
    tests: [
      {
        input: ["put(1,1), put(2,2), get(1), put(3,3), get(2)"],
        expected: [null, null, 1, null, -1],
      },
    ],
    HotLines: "Combine a hash map with a doubly linked list.",
    submissionScore: 56,
    difficulty: "HARD",
  },
  {
    id: 5,
    code: "EX-005",
    title: "Merge Overlapping Intervals",
    description:
      "Given a collection of intervals, merge all overlapping intervals and return the condensed result.",
    mainFunctionName: "mergeIntervals",
    tests: [
      {
        input: [
          [
            [1, 3],
            [2, 6],
            [8, 10],
            [15, 18],
          ],
        ],
        expected: [
          [1, 6],
          [8, 10],
          [15, 18],
        ],
      },
    ],
    HotLines: "Sort intervals by start time before merging.",
    submissionScore: 100,
    difficulty: "NORMAL",
  },
];

function AllExercises() {
  return (
    <div>
      <form>
        <select name="DIFFICULTY">
          <option value="ALL">ALL</option>
          <option value="HARD">HARD</option>
          <option value="NORMAL">NORMAL</option>
          <option value="EASY">EASY</option>
        </select>
        <input
          name="EXERCISE_TITLE"
          type="text"
          placeholder="Exercise Title..."
        />
        <select name="PROBLEM_STATUS">
          <option value="ALL">ALL</option>
          <option value="SOLVED">SOLVED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="FIRST_VIEW">FIRST VIEW</option>
        </select>
        <button type="submit">Filter</button>
      </form>

      <section>
        {exercises.map((result, index) => {
          const Status = !result.submissionScore
            ? "FIRST VIEW"
            : result.submissionScore === 100
              ? "SOLVED"
              : result.submissionScore < 100 && "IN PROGRESS";
          return (
            <div key={index}>
              <h1>{result.title}</h1>
              <p>{result.description}</p>
              <span
                style={{
                  color:
                    result.difficulty === "HARD"
                      ? "red"
                      : result.difficulty === "NORMAL"
                        ? "gray"
                        : "green",
                }}
              >
                {result.difficulty}
              </span>
              <span
                style={{
                  color:
                    Status === "FIRST VIEW"
                      ? "gray"
                      : Status === "IN PROGRESS"
                        ? "green"
                        : "red",
                }}
              >
                {Status}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default AllExercises;
