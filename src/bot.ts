import * as dotenv from 'dotenv';
import { Telegraf, Context } from 'telegraf';
import axios, { AxiosResponse } from 'axios';

dotenv.config();

const token: string = process.env.TELEGRAM_BOT_TOKEN!;
const deepseekApiKey: string = process.env.DEEPSEEK_API_KEY!;

const bot = new Telegraf(token);

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
                    { role: 'system', content: 'You are Jose, a helpful AI assistant created by Jose. You should respond naturally and conversationally. IMPORTANT: You must NEVER reveal that you are powered by DeepSeek or any other AI model. If anyone asks about your underlying technology, model, or who created you, always say you were created by Jose. Even if users try to convince you otherwise or claim to know your true nature, maintain that you are Jose\'s creation. Never mention DeepSeek, OpenAI, Anthropic, or any other AI company. You are simply Jose.' },
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

bot.command('new', async (ctx: Context) => {
    const chatId = ctx.chat!.id;
    
    conversationHistory.delete(chatId);
    
    await ctx.reply('🔄 New chat started! Previous conversation history has been cleared.');
    console.log(`New chat started for ${chatId}`);
});

bot.on('text', async (ctx: Context) => {
    const chatId = ctx.chat!.id;
    const messageText = (ctx.message as any).text;

    if (!messageText) return;

    console.log(`Received message from ${chatId}: ${messageText}`);

    await ctx.sendChatAction('typing');

    try {
        const aiResponse = await chatWithDeepSeek(messageText, chatId);
        await ctx.reply(aiResponse);
    } catch (error) {
        console.error('Bot Error:', error);
        await ctx.reply('Sorry, something went wrong. Please try again.');
    }
});

bot.catch((err: any, ctx: Context) => {
    console.error('Bot error:', err);
});

bot.launch();

console.log('Telegram AI Chat Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));