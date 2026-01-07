'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { getSubscribedFactions } from '@/lib/faction-subscription-utils';
import { calculateRechargeParams } from '@/lib/token-system';

export default function SubscriptionStatusPanel() {
    const { user, level } = useUser();

    if (!user) return null;

    const subscriptions = getSubscribedFactions(user.uid);
    const params = calculateRechargeParams(subscriptions, level);

    // Calculate total bonuses
    const activeBonuses = {
        rate: params.rateAmount - 10, // Base rate is 10
        interval: 10 - params.intervalMin, // Base interval is 10
        cap: params.maxCap - (1000 + (level - 1) * 100) // Base cap calculation
    };

    if (subscriptions.length === 0) {
        return (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-white/50 text-sm mb-2">No Active Subscriptions</p>
                <p className="text-xs text-white/30">Subscribe to factions to boost your token recharge!</p>
            </div>
        );
    }

    return (
        <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5 z-0" />

            <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 orbitron">
                    <span className="text-cyan-400">⚡</span> ACTIVE BOOSTS
                </h3>

                {/* Bonus Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-black/40 rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xs text-white/50 mb-1">RECHARGE RATE</div>
                        <div className="text-xl font-bold text-green-400">+{activeBonuses.rate}</div>
                        <div className="text-[10px] text-white/30">Tokens / Interval</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xs text-white/50 mb-1">SPEED BOOST</div>
                        <div className="text-xl font-bold text-yellow-400">{activeBonuses.interval > 0 ? `+${activeBonuses.interval}m` : '-'}</div>
                        <div className="text-[10px] text-white/30">Faster Charge</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xs text-white/50 mb-1">CAPACITY</div>
                        <div className="text-xl font-bold text-blue-400">+{activeBonuses.cap}</div>
                        <div className="text-[10px] text-white/30">Max Tokens</div>
                    </div>
                </div>

                {/* Active Subscriptions List */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white/70 mb-2 font-mono">ISSUED LICENSES</h4>
                    {subscriptions.map(sub => (
                        <div key={sub.factionId} className="flex items-center justify-between bg-white/5 rounded px-3 py-2 border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getFactionColor(sub.factionId)}`} />
                                <span className="text-sm text-white font-medium capitalize">{sub.factionId}</span>
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 uppercase">{sub.tier}</span>
                            </div>
                            <span className="text-xs text-white/40 font-mono">Active</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function getFactionColor(factionId: string): string {
    const colors: Record<string, string> = {
        gemini: 'bg-blue-500',
        chatgpt: 'bg-green-500',
        claude: 'bg-orange-500',
        midjourney: 'bg-purple-500',
        sora: 'bg-red-500',
        // Add more mapping as needed
    };
    return colors[factionId] || 'bg-gray-500';
}
