import * as dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import axios, { AxiosResponse } from 'axios';

dotenv.config();

const token: string = process.env.TELEGRAM_BOT_TOKEN!;
const deepseekApiKey: string = process.env.DEEPSEEK_API_KEY!;

const bot = new TelegramBot(token, { polling: true });

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface DeepSeekResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
    }>;
}

const conversationHistory = new Map<number, ChatMessage[]>();

async function chatWithDeepSeek(message: string, chatId: number): Promise<string> {
    try {
        if (!conversationHistory.has(chatId)) {
            conversationHistory.set(chatId, []);
        }
        
        const history = conversationHistory.get(chatId)!;
        history.push({ role: 'user', content: message });
        
        if (history.length > 20) {
            history.splice(0, 2);
        }

        const response: AxiosResponse<DeepSeekResponse> = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant. Respond naturally and conversationally.' },
                    ...history
                ],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${deepseekApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;
        history.push({ role: 'assistant', content: aiResponse });
        
        return aiResponse;
    } catch (error: any) {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        return 'Sorry, I encountered an error while processing your request. Please try again.';
    }
}

bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (!messageText) return;

    console.log(`Received message from ${chatId}: ${messageText}`);

    bot.sendChatAction(chatId, 'typing');

    try {
        const aiResponse = await chatWithDeepSeek(messageText, chatId);
        await bot.sendMessage(chatId, aiResponse);
    } catch (error) {
        console.error('Bot Error:', error);
        await bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again.');
    }
});

bot.on('polling_error', (error: Error) => {
    console.error('Polling error:', error);
});

console.log('Telegram AI Chat Bot is running...');