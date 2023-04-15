# Flashcard Maker

CLI application to create flashcards for memcode.com. Uses ChatGPT to convert markdown files with questions and answers into html formatted excel sheets ready for import into memcode.


## Install

1. Install Node.js (https://nodejs.org/en/download/) - it is recommended to use the latest LTS version.
2. Install/Activate Yarn Berry (https://yarnpkg.com/getting-started/install)
3. Clone the repository: `git clone git@github.com:daniel-eder/flashcard-maker.git`
4. Install dependencies: `yarn install`

## Usage

1. Run `cp .env.example .env` to create the environment file
2. Enter your OpenAI API key in the `.env` file
3. Run `yarn start --input=<path to input markdown file>`

### Input Format 

The input file must be a markdown file with the following format:

```md
# Question 1
Full text answer that should be summarized for the flashcard.

# Question 2
Full text answer that should be summarized for the flashcard.

...
```

## Licensing

Copyright (c) 2023 Daniel Eder

Licensed under the MIT License, see [LICENSE](./LICENSE) for more information.
