'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface ModelStat {
    modelName: string;
    votes: number;
    impressions: number;
    winRate: number;
    ctr: number;
}

interface AdminStats {
    totalVotes: number;
    totalImpressions: number;
    modelStats: ModelStat[];
}

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/stats', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading && !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
                <p>Failed to load stats. <button onClick={fetchStats} className="underline">Retry</button></p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
            <header className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Admin Dashboard
                </h1>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </header>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                    <h3 className="text-zinc-400 text-sm font-medium mb-2">Total Votes</h3>
                    <p className="text-4xl font-bold">{stats.totalVotes.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                    <h3 className="text-zinc-400 text-sm font-medium mb-2">Total Impressions</h3>
                    <p className="text-4xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                    <h3 className="text-zinc-400 text-sm font-medium mb-2">Models Tracked</h3>
                    <p className="text-4xl font-bold">{stats.modelStats.length}</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Model Name</th>
                                <th className="px-6 py-4 font-medium text-right">Votes</th>
                                <th className="px-6 py-4 font-medium text-right">Impressions</th>
                                <th className="px-6 py-4 font-medium text-right">Win Rate (Share)</th>
                                <th className="px-6 py-4 font-medium text-right">CTR (Votes/Imp)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {stats.modelStats
                                .sort((a, b) => b.votes - a.votes) // Sort by votes desc
                                .map((model) => (
                                    <tr key={model.modelName} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-zinc-200">{model.modelName}</td>
                                        <td className="px-6 py-4 text-right text-zinc-300">{model.votes.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-zinc-300">{model.impressions.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-zinc-300">
                                            {(model.winRate * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 text-right text-zinc-300">
                                            {(model.ctr * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
