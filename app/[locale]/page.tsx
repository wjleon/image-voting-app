'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { Loader2, CheckCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Types
interface Candidate {
  imageId: string;
  modelName: string;
  imageUrl: string;
}

interface PromptData {
  promptId: string;
  promptText: string;
  slug: string;
  candidates: Candidate[];
}

export default function VotingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('Voting');
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Initialize Session ID and fetch prompt
  useEffect(() => {
    let sid = localStorage.getItem('voting_session_id');
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem('voting_session_id', sid);
    }
    setSessionId(sid);
    fetchPrompt();
  }, [locale]);

  const fetchPrompt = async () => {
    setLoading(true);
    setVoted(false);
    try {
      const res = await fetch(`/api/prompts/random?locale=${locale}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch prompt');
      const data = await res.json();
      setPromptData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (selectedCandidate: Candidate) => {
    if (voting || voted || !promptData) return;
    setVoting(true);

    try {
      const shownModels = promptData.candidates.map(c => c.modelName);

      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: promptData.promptId,
          selectedModel: selectedCandidate.modelName,
          shownModels,
          sessionId,
        }),
      });

      setVoted(true);
      // Auto-advance after a delay
      setTimeout(() => {
        fetchPrompt();
      }, 1500);

    } catch (error) {
      console.error('Error voting:', error);
      setVoting(false);
    } finally {
      setVoting(false);
    }
  };

  if (loading && !promptData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <p>{t('failed')} <button onClick={fetchPrompt} className="underline">{t('retry')}</button></p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center py-8 px-4 relative">
      <LanguageSwitcher />

      <header className="mb-8 text-center max-w-5xl">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-lg text-zinc-300 leading-relaxed bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 font-['Courier_New']">
          {promptData.promptText}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
        {promptData.candidates.map((candidate) => (
          <button
            key={candidate.imageId}
            onClick={() => handleVote(candidate)}
            disabled={voting || voted}
            className={`
              group relative aspect-square w-full overflow-hidden rounded-2xl border-2 transition-all duration-300
              ${voted
                ? 'opacity-50 cursor-default border-zinc-800'
                : 'border-zinc-800 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]'
              }
            `}
          >
            <Image
              src={candidate.imageUrl}
              alt="AI Generated Image"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />

            {/* Overlay on Vote */}
            {voted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                {/* We don't show which one was picked here to keep it clean, or we could */}
              </div>
            )}
          </button>
        ))}
      </div>

      {voted && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{t('thanks')}</span>
        </div>
      )}

      <footer className="mt-12 text-zinc-500 text-sm">
        {t('footer')}
      </footer>
    </main>
  );
}
