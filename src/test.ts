import { splitResponseIntoParts } from "./gpt";
import { MAWPSProblem } from "./types";

main();

function testSplitter() {
    const problems: MAWPSProblem[] = [
        {
            id: 1,
            original_text: "This is a test. What is 1 + 1?",
            segmented_text: "This is a test. What is 1 + 1?",
            equation: "1 + 1",
            ans: 2,
        },
        {
            id: 2,
            original_text: "This is another test. What is 1 + 2?",
            segmented_text: "This is another test. What is 1 + 2?",
            equation: "1 + 2",
            ans: 3,
        },
    ];
    const response =
        "SETUP: This is a test setup.\nQUESTION: What is 1 + 1?\nGive your answer as an integer.\nSETUP: This is a another test setup.\nPlease answer it.\nQUESTION: What is 1 + 2?";
    const res = splitResponseIntoParts(response, problems);
    console.log(res);
}

function main() {
    testSplitter();
}
