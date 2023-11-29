import OpenAI from "openai";
import { MAWPSProblem, SplitMAWPSProblem } from "./types";

const openai = new OpenAI();

/**
 * Generates a list of chat completion message parameters based on a list of problem texts.
 *
 * @param problemTexts - An array of problem texts.
 * @return The list of chat completion message parameters.
 */
function assembleMessages(
    problemTexts: string[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
    const [firstProblem, ...otherProblems] = problemTexts;
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] =
        otherProblems.map((problemText) => ({
            role: "user",
            content: "Next problem: " + problemText,
        }));
    return [
        {
            role: "system",
            content:
                "You are a helpful math teacher who can parse math problems and discern the context from the question.",
        },
        {
            role: "user",
            content:
                "Parse the following math problems and rewrite each into two components, " +
                "a short paragraph explaining the setup (world state) given in the problem " +
                "and a separate sentence explaining the question that the problem is asking. " +
                "For each problem, respond with only these two components, " +
                "labeling the first component with 'SETUP:' and the second component with 'QUESTION:'." +
                "It is okay if you do not use the exact wording provided in the problem, " +
                "but please preserve all numerical values and mathematical correctness. " +
                "First problem: " +
                firstProblem,
        },
        ...messages,
    ];
}

/**
 * Splits a given array of MAWPS problems into an array of SplitProblems using GPT-3.5-turbo.
 *
 * @param problems - The array of MAWPS problems to be split.
 * @return A promise that resolves to an array of SplitProblems.
 */
async function splitProblemsWithGPT(
    problems: MAWPSProblem[]
): Promise<SplitMAWPSProblem[]> {
    const problemTexts: string[] = problems.map((p) => p.original_text);
    const messages = assembleMessages(problemTexts);
    const completion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-3.5-turbo",
    });
    const response = completion.choices[0].message.content;
    return splitResponseIntoParts(response, problems);
}

/**
 * Splits a response string into an array of SplitProblem objects.
 *
 * @param response - The response string to split.
 * @return An array of SplitProblem objects representing each part of the response.
 */
function splitResponseIntoParts(
    response: string,
    problems: MAWPSProblem[]
): SplitMAWPSProblem[] {
    const ret: SplitMAWPSProblem[] = [];
    const lines = response.split("\n").filter((line) => line.trim() !== "");
    if (lines.length % 2 !== 0) {
        console.log("response had extra line:", lines[lines.length - 1]);
        lines.pop();
    }
    let problemIndex = 0;
    for (let i = 0; i < lines.length; i += 2) {
        let context = lines[i].split("SETUP:")[1];
        let question = lines[i + 1].split("QUESTION:")[1];
        if (
            context === undefined ||
            context.trim() === "" ||
            question === undefined ||
            question.trim() === ""
        ) {
            i++;
            problemIndex++;
            continue;
        }
        const problem = problems[problemIndex];
        ret.push({
            ...problem,
            context: context.trim(),
            question: question.trim(),
        });
        problemIndex++;
    }

    return ret;
}

export { splitProblemsWithGPT };
