import path from "path";
import fs from "fs";
import { MAWPSProblem, SplitMAWPSProblem } from "./types";
import { splitProblemsWithGPT } from "./gpt";

/** Number of problems to ask GPT to split in a single request. */
const BATCH_SIZE = 5;
/** Number of concurrent batch requests to make at a time. */
const REQUEST_BATCH_SIZE = 60;
/** Milliseconds between requests. */
const TIME_BETWEEN_REQUESTS = 60 * 1500;

main();

function main() {
    // extract command line arguments
    const dataFile = process.argv[2];

    // look for files in data directory
    const dataDir = path.join(__dirname, "..", "data");
    const filePath = path.join(dataDir, dataFile);
    splitAll(filePath);
}

/**
 * Splits all problems in a given file into batches and sends them for processing.
 *
 * @param filePath - The path of the file containing the problems.
 */
function splitAll(filePath: string) {
    console.log(`Splitting problems in ${filePath}`);
    const filePathNoExt = path.join(
        path.dirname(filePath),
        path.basename(filePath, path.extname(filePath))
    );
    const outPath = `${filePathNoExt}_split.json`;
    // if output file doesn't exist, create it
    if (!fs.existsSync(outPath)) {
        fs.writeFileSync(outPath, "[]");
    }
    const content = fs.readFileSync(filePath, "utf8");
    const json: MAWPSProblem[] = JSON.parse(content);
    const batches = makeBatches(json, BATCH_SIZE, outPath);
    const sendBatch = () => {
        const promises = batches
            .splice(0, REQUEST_BATCH_SIZE)
            .map((batch) => splitProblemsWithGPT(batch));
        Promise.all(promises).then((results) => {
            // concatenate results
            const concatenatedResults = results.flat();
            // append to output file
            const previous: SplitMAWPSProblem[] = JSON.parse(
                fs.readFileSync(outPath, "utf8")
            );
            const newWrite = [...previous, ...concatenatedResults];
            fs.writeFileSync(outPath, JSON.stringify(newWrite, null, 2));
        });
        if (batches.length > 0) {
            setTimeout(sendBatch, TIME_BETWEEN_REQUESTS);
        }
    };
    sendBatch();
}

/**
 * Generates batches of MAWPS problems based on the given batch size.
 *
 * @param problems - An array of MAWPS problems.
 * @param batchSize - The size of each batch.
 * @param logPath - The path of the log file to read from to filter out unnecessary problems.
 * @return An array of batches, each containing MAWPS problems.
 */
function makeBatches(
    problems: MAWPSProblem[],
    batchSize: number,
    logPath?: string
): MAWPSProblem[][] {
    let problems_ = problems;
    if (logPath) {
        const existing: SplitMAWPSProblem[] = JSON.parse(
            fs.readFileSync(logPath, "utf8")
        );
        console.log("number of existing ids: ", existing.length);
        const existingIds = existing.map((p) => p.id);
        problems_ = problems.filter((p) => !existingIds.includes(p.id));
    }
    const ret: MAWPSProblem[][] = [];
    for (let i = 0; i < problems_.length; i += batchSize) {
        ret.push(problems_.slice(i, i + batchSize));
    }
    console.log(
        "number of problems: ",
        problems.length,
        "number of batches",
        ret.length
    );
    return ret;
}
