export type MAWPSProblem = {
    id: number;
    original_text: string;
    segmented_text: string;
    equation: string;
    ans: number;
};

export type SplitProblem = {
    context: string;
    question: string;
};
