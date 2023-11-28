import path from "path";
import fs from "fs";
import { MAWPSProblem } from "./types";
import { splitProblemWithGPT } from "./gpt";

// extract command line arguments
const dataFiles = process.argv.slice(2);

// look for files in data directory
const dataDir = path.join(__dirname, "..", "data");
const problemLimit = 2;
dataFiles.forEach(async (dataFile) => {
    const filePath = path.join(dataDir, dataFile);
    const content = fs.readFileSync(filePath, "utf8");
    const json: MAWPSProblem[] = JSON.parse(content);
    const problems = await splitProblemWithGPT(json.slice(0, problemLimit));
    console.log(problems);
});
