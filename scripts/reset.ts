import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Resetting database...');

    // Delete in order to respect foreign keys (if cascades aren't set)

    // 1. Delete Votes (depend on Prompts)
    const deletedVotes = await prisma.vote.deleteMany({});
    console.log(`✅ Deleted ${deletedVotes.count} votes`);

    // 2. Delete Image Impressions (depend on Images and Prompts)
    const deletedImpressions = await prisma.imageImpression.deleteMany({});
    console.log(`✅ Deleted ${deletedImpressions.count} impressions`);

    // 3. Delete Translations (depend on Prompts)
    const deletedTranslations = await prisma.promptTranslation.deleteMany({});
    console.log(`✅ Deleted ${deletedTranslations.count} translations`);

    // 4. Delete Images (depend on Prompts)
    const deletedImages = await prisma.image.deleteMany({});
    console.log(`✅ Deleted ${deletedImages.count} images`);

    // 5. Delete Prompts (Root)
    const deletedPrompts = await prisma.prompt.deleteMany({});
    console.log(`✅ Deleted ${deletedPrompts.count} prompts`);

    console.log('\n✨ Database successfully wiped.');
    console.log('👉 To reload data, run: npx tsx scripts/ingest.ts');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
