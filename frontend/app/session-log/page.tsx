'use client';

import CyberPageLayout from '@/components/CyberPageLayout';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';

export default function SessionLogPage() {
    const { user, profile, inventory, starterPackAvailable, loading } = useUser();
    const [mounted, setMounted] = useState(false);
    const [tutorialLocalStatus, setTutorialLocalStatus] = useState<string>('Checking...');

    useEffect(() => {
        setMounted(true);
        if (user) {
            let trackingId = user.uid;
            const sessionStr = localStorage.getItem('auth-session');
            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    if (session?.user?.id) trackingId = session.user.id;
                } catch (e) { }
            }
            const key = `tutorial_completed_${trackingId}`;
            const val = localStorage.getItem(key);
            setTutorialLocalStatus(val ? `Completed (ID: ${trackingId})` : `Not Found (ID: ${trackingId})`);
        } else {
            setTutorialLocalStatus('User not logged in');
        }
    }, [user]);

    if (!mounted) return <div className="p-10 text-green-500">Initializing System Log...</div>;

    return (
        <CyberPageLayout
            title="개발 세션 로그"
            subtitle="2026-01-04"
            description="현재 진행 상황 및 이슈 리포트"
            color="blue"
        >
            <div className="space-y-8 max-w-4xl mx-auto font-mono">
                {/* 0. Live Debugger */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-purple-900/20 border border-purple-500/50 p-6 rounded-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 text-xs text-purple-400 border-l border-b border-purple-500/30 bg-black/40">
                        LIVE DEBUGGER
                    </div>
                    <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                        <span>🛠️</span> 실시간 상태 진단 (Starter Pack Debug)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <div className="flex justify-between border-b border-white/10 pb-1">
                                <span className="text-gray-400">User ID:</span>
                                <span className="text-white font-mono">{user ? user.uid.substring(0, 8) + '...' : 'Not Logged In'}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-1">
                                <span className="text-gray-400">StarterPack Available:</span>
                                <span className={`font-bold ${starterPackAvailable ? 'text-green-400' : 'text-red-400'}`}>
                                    {starterPackAvailable ? 'YES (TRUE)' : 'NO (FALSE)'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-1">
                                <span className="text-gray-400">Has Received Pack (DB):</span>
                                <span className={`font-bold ${profile?.hasReceivedStarterPack ? 'text-red-400' : 'text-green-400'}`}>
                                    {profile?.hasReceivedStarterPack ? 'YES' : 'NO'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-1">
                                <span className="text-gray-400">Inventory Count:</span>
                                <span className="text-white font-mono">{inventory.length} items</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between border-b border-white/10 pb-1">
                                <span className="text-gray-400">Tutorial LocalStatus:</span>
                                <span className="text-yellow-400 text-xs">{tutorialLocalStatus}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-1">
                                <span className="text-gray-400">Profile Loading:</span>
                                <span className="text-white">{loading ? 'Loading...' : 'Done'}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>


                {/* 1. 미션 시스템 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/40 border border-green-500/30 p-6 rounded-xl"
                >
                    <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                        <span>✅</span> 미션 및 퀘스트 시스템 통합 완료
                    </h2>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 ml-2">
                        <li>
                            <strong className="text-white">시스템 연동:</strong> UserContext에 퀘스트 상태 관리 및 이벤트 버스(trackMissionEvent) 탑재 완료.
                        </li>
                        <li>
                            <strong className="text-white">UI 리빌딩:</strong> 미션 페이지(app/missions/page.tsx)를 실시간 데이터 연동형으로 재건축.
                        </li>
                    </ul>
                </motion.div>

                {/* 2. Jules 작업 병합 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-black/40 border border-blue-500/30 p-6 rounded-xl"
                >
                    <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <span>🔀</span> Jules 작업(Auth Flow) & Zombie Data Fix
                    </h2>
                    <ul className="list-disc list-inside text-gray-300 space-y-2 ml-2">
                        <li>
                            <strong className="text-green-400">[VERIFIED] Zombie Data Fix:</strong>
                            <span className="text-sm ml-2">로그아웃 시 localStorage 강제 소각 ("Nuclear Cleanup") 로직 적용 완료. Playwright 테스트 통과.</span>
                        </li>
                        <li>
                            <strong className="text-white">Hotfix 병합:</strong> <code>feat/robust-auth-flow</code> → <code>main</code> 병합 및 충돌 해결.
                        </li>
                    </ul>
                </motion.div>

                {/* 3. 현재 이슈 및 대기 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-yellow-900/10 border border-yellow-500/30 p-6 rounded-xl"
                >
                    <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <span>🚧</span> 진행 중 (In Progress)
                    </h2>
                    <div className="text-gray-300 space-y-4">
                        <div>
                            <h3 className="text-white font-bold mb-1">Starter Pack Modal 미노출 현상</h3>
                            <p className="text-sm">
                                신규 유저에게 Starter Pack 모달이 뜨지 않는 문제 디버깅 중. <br />
                                상단의 <strong>Live Debugger</strong> 정보를 통해 원인 파악 예정.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="text-center text-xs text-gray-500 mt-8">
                    * 이 페이지는 로컬 개발 환경 상태 보고용이며, 원격 저장소에는 반영되지 않습니다.
                </div>
            </div>
        </CyberPageLayout>
    );
}
