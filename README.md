# Auto Commit

A TypeScript tool that helps generate commit messages using ChatGPT API.

## Features

- Automatically detects changes in your git repository
- Uses OpenAI's GPT model to suggest commit messages based on your changes
- Interactive CLI to choose from suggested commit messages
- Automatically commits changes with the selected message

## Setup

1. Install the package:
```bash
npm install -g @yuankui/auto-commit
```

2. Create `~/.auto-commit.env` file in your home directory and add your OpenAI API key:
```bash
echo "OPENAI_API_KEY=your_api_key_here" > ~/.auto-commit.env
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and add your OpenAI API key:
```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

## Usage

When you have changes you want to commit, simply run:
```bash
npm run dev
```

The tool will:
1. Check for changes in your repository
2. Generate commit message suggestions using ChatGPT
3. Let you choose from the suggested messages
4. Automatically commit your changes with the selected message

## Development

- Build the project:
```bash
npm run build
```

- Format code:
```bash
npm run format
```

- Check code formatting:
```bash
npm run format:check
```
