'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Linkedin, BookOpen } from 'lucide-react';

export default function AboutPage() {
    const t = useTranslations('About');

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center py-16 px-4">
            <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8">

                {/* Profile Image */}
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-zinc-800 shadow-2xl">
                    <Image
                        src="/images/wilmer_leon.jpg"
                        alt="Wilmer Leon"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Info */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        {t('name')}
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-lg mx-auto">
                        {t('bio')}
                    </p>
                </div>

                {/* Links */}
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-8">
                    <a
                        href="https://www.linkedin.com/in/wilmer-leon/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0077b5] hover:bg-[#006396] text-white rounded-xl transition-all hover:scale-105 font-medium"
                    >
                        <Linkedin className="w-5 h-5" />
                        {t('linkedin')}
                    </a>

                    <a
                        href="https://medium.com/@wjleon"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all hover:scale-105 font-medium border border-zinc-700"
                    >
                        <BookOpen className="w-5 h-5" />
                        {t('blog')}
                    </a>
                </div>

            </div>
        </main>
    );
}
