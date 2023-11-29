import path from "path";
import fs from "fs";

main();

function main() {
    const sourceFile = process.argv[2];
    const sourcePath = path.join(__dirname, "..", "data", sourceFile);
    let problems = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    // make sure problems have id
    problems = problems.filter((problem) => problem.id);
    fs.writeFileSync(sourcePath, JSON.stringify(problems, null, 2));
}
