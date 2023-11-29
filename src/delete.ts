import path from "path";
import fs from "fs";
import { SplitMAWPSProblem } from "./types";

main();

/**
 * Filters out any problems with bad IDs.
 *
 * @param sourceFile - The name of the source file containing the problems
 * @param badIdFile - The name of the file containing bad IDs.
 */
function main() {
    // extract command line arguments
    const sourceFile = process.argv[2];
    const sourcePath = path.join(__dirname, "..", "data", sourceFile);
    const badIdFile = process.argv[3];
    const badIdPath = path.join(__dirname, "..", "data", badIdFile);
    const badIds: number[] = JSON.parse(fs.readFileSync(badIdPath, "utf8"));
    console.log(`Deleting ${badIds.length} problems`);
    const problems: SplitMAWPSProblem[] = JSON.parse(
        fs.readFileSync(sourcePath, "utf8")
    );
    const newProblems = problems
        .filter((problem) => !badIds.includes(problem.id))
        .map((problem) => {
            return {
                ...problem,
                verified: true,
            };
        });
    fs.writeFileSync(sourcePath, JSON.stringify(newProblems, null, 2));
}
