import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Total Votes
        const totalVotes = await prisma.vote.count();

        // 2. Total Impressions (Sum of all image impression counts)
        const images = await prisma.image.findMany({
            select: { impressionCount: true, modelName: true },
        });
        const totalImpressions = images.reduce((sum: number, img: { impressionCount: number }) => sum + img.impressionCount, 0);

        // 3. Stats per Model
        // We need to aggregate votes by model
        const votesByModel = await prisma.vote.groupBy({
            by: ['chosenModel'],
            _count: {
                chosenModel: true,
            },
        });

        // Aggregate impressions by model
        const impressionsByModel: Record<string, number> = {};
        for (const img of images) {
            impressionsByModel[img.modelName] = (impressionsByModel[img.modelName] || 0) + img.impressionCount;
        }

        // Combine data
        const modelStats = Object.keys(impressionsByModel).map(modelName => {
            const voteCount = votesByModel.find((v: { chosenModel: string }) => v.chosenModel === modelName)?._count.chosenModel || 0;
            const impressionCount = impressionsByModel[modelName] || 0;

            return {
                modelName,
                votes: voteCount,
                impressions: impressionCount,
                winRate: totalVotes > 0 ? (voteCount / totalVotes) : 0, // Global win rate? Or per impression?
                // PRD says: "Win rate per model (votes per model / total votes)" -> This is share of voice.
                // Better metric might be: votes / impressions (CTR).
                ctr: impressionCount > 0 ? (voteCount / impressionCount) : 0,
            };
        });

        return NextResponse.json({
            totalVotes,
            totalImpressions,
            modelStats,
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
