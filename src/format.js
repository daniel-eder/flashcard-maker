import * as dotenv from 'dotenv';
import minimist from 'minimist';
import fs from 'fs';
import readExcelFile from 'read-excel-file/node';
import writeExcelFile from 'write-excel-file/node';
import {Configuration, OpenAIApi} from 'openai';

class App {
  constructor(args, openAiApiKey) {
    this.argv = minimist(args.slice(2), {
      alias: {i: 'input', o: 'output'},
    });

    const configuration = new Configuration({
      apiKey: openAiApiKey,
    });
    this.openAiApi = new OpenAIApi(configuration);
    this.model = "gpt-4";
  }

  async run() {
    const inputFile = this.argv.input;
    const outputFile = this.argv.output;

    const flashcards = await this.readExcel(inputFile);
    const prompt = await this.readPrompt();
    const formattedFlashcards = [];

    let flashcardIndex = 0;
    for (const flashcard of flashcards) {
      console.log(`Processing question ${++flashcardIndex} of ${flashcards.length}...`);

      try {
        const response = await this.createChatCompletion(prompt, flashcard.answer);
        const formattedFlashcard = {
          question: flashcard.question,
          answer: response.content
        }
        formattedFlashcards.push(formattedFlashcard);
      } catch (error) {
        console.error(`Error processing flashcard (${flashcardIndex}) "${JSON.stringify(flashcard)}":`, error);
        break;
      }
    }

    await this.writeExcelFile(outputFile, formattedFlashcards);
    console.log(`Wrote ${formattedFlashcards.length} flashcards to ${outputFile}.`)
  }

  async createChatCompletion(prompt, questionToFormat) {
    // Add your implementation for the OpenAI API call
    const messages = [
      {role: "system", content: prompt},
      {role: "user", content: questionToFormat},
    ]
    const completion = await this.openAiApi.createChatCompletion({
      model: this.model,
      messages: messages,
      temperature: 0.2,
    });
    return completion.data.choices[0].message;
  }

  async readPrompt() {
    return fs.promises.readFile('data/format_prompt.txt', 'utf-8');
  }

  /**
   * Reads an Excel file and returns an array of flashcards.
   *
   * @async
   * @param {string} filePath - The path to the Excel file to read.
   * @returns {Promise<Array<Object>>} A Promise that resolves with an array of flashcards.
   * The first row of the Excel file is assumed to contain headers and is ignored.
   * @throws {Error} An error if the Excel file cannot be read.
   */
  async readExcel(filePath) {
    const rows = await readExcelFile(filePath);
    return rows.slice(1).map(row => {
      const question = row[0];
      const answer = row[1];
      return {question, answer};
    });
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
