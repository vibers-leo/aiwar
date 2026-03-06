'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CyberPageLayout from '@/components/CyberPageLayout';
import { saveCardMetadata } from '@/lib/admin-card-service';
import { AI_VERSION_REGISTRY, AIModelInfo } from '@/lib/ai-version-registry';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, ArrowLeft, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { ShieldAlert } from 'lucide-react';

interface VersionCheckResult {
    cardId: string;
    displayName: string;
    faction: string;
    currentGameVersion: string;
    latestKnownVersion: string;
    isOutdated: boolean;
    fetchedVersion?: string;
    source: string;
    lastCheckedAt: string;
    statSuggestion?: AIModelInfo['statSuggestion'];
    benchmarks?: AIModelInfo['benchmarks'];
}

interface CheckResponse {
    checkedAt: string;
    totalCount: number;
    outdatedCount: number;
    upToDateCount: number;
    all: VersionCheckResult[];
}

const CATEGORY_LABELS: Record<string, string> = {
    text: '💬 텍스트',
    image: '🎨 이미지',
    video: '🎬 영상',
    music: '🎵 음악',
    voice: '🎤 음성',
    code: '💻 코드',
};

const SOURCE_LABELS: Record<string, string> = {
    'openai-api': '🤖 OpenAI',
    'anthropic-api': '🧠 Anthropic',
    'google-api': '🔍 Google',
    'manual': '✋ 수동',
};

export default function AIMonitorPage() {
    const router = useRouter();
    const { user, isAdmin, loading: userLoading } = useUser();
    const [checkResults, setCheckResults] = useState<CheckResponse | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [updatingCards, setUpdatingCards] = useState<Set<string>>(new Set());
    const [updatedCards, setUpdatedCards] = useState<Set<string>>(new Set());
    const [filterOutdated, setFilterOutdated] = useState(false);

    // 버전 체크 실행
    const handleCheck = useCallback(async () => {
        setIsChecking(true);
        try {
            const res = await fetch('/api/admin/check-ai-versions');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: CheckResponse = await res.json();
            setCheckResults(data);
        } catch (e) {
            console.error('[AIMonitor] Check failed:', e);
            alert('버전 체크 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsChecking(false);
        }
    }, []);

    // 개별 카드 버전 업데이트
    const handleUpdateCard = useCallback(async (result: VersionCheckResult) => {
        if (!confirm(`"${result.displayName}"을 "${result.latestKnownVersion}"으로 업데이트하시겠습니까?`)) return;

        setUpdatingCards(prev => new Set(prev).add(result.cardId));
        try {
            await saveCardMetadata(result.cardId, {
                modelVersion: result.latestKnownVersion,
                versionUpdatedAt: new Date().toISOString(),
            });

            setUpdatedCards(prev => new Set(prev).add(result.cardId));
            alert(`✅ ${result.displayName} 업데이트 완료!\n${result.currentGameVersion} → ${result.latestKnownVersion}`);
        } catch (e) {
            console.error('[AIMonitor] Update failed:', e);
            alert('업데이트 중 오류가 발생했습니다.');
        } finally {
            setUpdatingCards(prev => {
                const next = new Set(prev);
                next.delete(result.cardId);
                return next;
            });
        }
    }, []);

    // 업데이트 필요한 카드 일괄 업데이트
    const handleUpdateAll = useCallback(async () => {
        if (!checkResults) return;
        const outdated = checkResults.all.filter(r => r.isOutdated && !updatedCards.has(r.cardId));
        if (outdated.length === 0) return;

        if (!confirm(`${outdated.length}개 카드를 일괄 업데이트하시겠습니까?`)) return;

        for (const result of outdated) {
            setUpdatingCards(prev => new Set(prev).add(result.cardId));
            try {
                await saveCardMetadata(result.cardId, {
                    modelVersion: result.latestKnownVersion,
                    versionUpdatedAt: new Date().toISOString(),
                });
                setUpdatedCards(prev => new Set(prev).add(result.cardId));
            } catch (e) {
                console.error(`[AIMonitor] Failed to update ${result.cardId}:`, e);
            } finally {
                setUpdatingCards(prev => {
                    const next = new Set(prev);
                    next.delete(result.cardId);
                    return next;
                });
            }
        }
        alert('일괄 업데이트 완료!');
    }, [checkResults, updatedCards]);

    // 초기 화면: 아직 체크 안 한 경우 레지스트리 기본값 표시
    const displayData: VersionCheckResult[] = checkResults
        ? (filterOutdated ? checkResults.all.filter(r => r.isOutdated) : checkResults.all)
        : AI_VERSION_REGISTRY.map(entry => ({
            cardId: entry.cardId,
            displayName: entry.displayName,
            faction: entry.faction,
            currentGameVersion: entry.currentGameVersion,
            latestKnownVersion: entry.latestKnownVersion,
            isOutdated: entry.currentGameVersion !== entry.latestKnownVersion,
            source: entry.source,
            lastCheckedAt: entry.lastCheckedAt,
            statSuggestion: entry.statSuggestion,
            benchmarks: entry.benchmarks,
        })).filter(r => filterOutdated ? r.isOutdated : true);

    const pendingOutdatedCount = displayData.filter(r => r.isOutdated && !updatedCards.has(r.cardId)).length;

    // Auth guard
    if (userLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8">
                <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold mb-4">접근 권한이 없습니다</h1>
                <button onClick={() => router.push('/')} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-colors">
                    메인으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <CyberPageLayout
            title="AI VERSION MONITOR"
            subtitle="MODEL TRACKING"
            description="AI 모델 버전 변경 감지 및 카드 업데이트 관리"
            color="cyan"
        >
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Controls */}
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => router.push('/admin')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                        <ArrowLeft size={16} /> 어드민으로
                    </button>

                    <button
                        onClick={handleCheck}
                        disabled={isChecking}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold transition-all"
                    >
                        {isChecking ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        {isChecking ? '확인 중...' : '지금 체크'}
                    </button>

                    {pendingOutdatedCount > 0 && (
                        <button
                            onClick={handleUpdateAll}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all"
                        >
                            <Zap size={16} />
                            {pendingOutdatedCount}개 일괄 업데이트
                        </button>
                    )}

                    <label className="flex items-center gap-2 ml-auto cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filterOutdated}
                            onChange={e => setFilterOutdated(e.target.checked)}
                            className="w-4 h-4 accent-amber-500"
                        />
                        <span className="text-white/60 text-sm">업데이트 필요만 표시</span>
                    </label>
                </div>

                {/* Summary Cards */}
                {checkResults && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-white mb-1">{checkResults.totalCount}</div>
                            <div className="text-white/50 text-xs uppercase tracking-widest">전체 모델</div>
                        </div>
                        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-amber-400 mb-1">{checkResults.outdatedCount - updatedCards.size < 0 ? 0 : checkResults.outdatedCount - updatedCards.size}</div>
                            <div className="text-amber-400/60 text-xs uppercase tracking-widest">업데이트 필요</div>
                        </div>
                        <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-4 text-center">
                            <div className="text-3xl font-black text-green-400 mb-1">{checkResults.upToDateCount + updatedCards.size}</div>
                            <div className="text-green-400/60 text-xs uppercase tracking-widest">최신 상태</div>
                        </div>
                    </div>
                )}

                {/* Last Checked */}
                {checkResults && (
                    <p className="text-white/30 text-xs font-mono">
                        마지막 체크: {new Date(checkResults.checkedAt).toLocaleString('ko-KR')}
                    </p>
                )}

                {/* Table */}
                <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-4 py-3 text-left text-white/50 font-mono uppercase text-xs">모델</th>
                                <th className="px-4 py-3 text-left text-white/50 font-mono uppercase text-xs">현재 버전</th>
                                <th className="px-4 py-3 text-left text-white/50 font-mono uppercase text-xs">최신 버전</th>
                                <th className="px-4 py-3 text-left text-white/50 font-mono uppercase text-xs">상태</th>
                                <th className="px-4 py-3 text-left text-white/50 font-mono uppercase text-xs">스탯 제안</th>
                                <th className="px-4 py-3 text-center text-white/50 font-mono uppercase text-xs">액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.map((result, idx) => {
                                const isUpdating = updatingCards.has(result.cardId);
                                const isUpdated = updatedCards.has(result.cardId);
                                const registryEntry = AI_VERSION_REGISTRY.find(e => e.cardId === result.cardId);

                                return (
                                    <motion.tr
                                        key={result.cardId}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className={cn(
                                            "border-b border-white/5 hover:bg-white/5 transition-colors",
                                            result.isOutdated && !isUpdated && "bg-amber-950/10",
                                            isUpdated && "bg-green-950/10"
                                        )}
                                    >
                                        {/* 모델 */}
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-white">{result.displayName}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-white/30 text-xs">{registryEntry ? CATEGORY_LABELS[registryEntry.category] : ''}</span>
                                                <span className="text-white/20 text-xs">{SOURCE_LABELS[result.source] || result.source}</span>
                                            </div>
                                        </td>

                                        {/* 현재 버전 */}
                                        <td className="px-4 py-3 font-mono text-white/70">
                                            {result.currentGameVersion}
                                        </td>

                                        {/* 최신 버전 */}
                                        <td className="px-4 py-3 font-mono">
                                            <span className={cn(
                                                result.isOutdated && !isUpdated ? "text-amber-300 font-bold" : "text-green-400"
                                            )}>
                                                {isUpdated ? result.latestKnownVersion + ' ✓' : result.latestKnownVersion}
                                            </span>
                                        </td>

                                        {/* 상태 */}
                                        <td className="px-4 py-3">
                                            {isUpdated ? (
                                                <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                                                    <CheckCircle size={14} /> 업데이트됨
                                                </span>
                                            ) : result.isOutdated ? (
                                                <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                    <AlertTriangle size={14} /> 업데이트 필요
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-green-500/60 text-xs">
                                                    <CheckCircle size={14} /> 최신
                                                </span>
                                            )}
                                        </td>

                                        {/* 스탯 제안 */}
                                        <td className="px-4 py-3">
                                            {result.statSuggestion && (
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(result.statSuggestion).map(([stat, val]) => (
                                                        <span key={stat} className="px-1.5 py-0.5 bg-purple-900/30 border border-purple-500/20 rounded text-purple-300 text-xs font-mono">
                                                            {stat[0].toUpperCase()}{val}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>

                                        {/* 액션 */}
                                        <td className="px-4 py-3 text-center">
                                            {!isUpdated && result.isOutdated ? (
                                                <button
                                                    onClick={() => handleUpdateCard(result)}
                                                    disabled={isUpdating}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition-all mx-auto"
                                                >
                                                    {isUpdating ? <Loader2 className="animate-spin" size={12} /> : <TrendingUp size={12} />}
                                                    업데이트
                                                </button>
                                            ) : (
                                                <span className="text-white/20 text-xs">—</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {displayData.length === 0 && (
                        <div className="py-16 text-center text-white/30">
                            {filterOutdated ? '업데이트가 필요한 카드가 없습니다. 🎉' : '데이터가 없습니다.'}
                        </div>
                    )}
                </div>

                {/* Benchmark Info */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                    <h3 className="text-white/50 text-xs font-mono uppercase mb-3">스탯 약어 가이드</h3>
                    <div className="flex flex-wrap gap-3 text-xs font-mono text-white/40">
                        <span><b className="text-purple-300">A</b> = Accuracy (정확도)</span>
                        <span><b className="text-purple-300">S</b> = Speed (속도)</span>
                        <span><b className="text-purple-300">C</b> = Creativity (창의성)</span>
                        <span><b className="text-purple-300">St</b> = Stability (안정성)</span>
                        <span><b className="text-purple-300">E</b> = Ethics (윤리)</span>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="text-white/20 text-xs font-mono text-center">
                    업데이트는 Firestore card_metadata에 저장됩니다. 카드 스탯 변경은 별도 card-database.ts 편집이 필요합니다.
                </p>
            </div>
        </CyberPageLayout>
    );
}
