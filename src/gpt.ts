import OpenAI from "openai";
import { MAWPSProblem, SplitProblem } from "./types";

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
                "a short paragraph explaining the context (world state) given in the problem " +
                "and a separate sentence explaining the question that the problem is asking. " +
                "For each problem, respond with only these two components, " +
                "labeling the first component with 'CONTEXT:' and the second component with 'QUESTION:'." +
                "It is okay if you do not use the exact wording provided in the problem, " +
                "but please preserve all numerical values. " +
                "The goal is for a human to be able to read the question statement " +
                "and know what to look for in the context to solve the problem." +
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
): Promise<SplitProblem[]> {
    const problemTexts: string[] = problems.map((p) => p.original_text);
    const messages = assembleMessages(problemTexts);
    const completion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-3.5-turbo",
    });
    const response = completion.choices[0].message.content;
    return splitResponseIntoParts(response);
}

/**
 * Splits a response string into an array of SplitProblem objects.
 *
 * @param response - The response string to split.
 * @return An array of SplitProblem objects representing each part of the response.
 */
function splitResponseIntoParts(response: string): SplitProblem[] {
    const ret: SplitProblem[] = [];
    const lines = response.split("\n").filter((line) => line.trim() !== "");
    for (let i = 0; i < lines.length; i += 2) {
        let context = lines[i].split("CONTEXT:")[1];
        let question = lines[i + 1].split("QUESTION:")[1];
        if (
            context === undefined ||
            context.trim() === "" ||
            question === undefined ||
            question.trim() === ""
        ) {
            i++;
            continue;
        }
        ret.push({
            context: context.trim(),
            question: question.trim(),
        });
    }

    return ret;
}

export { splitProblemsWithGPT as splitProblemWithGPT };
