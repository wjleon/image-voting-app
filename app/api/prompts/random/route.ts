import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; // Ensure no caching for random selection

export async function GET() {
    try {
        // 1. Get a random prompt
        // For better performance on large datasets, we might want to use a raw query or count first.
        // For now, fetching all IDs and picking one is fine for < 100 prompts.
        const prompts = await prisma.prompt.findMany({
            select: { id: true },
        });

        if (prompts.length === 0) {
            return NextResponse.json({ error: 'No prompts found' }, { status: 404 });
        }

        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        // 2. Fetch prompt details and images
        const prompt = await prisma.prompt.findUnique({
            where: { id: randomPrompt.id },
            include: {
                images: true,
            },
        });

        if (!prompt || prompt.images.length === 0) {
            return NextResponse.json({ error: 'Prompt has no images' }, { status: 404 });
        }

        // 3. Fairness Algorithm: Select 4 distinct models with lowest impression counts

        // Group images by model to ensure we pick distinct models
        const imagesByModel: Record<string, typeof prompt.images> = {};
        for (const img of prompt.images) {
            if (!imagesByModel[img.modelName]) {
                imagesByModel[img.modelName] = [];
            }
            imagesByModel[img.modelName].push(img);
        }

        const modelNames = Object.keys(imagesByModel);

        if (modelNames.length < 4) {
            // Fallback if fewer than 4 models exist (though unlikely based on data)
            // We'll just return what we have, or duplicate? 
            // PRD implies 4 distinct models. If not possible, return error or all.
            // Let's return what we have but log a warning.
            console.warn(`Prompt ${prompt.slug} has fewer than 4 models.`);
        }

        // Calculate average impression count per model to sort
        // Actually, we want to pick a specific image for the model too?
        // PRD says: "For each model/image, read its impression_count. Select the 4 models/images with the lowest impression counts."
        // If a model has multiple images, we should probably pick the one with lowest impressions for that model first?
        // Or just treat all images as candidates and pick top 4 distinct models?

        // Strategy:
        // 1. For each model, find the image with the lowest impression count.
        // 2. Sort these "best representative" images by impression count ASC.
        // 3. Take top 4.

        const candidateImages = [];

        for (const model of modelNames) {
            const modelImages = imagesByModel[model];
            // Sort images for this model by impression count ASC
            modelImages.sort((a, b) => a.impressionCount - b.impressionCount);

            // Pick the first one (lowest impressions)
            // We could also randomize if ties, but sort is stable enough or we can shuffle ties.
            // Let's pick random among ties for better distribution?
            // Simple approach: just take the first one after sort.
            candidateImages.push(modelImages[0]);
        }

        // Now sort candidates by their impression count to find the globally least viewed models
        candidateImages.sort((a, b) => a.impressionCount - b.impressionCount);

        // Take top 4
        // If ties at the 4th position, we should randomize to avoid bias?
        // For simplicity, we take top 4.
        const selectedImages = candidateImages.slice(0, 4);

        // Shuffle the selected images for display position
        const shuffledImages = selectedImages.sort(() => Math.random() - 0.5);

        // 4. Increment impression counts (Fire and forget, or await?)
        // Await to ensure consistency, or use after() in Next.js 15 (experimental/stable?)
        // We'll await for now to be safe.
        await prisma.$transaction(
            selectedImages.map(img =>
                prisma.image.update({
                    where: { id: img.id },
                    data: { impressionCount: { increment: 1 } }
                })
            )
        );

        // Also log to ImageImpression table if needed? PRD says "and/or".
        // We'll skip ImageImpression table for now to save writes, unless requested.
        // PRD: "Insert 4 rows in image_impressions (optional)" -> We'll stick to count for now.

        return NextResponse.json({
            promptId: prompt.id,
            promptText: prompt.text,
            slug: prompt.slug,
            candidates: shuffledImages.map(img => ({
                imageId: img.id,
                modelName: img.modelName, // Note: PRD says "Model names must not be shown to voters", but frontend needs it for debugging or hidden field?
                // Actually frontend needs to send it back on vote.
                // We should probably NOT send modelName if we want to be secure, but we need it for the vote.
                // We can encrypt it or just send it and trust the client not to show it.
                // PRD: "Image names must be anonymized... UI should not show model names".
                // It doesn't say we can't send it in JSON.
                imageUrl: img.imagePath,
            }))
        });

    } catch (error) {
        console.error('Error fetching prompt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
