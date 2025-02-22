#!/usr/bin/env node

import { simpleGit } from 'simple-git';
import { OpenAI } from 'openai';
import inquirer from 'inquirer';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs/promises';

// Load environment variables from the user's home directory
const homeDir = process.env.HOME || process.env.USERPROFILE;
dotenv.config({ path: path.join(homeDir!, '.auto-commit.env') });

const git = simpleGit();
let openai: OpenAI;

async function getDiff(): Promise<string> {
  // Get all changes in one command
  const diff = await git.diff(['--no-ext-diff', 'HEAD']);
  return diff;
}

async function generateCommitMessages(diff: string): Promise<string[]> {
  const prompt = `Given the following git diff, suggest 3 clear and concise commit messages following conventional commits format:

${diff}

Provide only the commit messages, one per line, without any additional text or formatting or numbers.`;

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

  console.log(`Selected commit message: ${JSON.stringify(selectedMessage)}`);

  return selectedMessage;
}

async function commitChanges(message: string): Promise<void> {
  await git.add('.');
  await git.raw(['commit', '-m', message, '--no-verify']);
  console.log('Changes committed successfully!');
}

async function checkEnvFile(): Promise<void> {
  async function handleMissingApiKey(envPath: string) {
    console.error(`Error: OpenAI API key not found in ${envPath}.
Please make sure the file contains:

OPENAI_API_KEY=your_api_key_here`);
    process.exit(1);
  }

  async function handleMissingEnvFile(envPath: string) {
    console.log("OpenAI API key not found. Let's set it up!");
    const apiKey = await getApiKeyFromUser();
    await saveApiKeyToFile(envPath, apiKey);
    process.env.OPENAI_API_KEY = apiKey;
  }

  async function getApiKeyFromUser() {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Please enter your OpenAI API key:',
        validate: (input: string) => {
          if (input.trim().length === 0) {
            return 'API key cannot be empty';
          }
          return true;
        },
      },
    ]);
    return apiKey;
  }

  async function saveApiKeyToFile(envPath: string, apiKey: string) {
    try {
      await fs.writeFile(envPath, `OPENAI_API_KEY=${apiKey}\n`);
      console.log(`API key saved to ${envPath}`);
    } catch (writeError) {
      console.error('Error creating .auto-commit.env file:', writeError);
      process.exit(1);
    }
  }

  const envPath = path.join(homeDir!, '.auto-commit.env');
  try {
    await fs.access(envPath);
    if (!process.env.OPENAI_API_KEY) {
      await handleMissingApiKey(envPath);
    }
  } catch (_) {
    await handleMissingEnvFile(envPath);
  }
}

async function main() {
  try {
    // Check for environment variables
    await checkEnvFile();
    
    // Initialize OpenAI client after we ensure API key exists
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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
