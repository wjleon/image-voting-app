import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY is missing in .env');
        process.exit(1);
    }

    const prompts = await prisma.prompt.findMany({
        include: {
            translations: true,
        },
    });

    console.log(`Found ${prompts.length} prompts to process.`);

    for (const prompt of prompts) {
        console.log(`Translating: ${prompt.slug}...`);

        try {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a professional translator. Translate the following text to Spanish. Return ONLY the translated text, nothing else.' },
                    { role: 'user', content: prompt.text },
                ],
                model: 'gpt-3.5-turbo',
            });

            const translatedText = completion.choices[0].message.content;

            if (translatedText) {
                // Upsert the Spanish translation
                await prisma.promptTranslation.upsert({
                    where: {
                        promptId_language: {
                            promptId: prompt.id,
                            language: 'es',
                        },
                    },
                    update: { text: translatedText },
                    create: {
                        promptId: prompt.id,
                        language: 'es',
                        text: translatedText,
                    },
                });
                console.log(`✅ Translated: ${prompt.slug}`);
            } else {
                console.warn(`⚠️ No content returned for ${prompt.slug}`);
            }

        } catch (error) {
            console.error(`❌ Failed to translate ${prompt.slug}:`, error);
        }
    }

    console.log('Translation complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
