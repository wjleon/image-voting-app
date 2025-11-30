import { PrismaClient } from '@prisma/client';
// @ts-ignore
import { translate } from '@vitalets/google-translate-api';

const prisma = new PrismaClient();

const DELAY_MS = 10000; // 10 seconds delay

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const prompts = await prisma.prompt.findMany({
        include: {
            translations: {
                where: { language: 'es' }
            }
        }
    });

    console.log(`Checking ${prompts.length} prompts for broken translations...`);

    for (const prompt of prompts) {
        const esTranslation = prompt.translations[0];

        // Check if it's a fallback translation (starts with [ES])
        if (esTranslation && esTranslation.text.startsWith('[ES] ')) {
            const originalText = prompt.text;
            console.log(`Fixing: ${prompt.slug}...`);

            try {
                const res = await translate(originalText, { to: 'es' });
                const translatedText = res.text;

                if (translatedText) {
                    await prisma.promptTranslation.update({
                        where: { id: esTranslation.id },
                        data: { text: translatedText }
                    });
                    console.log(`✅ Fixed: ${prompt.slug}`);
                }
            } catch (error) {
                console.error(`❌ Failed to translate ${prompt.slug}:`, error);
                // Fallback: Strip the [ES] prefix so it looks like normal English
                const cleanText = esTranslation.text.replace('[ES] ', '');
                if (cleanText !== esTranslation.text) {
                    await prisma.promptTranslation.update({
                        where: { id: esTranslation.id },
                        data: { text: cleanText }
                    });
                    console.log(`⚠️ Reverted to clean English: ${prompt.slug}`);
                }
            }

            // Wait to avoid rate limits
            await sleep(DELAY_MS);
        }
    }

    console.log('Done.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
