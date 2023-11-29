# MWP Data Preprocessor

This repository contains code for data preprocessing
of _math word problems_ (MWPs) found in
the MAWPS dataset.
Specifically, it separates a problem statement into a body (containing problem context)
and a question statement.
This is carried out using OpenAI's API.

## Usage

Make sure you set the environment variable `OPENAI_API_KEY`,
and that you have credits at the Tier 1 level of usage.

Install dependencies with `npm i`.
Run `npm run build` to compile, then run
`npm run X:split` where `X` is replaced by one of `train`, `test`, and `valid`.
This will produce a file `data/X_split.json`.
