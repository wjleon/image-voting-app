import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗳️  Resetting votes and impressions...');

    // 1. Delete Votes
    const deletedVotes = await prisma.vote.deleteMany({});
    console.log(`✅ Deleted ${deletedVotes.count} votes`);

    // 2. Delete Image Impressions
    const deletedImpressions = await prisma.imageImpression.deleteMany({});
    console.log(`✅ Deleted ${deletedImpressions.count} impressions`);

    // 3. Reset Impression Counts on Images
    const updatedImages = await prisma.image.updateMany({
        data: {
            impressionCount: 0,
        },
    });
    console.log(`✅ Reset impression counts for ${updatedImages.count} images`);

    console.log('\n✨ Votes and statistics successfully reset.');
    console.log('   (Prompts and Images were preserved)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
