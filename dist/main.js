"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const gpt_1 = require("./gpt");
// extract command line arguments
const dataFiles = process.argv.slice(2);
// look for files in data directory
const dataDir = path_1.default.join(__dirname, "..", "data");
const problemLimit = 2;
dataFiles.forEach(async (dataFile) => {
    const filePath = path_1.default.join(dataDir, dataFile);
    const content = fs_1.default.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);
    const problems = await (0, gpt_1.splitProblemWithGPT)(json.slice(0, problemLimit));
    console.log(problems);
});
