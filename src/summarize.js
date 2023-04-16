import * as dotenv from 'dotenv'
import minimist from 'minimist';
import fs from 'fs';
import showdown from 'showdown';
import writeExcelFile from 'write-excel-file/node';
import {Configuration, OpenAIApi} from 'openai';

class App {
  constructor(args, openAiApiKey) {
    this.argv = minimist(args.slice(2), {
      alias: {i: 'input', o: 'output'},
    });

    this.converter = new showdown.Converter();

    const configuration = new Configuration({
      apiKey: openAiApiKey,
    });
    this.openAiApi = new OpenAIApi(configuration);
    this.model = "gpt-4";
  }

  async run() {
    const inputFile = this.argv.input;
    const outputFile = this.argv.output;

    const markdown = await this.readInput(inputFile);
    const questionAnswerPairs = this.splitByHeadings(markdown);
    const prompt = await this.readPrompt();

    const flashcards = [];

    let questionIndex = 0;
    for (const questionAnswerPair of questionAnswerPairs) {
      console.log(`Processing question ${++questionIndex} of ${questionAnswerPairs.length}...`);
      const {question, _} = this.splitQuestionAndAnswer(questionAnswerPair);

      try {
        const response = await this.createChatCompletion(prompt, questionAnswerPair);
        const flashcard = this.convertCompletionToFlashcard(question, response);
        flashcards.push(flashcard);
      } catch (error) {
        console.error(`Error processing question (${questionIndex}) "${question}":`, error);
        break;
      }
    }

    await this.writeExcelFile(outputFile, flashcards);
    console.log(`Wrote ${flashcards.length} flashcards to ${outputFile}.`)
  }

  async readInput(file) {
    return fs.promises.readFile(file, 'utf-8');
  }

  splitByHeadings(markdown) {
    const headingRegex = /(^|\n)(#{1,6} .+)/g;
    const sections = markdown.split(headingRegex).filter(section => section.trim() !== '');

    // Combine heading and corresponding body text into a single string
    const combinedSections = [];
    for (let i = 0; i < sections.length; i += 2) {
      const heading = sections[i].trim();
      const body = sections[i + 1].trim();
      combinedSections.push(`${heading}\n${body}`);
    }

    return combinedSections;
  }

  splitQuestionAndAnswer(combinedSection) {
    const headingRegex = /^(#{1,6})\s+(.+)/m;
    const match = combinedSection.match(headingRegex);

    if (match) {
      const question = match[2].trim();
      const answer = combinedSection.replace(match[0], '').trim();
      return {question, answer};
    }

    return {question: '', answer: ''};
  }

  async readPrompt() {
    return fs.promises.readFile('data/summarize_prompt.txt', 'utf-8');
  }

  async createChatCompletion(prompt, questionAnswerPair) {
    // Add your implementation for the OpenAI API call
    const messages = [
      {role: "system", content: prompt},
      {role: "user", content: questionAnswerPair},
    ]
    const completion = await this.openAiApi.createChatCompletion({
      model: this.model,
      messages: messages,
      temperature: 0.2,
    });
    return completion.data.choices[0].message;
  }

  convertCompletionToFlashcard(question, response) {
    const answerHtml = this.converter.makeHtml(response.content);

    return {question, answer: answerHtml};
  }

  async writeExcelFile(file, flashcards) {
    const data = [[{
      value: 'Question',
      type: String
    }, {
      value: 'Answer',
      type: String
    }], ...flashcards.map(({question, answer}) => [{
      value: question,
      type: String
    }, {
      value: answer,
      type: String
    }])];
    await writeExcelFile(data, {filePath: file});
  }
}

dotenv.config(); //load env vars
const app = new App(process.argv, process.env.OPENAI_API_KEY);
app.run().catch((error) => console.error('An error occurred:', error));
