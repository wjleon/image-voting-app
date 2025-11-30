import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const prompts = await prisma.prompt.findMany({
        include: {
            translations: true,
        },
    });

    console.log(`Found ${prompts.length} prompts.`);

    let missingEs = 0;
    let fallbackEs = 0;

    for (const p of prompts) {
        const es = p.translations.find(t => t.language === 'es');
        if (!es) {
            console.log(`[MISSING ES] ${p.slug}`);
            missingEs++;
        } else if (es.text.startsWith('[ES]')) {
            console.log(`[FALLBACK ES] ${p.slug}: ${es.text.substring(0, 50)}...`);
            fallbackEs++;
        } else if (es.text === p.text) {
            console.log(`[IDENTICAL ES] ${p.slug}: ${es.text.substring(0, 50)}...`);
        }
    }

    console.log('--- Summary ---');
    console.log(`Total: ${prompts.length}`);
    console.log(`Missing ES: ${missingEs}`);
    console.log(`Fallback ES ([ES] prefix): ${fallbackEs}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
