'use client';

import { Link } from '@/src/i18n/routing';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { usePathname } from 'next/navigation';

export default function Navigation() {
    const t = useTranslations('Navigation');
    const pathname = usePathname();

    // Helper to check active state (simple check)
    const isActive = (path: string) => pathname?.endsWith(path);

    return (
        <nav className="w-full border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        AI Voting
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className={`text-sm font-medium transition-colors hover:text-white ${isActive('/') && !isActive('/about') ? 'text-white' : 'text-zinc-400'}`}
                        >
                            {t('home')}
                        </Link>
                        <Link
                            href="/about"
                            className={`text-sm font-medium transition-colors hover:text-white ${isActive('/about') ? 'text-white' : 'text-zinc-400'}`}
                        >
                            {t('about')}
                        </Link>
                    </div>
                </div>

                <LanguageSwitcher />
            </div>
        </nav>
    );
}
