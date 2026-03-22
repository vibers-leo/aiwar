'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Loader2, Wand2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
    generateFactionLore,
    batchGenerateFactionLores,
    GeneratedFactionLore,
    NEW_FACTIONS_LORE_CONFIG,
    FactionLoreRequest
} from '@/lib/content-generator';

type GenerationStatus = 'idle' | 'running' | 'done' | 'error';

interface FactionResult {
    factionId: string;
    factionName: string;
    status: 'pending' | 'running' | 'done' | 'error';
    result?: GeneratedFactionLore;
}

export default function ContentGeneratorPage() {
    const router = useRouter();
    const { isAdmin, loading } = useUser();
    const [batchStatus, setBatchStatus] = useState<GenerationStatus>('idle');
    const [results, setResults] = useState<FactionResult[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [apiKeyInput, setApiKeyInput] = useState('');

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-purple-400" size={40} /></div>;
    if (!isAdmin) { router.push('/'); return null; }

    const handleBatchGenerate = async () => {
        setBatchStatus('running');
        const initial: FactionResult[] = NEW_FACTIONS_LORE_CONFIG.map(f => ({
            factionId: f.factionId,
            factionName: f.factionName,
            status: 'pending'
        }));
        setResults(initial);

        try {
            // 3개씩 병렬 처리하며 UI 업데이트
            const chunkSize = 3;
            const all = [...NEW_FACTIONS_LORE_CONFIG];
            for (let i = 0; i < all.length; i += chunkSize) {
                const chunk = all.slice(i, i + chunkSize);

                // running 상태로 업데이트
                setResults(prev => prev.map(r =>
                    chunk.some(c => c.factionId === r.factionId)
                        ? { ...r, status: 'running' }
                        : r
                ));

                const settled = await Promise.allSettled(chunk.map(f => generateFactionLore(f)));
                settled.forEach((res, idx) => {
                    const factionId = chunk[idx].factionId;
                    setResults(prev => prev.map(r =>
                        r.factionId === factionId
                            ? {
                                ...r,
                                status: res.status === 'fulfilled' ? 'done' : 'error',
                                result: res.status === 'fulfilled' ? res.value : undefined
                            }
                            : r
                    ));
                });

                if (i + chunkSize < all.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            setBatchStatus('done');
        } catch (e) {
            console.error(e);
            setBatchStatus('error');
        }
    };

    const handleSingleGenerate = async (config: FactionLoreRequest) => {
        setResults(prev => {
            const exists = prev.find(r => r.factionId === config.factionId);
            if (exists) return prev.map(r => r.factionId === config.factionId ? { ...r, status: 'running' } : r);
            return [...prev, { factionId: config.factionId, factionName: config.factionName, status: 'running' }];
        });

        try {
            const result = await generateFactionLore(config);
            setResults(prev => prev.map(r =>
                r.factionId === config.factionId ? { ...r, status: 'done', result } : r
            ));
        } catch {
            setResults(prev => prev.map(r =>
                r.factionId === config.factionId ? { ...r, status: 'error' } : r
            ));
        }
    };

    const copyAllAsJSON = () => {
        const output = results
            .filter(r => r.status === 'done' && r.result)
            .reduce((acc, r) => {
                acc[r.factionId] = r.result;
                return acc;
            }, {} as Record<string, GeneratedFactionLore | undefined>);
        navigator.clipboard.writeText(JSON.stringify(output, null, 2));
        alert('클립보드에 복사되었습니다!');
    };

    const statusIcon = (status: FactionResult['status']) => {
        if (status === 'running') return <Loader2 size={16} className="animate-spin text-yellow-400" />;
        if (status === 'done') return <CheckCircle size={16} className="text-green-400" />;
        if (status === 'error') return <AlertCircle size={16} className="text-red-400" />;
        return <div className="w-4 h-4 rounded-full border border-white/20" />;
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.push('/admin')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white">←</button>
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            <Wand2 className="text-purple-400" size={28} />
                            AI Recipe 콘텐츠 생성기
                        </h1>
                        <p className="text-white/40 text-sm mt-1">신규 18개 군단의 로어 & 카드 설명을 AI Recipe API로 자동 생성</p>
                    </div>
                </div>

                {/* API 키 설정 안내 */}
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <p className="text-yellow-300 text-sm font-bold mb-2">⚙️ 환경 변수 설정 필요</p>
                    <p className="text-white/60 text-xs mb-3">
                        <code className="bg-white/10 px-1 rounded">AI_RECIPE_API_URL</code> 과 {' '}
                        <code className="bg-white/10 px-1 rounded">AI_RECIPE_API_KEY</code> 를 {' '}
                        <code className="bg-white/10 px-1 rounded">.env.local</code> 에 설정하세요.
                        설정되지 않은 경우 폴백 텍스트가 사용됩니다.
                    </p>
                    <pre className="text-xs text-purple-300 bg-black/40 p-3 rounded-lg">
{`# .env.local
AI_RECIPE_API_URL=https://your-ai-recipe-api.com
AI_RECIPE_API_KEY=your-api-key`}
                    </pre>
                </div>

                {/* 배치 생성 */}
                <div className="mb-6 p-6 bg-white/5 border border-purple-500/30 rounded-2xl">
                    <h2 className="text-xl font-bold text-purple-300 mb-4">전체 배치 생성 (18개 군단)</h2>
                    <p className="text-white/50 text-sm mb-4">신규 추가된 18개 군단의 로어를 AI Recipe API로 한번에 생성합니다. 3개씩 병렬 처리합니다.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleBatchGenerate}
                            disabled={batchStatus === 'running'}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center gap-2 transition-all"
                        >
                            {batchStatus === 'running' ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                            {batchStatus === 'running' ? '생성 중...' : '전체 생성 시작'}
                        </button>
                        {results.some(r => r.status === 'done') && (
                            <button
                                onClick={copyAllAsJSON}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center gap-2 transition-all"
                            >
                                📋 JSON 복사
                            </button>
                        )}
                    </div>
                </div>

                {/* 결과 목록 */}
                {results.length === 0 ? (
                    // 아직 생성 전 — 군단 목록 미리보기
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {NEW_FACTIONS_LORE_CONFIG.map(config => (
                            <div key={config.factionId} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-white">{config.factionName}</p>
                                    <p className="text-white/40 text-xs mt-0.5">{config.realWorldFeatures.slice(0, 2).join(' · ')}</p>
                                </div>
                                <button
                                    onClick={() => handleSingleGenerate(config)}
                                    className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg text-sm font-bold transition-all"
                                >
                                    개별 생성
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-white/60 text-sm">
                                {results.filter(r => r.status === 'done').length} / {results.length} 완료
                            </p>
                        </div>
                        {results.map(result => (
                            <div key={result.factionId} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <div
                                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-all"
                                    onClick={() => result.status === 'done' && setExpanded(expanded === result.factionId ? null : result.factionId)}
                                >
                                    {statusIcon(result.status)}
                                    <div className="flex-1">
                                        <span className="font-bold text-white">{result.factionName}</span>
                                        {result.result?.tagline && (
                                            <span className="ml-2 text-white/40 text-sm">— {result.result.tagline}</span>
                                        )}
                                    </div>
                                    {result.status === 'done' && (
                                        expanded === result.factionId
                                            ? <ChevronUp size={16} className="text-white/40" />
                                            : <ChevronDown size={16} className="text-white/40" />
                                    )}
                                </div>
                                {expanded === result.factionId && result.result && (
                                    <div className="px-4 pb-4 border-t border-white/10 mt-0 pt-4 space-y-2">
                                        <p className="text-white/80 text-sm"><span className="text-purple-400 font-bold">설명:</span> {result.result.description}</p>
                                        <p className="text-white/80 text-sm"><span className="text-purple-400 font-bold">전투 구호:</span> {result.result.battleCry}</p>
                                        <p className="text-white/60 text-sm"><span className="text-purple-400 font-bold">로어:</span> {result.result.lore}</p>
                                        <div className="flex gap-4 text-xs">
                                            {result.result.allies.length > 0 && <p className="text-green-400">동맹: {result.result.allies.join(', ')}</p>}
                                            {result.result.rivals.length > 0 && <p className="text-red-400">적대: {result.result.rivals.join(', ')}</p>}
                                        </div>
                                        <pre className="text-xs text-white/30 bg-black/40 p-2 rounded mt-2 overflow-auto">
                                            {JSON.stringify(result.result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
