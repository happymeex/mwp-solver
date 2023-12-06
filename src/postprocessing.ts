import fs from "fs";
import path from "path";
import { SplitMAWPSProblem } from "./types";

const TRAIN_PROPORTION = 0.7;

type SVAMPProblem = {
    ID: number;
    Body: string;
    Question: string;
    Equation: string;
    Answer: number;
    Type: string;
};

main();

function main() {
    const dataDir = path.join(__dirname, "..", "data");
    const filePath = path.join(dataDir, "SVAMP.json");
    let allProblems: SVAMPProblem[] = JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );

    const mawpsTestPath = path.join(dataDir, "testset_split.json");
    const mawpsTrainPath = path.join(dataDir, "trainset_split.json");
    const mawpsValidPath = path.join(dataDir, "validset_split.json");

    [mawpsTestPath, mawpsTrainPath, mawpsValidPath].forEach((mawpsPath) => {
        const mawpsProblems: SplitMAWPSProblem[] = JSON.parse(
            fs.readFileSync(mawpsPath, "utf8")
        );
        const convertedProblems: SVAMPProblem[] =
            mawpsProblems.map(mawpsToSvamp);
        allProblems = allProblems.concat(convertedProblems);
    });
    console.log("All problems:", allProblems.length);
    // randomly arrange the problems
    allProblems = allProblems.sort(() => Math.random() - 0.5);
    // extract train and test from allProblems
    const splitIndex = Math.floor(TRAIN_PROPORTION * allProblems.length);
    const trainProblems = allProblems.slice(0, splitIndex);
    const testProblems = allProblems.slice(splitIndex);
    // write train and test to files
    fs.writeFileSync(
        path.join(dataDir, "full_trainset.json"),
        JSON.stringify(trainProblems, null, 2)
    );
    fs.writeFileSync(
        path.join(dataDir, "full_testset.json"),
        JSON.stringify(testProblems, null, 2)
    );
}

function mawpsToSvamp(mawpsProblem: SplitMAWPSProblem): SVAMPProblem {
    return {
        ID: mawpsProblem.id,
        Body: mawpsProblem.context,
        Question: mawpsProblem.question,
        Equation: mawpsProblem.equation,
        Answer: mawpsProblem.ans,
        Type: "mawps",
    };
}
