"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const gpt_1 = require("./gpt");
/** Number of problems to ask GPT to split in a single request. */
const BATCH_SIZE = 6;
/** Number of concurrent batch requests to make at a time. */
const REQUEST_BATCH_SIZE = 50;
/** Milliseconds between requests. */
const TIME_BETWEEN_REQUESTS = 60 * 1500;
main();
function main() {
    // extract command line arguments
    const dataFile = process.argv[2];
    // look for files in data directory
    const dataDir = path_1.default.join(__dirname, "..", "data");
    const filePath = path_1.default.join(dataDir, dataFile);
    splitAll(filePath);
}
/**
 * Splits all problems in a given file into batches and sends them for processing.
 *
 * @param filePath - The path of the file containing the problems.
 */
function splitAll(filePath) {
    console.log(`Splitting problems in ${filePath}`);
    const filePathNoExt = path_1.default.join(path_1.default.dirname(filePath), path_1.default.basename(filePath, path_1.default.extname(filePath)));
    const outPath = `${filePathNoExt}_split.json`;
    // if output file doesn't exist, create it
    if (!fs_1.default.existsSync(outPath)) {
        fs_1.default.writeFileSync(outPath, "[]");
    }
    const content = fs_1.default.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);
    const batches = makeBatches(json, BATCH_SIZE, outPath);
    const sendBatch = () => {
        const promises = batches
            .splice(0, REQUEST_BATCH_SIZE)
            .map((batch) => (0, gpt_1.splitProblemsWithGPT)(batch));
        Promise.all(promises).then((results) => {
            // concatenate results
            const concatenatedResults = results.flat();
            // append to output file
            const previous = JSON.parse(fs_1.default.readFileSync(outPath, "utf8"));
            const newWrite = [...previous, ...concatenatedResults];
            fs_1.default.writeFileSync(outPath, JSON.stringify(newWrite));
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
function makeBatches(problems, batchSize, logPath) {
    let problems_ = problems;
    if (logPath) {
        const existing = JSON.parse(fs_1.default.readFileSync(logPath, "utf8"));
        const existingIds = existing.map((p) => p.id);
        problems_ = problems.filter((p) => !existingIds.includes(p.id));
    }
    const ret = [];
    for (let i = 0; i < problems_.length; i += batchSize) {
        ret.push(problems_.slice(i, i + batchSize));
    }
    console.log("number of problems: ", problems.length, "number of batches", ret.length);
    return ret;
}
