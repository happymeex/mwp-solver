import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { SplitMAWPSProblem } from "./types";

const openai = new OpenAI();

const BATCH_SIZE = 60;
const TIME_BETWEEN_REQUESTS = 60 * 1005;

main();

function main() {
    // extract command line arguments
    const dataFile = process.argv[2];
    const dataPath = path.join(__dirname, "..", "data", dataFile);
    getBadIds(dataPath);
}

function assembleValidationMessage(
    problem: SplitMAWPSProblem
): OpenAI.Chat.ChatCompletionMessageParam[] {
    return [
        {
            role: "system",
            content:
                "You are a helpful math teacher who is checking the correctness of an automated problem-rewriting system.",
        },
        {
            role: "user",
            content:
                "I will give you two math problems. " +
                "Answer 'YES' if the second problem is a rewritten version of the first. Otherwise, answer 'NO'. " +
                "First problem: " +
                problem.original_text +
                "\n" +
                "Second problem: " +
                problem.context +
                " " +
                problem.question,
        },
    ];
}
/**
 * Retrieves bad ids from a file and stores them in a separate file.
 *
 * @param filePath - The path of the file to retrieve bad ids from.
 */
function getBadIds(filePath: string): void {
    const idStoragePath = path.join(
        path.dirname(filePath),
        path.basename(filePath, ".json") + "_bad_ids.json"
    );
    console.log(
        "Getting bad ids from " + filePath,
        +"\n" + "writing to",
        idStoragePath
    );
    if (!fs.existsSync(idStoragePath)) {
        fs.writeFileSync(idStoragePath, "[]");
    }
    let problems: SplitMAWPSProblem[] = JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );
    // filter out problems that are already verified
    problems = problems.filter((problem) => !problem.verified);
    const sendBatch = () => {
        const batch = problems.splice(0, BATCH_SIZE);
        const promises = batch.map((problem) => {
            const message = assembleValidationMessage(problem);
            return openai.chat.completions
                .create({
                    messages: message,
                    model: "gpt-3.5-turbo",
                })
                .then((response) => {
                    return response.choices[0].message.content;
                });
        });
        const answerPromise = Promise.all(promises).then((results) => {
            return results.map(isYes);
        });
        answerPromise
            .then((answers) => {
                const idsToDelete: number[] = [];
                for (let i = 0; i < batch.length; i++) {
                    if (!answers[i]) {
                        idsToDelete.push(batch[i].id);
                    }
                }
                return idsToDelete;
            })
            .then((idsToDelete) => {
                const existingIds: number[] = JSON.parse(
                    fs.readFileSync(idStoragePath, "utf8")
                );
                const newIds = [...existingIds, ...idsToDelete];
                fs.writeFileSync(idStoragePath, JSON.stringify(newIds));
            });
        if (problems.length > 0) {
            setTimeout(sendBatch, TIME_BETWEEN_REQUESTS);
        }
    };
    sendBatch();
}

function isYes(message: string): boolean {
    return (
        message.includes("YES") ||
        message.includes("Yes") ||
        message.includes("yes")
    );
}
