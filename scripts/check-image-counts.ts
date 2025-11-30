import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const prompts = await prisma.prompt.findMany({
        include: {
            images: true,
        },
    });

    console.log(`Checking ${prompts.length} prompts...`);

    let badPrompts = 0;

    for (const p of prompts) {
        const modelSet = new Set(p.images.map(i => i.modelName));
        const modelCount = modelSet.size;
        const imageCount = p.images.length;

        if (modelCount < 4) {
            console.log(`[WARNING] ${p.slug}: Has ${modelCount} models, ${imageCount} total images.`);
            badPrompts++;
        }
    }

    console.log('--- Summary ---');
    console.log(`Total Prompts: ${prompts.length}`);
    console.log(`Prompts with < 4 models: ${badPrompts}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
