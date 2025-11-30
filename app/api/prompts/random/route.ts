import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; // Ensure no caching for random selection

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const locale = searchParams.get('locale') || 'en';

        // 1. Get a random prompt
        const promptCount = await prisma.prompt.count();
        const skip = Math.floor(Math.random() * promptCount);

        const randomPrompts = await prisma.prompt.findMany({
            take: 1,
            skip: skip,
            include: {
                images: true,
                translations: {
                    where: { language: locale },
                    take: 1,
                },
            },
        });

        if (randomPrompts.length === 0) {
            return NextResponse.json({ error: 'No prompts found' }, { status: 404 });
        }

        const prompt = randomPrompts[0];

        // Use translated text if available, otherwise fallback to default text
        const promptText = prompt.translations[0]?.text || prompt.text;

        // 2. Select 4 candidates using fairness algorithm (least viewed)
        const imagesByModel: Record<string, typeof prompt.images> = {};

        for (const img of prompt.images) {
            if (!imagesByModel[img.modelName]) {
                imagesByModel[img.modelName] = [];
            }
            imagesByModel[img.modelName].push(img);
        }

        const modelCandidates: { modelName: string; image: typeof prompt.images[0] }[] = [];

        for (const modelName in imagesByModel) {
            // Sort images for this model by impressionCount ASC
            const sortedImages = imagesByModel[modelName].sort((a: { impressionCount: number }, b: { impressionCount: number }) => a.impressionCount - b.impressionCount);
            // Pick the best one (least viewed)
            modelCandidates.push({
                modelName,
                image: sortedImages[0],
            });
        }

        // Sort models by their candidate's impressionCount ASC to prioritize under-exposed models
        modelCandidates.sort((a, b) => a.image.impressionCount - b.image.impressionCount);

        // Take top 4
        const selectedCandidates = modelCandidates.slice(0, 4);

        // Shuffle them so they don't always appear in the same order
        for (let i = selectedCandidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [selectedCandidates[i], selectedCandidates[j]] = [selectedCandidates[j], selectedCandidates[i]];
        }

        // 3. Record Impressions
        const impressionPromises = selectedCandidates.map(c =>
            prisma.image.update({
                where: { id: c.image.id },
                data: { impressionCount: { increment: 1 } }
            })
        );
        await Promise.all(impressionPromises);

        // 4. Construct Response
        const response = {
            promptId: prompt.id,
            promptText: promptText,
            slug: prompt.slug,
            candidates: selectedCandidates.map(c => ({
                imageId: c.image.id,
                modelName: c.modelName,
                imageUrl: c.image.imagePath,
            })),
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching prompt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
