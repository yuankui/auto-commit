import { simpleGit } from 'simple-git';
import { OpenAI } from 'openai';
import inquirer from 'inquirer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const git = simpleGit();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getDiff(): Promise<string> {
  const diff = await git.diff();
  return diff;
}

async function generateCommitMessages(diff: string): Promise<string[]> {
  const prompt = `Given the following git diff, suggest 3 clear and concise commit messages following conventional commits format:

${diff}

Provide only the commit messages, one per line, without any additional text or formatting.`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
  });

  const suggestions = completion.choices[0].message.content?.split('\n').filter(Boolean) || [];
  return suggestions;
}

async function selectCommitMessage(messages: string[]): Promise<string> {
  const { selectedMessage } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedMessage',
      message: 'Select a commit message:',
      choices: messages,
    },
  ]);

  return selectedMessage;
}

async function commitChanges(message: string): Promise<void> {
  await git.add('.');
  await git.commit(message);
  console.log('Changes committed successfully!');
}

async function main() {
  try {
    // Get the current diff
    const diff = await getDiff();
    if (!diff) {
      console.log('No changes to commit.');
      return;
    }

    // Generate commit message suggestions
    console.log('Generating commit message suggestions...');
    const suggestions = await generateCommitMessages(diff);

    // Let user select a message
    const selectedMessage = await selectCommitMessage(suggestions);

    // Commit the changes
    await commitChanges(selectedMessage);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the program
main();
