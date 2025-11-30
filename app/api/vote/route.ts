import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { UAParser } from 'ua-parser-js';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { promptId, selectedModel, shownModels, sessionId } = body;

        if (!promptId || !selectedModel || !shownModels) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Metadata Capture
        const userAgentString = request.headers.get('user-agent') || '';
        const parser = new UAParser(userAgentString);
        const uaResult = parser.getResult();

        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        const country = request.headers.get('x-vercel-ip-country') || null;
        const region = request.headers.get('x-vercel-ip-city') || null;

        // Create Vote Record
        await prisma.vote.create({
            data: {
                promptId,
                chosenModel: selectedModel,
                shownModels: JSON.stringify(shownModels), // Store as string for SQLite compatibility
                userIp: ip,
                userAgent: userAgentString,
                browser: uaResult.browser.name,
                os: uaResult.os.name,
                device: uaResult.device.type || 'desktop', // Default to desktop if undefined
                country,
                region,
                sessionId,
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error recording vote:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
