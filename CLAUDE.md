# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Run the bot directly with ts-node
- `npm run dev` - Run with watch mode (auto-restart on file changes)
- `npm run build` - Compile TypeScript to JavaScript (outputs to ./dist)

## Architecture Overview

This is a TypeScript-based Telegram chatbot that integrates with the DeepSeek AI API to provide conversational AI responses.

### Core Components

- **Bot Entry Point**: `src/bot.ts` - Main application file containing all bot logic
- **Environment Configuration**: `.env` file contains sensitive API keys and tokens
- **Conversation Management**: In-memory Map storing chat history per user (chatId as key)

### Key Architecture Patterns

- **Polling-based Bot**: Uses `node-telegram-bot-api` with polling (not webhooks)
- **Stateful Conversations**: Maintains last 20 messages per chat ID for context
- **Error Handling**: Graceful degradation with fallback messages for API failures
- **TypeScript Interfaces**: `ChatMessage` and `DeepSeekResponse` define data structures

### Environment Variables Required

- `TELEGRAM_BOT_TOKEN` - Telegram bot API token
- `DEEPSEEK_API_KEY` - DeepSeek AI API key  
- `TELEGRAM_CHAT_ID` - Target chat ID (though bot responds to all chats)

### API Integration Details

- **DeepSeek API**: Uses chat completions endpoint with conversation history
- **Message Flow**: Telegram message → Add to history → Send to DeepSeek → Return AI response → Update history
- **History Management**: Automatically trims conversation history when exceeding 20 messages (removes oldest 2 messages)