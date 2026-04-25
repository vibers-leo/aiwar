'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import CyberPageLayout from '@/components/CyberPageLayout';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameSound } from '@/hooks/useGameSound';
import { BackgroundBeams } from "@/components/ui/aceternity/background-beams";
import { SparklesCore } from "@/components/ui/aceternity/effects";
import { CardBody, CardContainer, CardItem } from "@/components/ui/aceternity/3d-card";
import { useUser } from '@/context/UserContext';
import Season1EndingModal from '@/components/Season1EndingModal';
import { hasCompletedSeason1, hasWatchedEnding, resetEndingWatched } from '@/data/season1-ending';
import { BookOpen } from 'lucide-react';

export default function MainPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showEnding, setShowEnding] = useState(false);

  const { playSound } = useGameSound();
  const { user, profile, completeTutorial } = useUser();

  const [initializingTutorial, setInitializingTutorial] = useState(true);

  // Sound handled here, tutorial/onboarding handled by global TutorialManager
  useEffect(() => {
    playSound('bgm_main', 'bgm');
  }, [playSound]);

  // Check for Season 1 ending trigger
  useEffect(() => {
    if (!user) return;

    const checkEnding = () => {
      const completed = hasCompletedSeason1(user.uid);
      const watched = hasWatchedEnding(user.uid);

      if (completed && !watched) {
        // Trigger ending
        setTimeout(() => {
          setShowEnding(true);
        }, 1000);
      }
    };

    checkEnding();
  }, [user]);

  const handleReplayEnding = () => {
    if (user) {
      resetEndingWatched(user.uid);
      setShowEnding(true);
    }
  };


  const menuItems = [
    { title: '군단 본부', subtitle: 'LEGION HQ', path: '/factions', color: 'green', icon: '🏛️' },
    { title: '작전 지역', subtitle: 'BATTLE FIELD', path: '/battle', color: 'red', icon: '⚔️', id: 'menu-battle' }, // [NEW] ID
    { title: '카드 보관소', subtitle: 'INVENTORY', path: '/my-cards', color: 'purple', icon: '📦', id: 'menu-inventory' }, // [NEW] ID
    { title: '연구소', subtitle: 'LAB', path: '/lab', color: 'orange', icon: '🧪' },
    { title: '생성', subtitle: 'GENERATION', path: '/generation', color: 'yellow', icon: '⚡' },
    { title: '강화', subtitle: 'ENHANCE', path: '/enhance', color: 'pink', icon: '✨' },
    { title: '합성', subtitle: 'FUSION', path: '/fusion', color: 'blue', icon: '🔮' },
    { title: '특수 유닛', subtitle: 'SPECIAL UNIT', path: '/special-unit', color: 'rose', icon: '🧬' },
  ];

  return (
    <CyberPageLayout
      title="대시보드"
      englishTitle="DASHBOARD"
      subtitle="Select Operation"
      color="cyan"
      leftSidebarIcon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
      leftSidebarTips={[
        "메인 대시보드에서 모든 게임 모드로 빠르게 이동할 수 있습니다.",
        "스토리 모드를 완료하면 특별한 보상과 엔딩을 볼 수 있습니다.",
        "AI 군단을 구독하면 자동으로 카드가 생성됩니다.",
        "연구소에서 다양한 능력을 연구하여 게임을 유리하게 진행하세요.",
        "PVP 아레나에서 다른 플레이어와 실시간 대결을 즐기세요!",
      ]}
    >
      {/* Background Beams Effect - Enhanced visibility */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <BackgroundBeams />
      </div>

      {/* Subtle Sparkles in Top-Left Corner */}
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 pointer-events-none z-10">
        <SparklesCore
          id="main-sparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1.2}
          particleDensity={20}
          particleColor="#00D9FF"
          speed={0.5}
        />
      </div>

      {/* History Archive Button */}
      {user && hasCompletedSeason1(user.uid) && (
        <div className="relative z-10 w-full max-w-7xl mx-auto mt-6 mb-4">
          <button
            onClick={handleReplayEnding}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 hover:border-purple-500/50 transition-all text-sm font-mono"
          >
            <BookOpen size={16} />
            역사 기록 보관소 - 시즌 1 엔딩 다시보기
          </button>
        </div>
      )}

      {/* Season 1 Banner - Enhanced with premium glow */}
      <div id="season-banner" className="relative z-10 w-full max-w-7xl mx-auto mt-6 mb-8 overflow-hidden rounded-2xl border border-cyan-500/30 bg-black/60 backdrop-blur-md group cursor-pointer hover:border-cyan-400/80 transition-all duration-300 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-blue-900/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(6,182,212,0.15),transparent_70%)]" />
        <div className="relative p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-2xl sm:text-3xl shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-shadow duration-300">
              🌍
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold tracking-wider rounded-full border border-cyan-500/40 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.3)]">ACTIVE SEASON</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white italic orbitron drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                SEASON 1: GENESIS
              </h3>
              <p className="text-cyan-400/70 text-sm font-mono mt-1">
                전쟁의 서막이 올랐습니다. 최초의 지휘관이 되어 역사를 기록하십시오.
              </p>
            </div>
          </div>
          <Link href="/story">
            <button className="px-7 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-lg hover:from-cyan-400 hover:to-cyan-300 transition-all tracking-widest text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-105 duration-200">
              CAMPAIGN START
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 relative z-10">
        {menuItems.map((item, idx) => {
          // Tailwind Dynamic Class Fix: Explicit mapping
          const colorVariants: Record<string, any> = {
            green: { border: 'border-green-500/30', hover: 'hover:border-green-500', text: 'group-hover/card:text-green-400', shadow: 'dark:hover:shadow-green-500/[0.1]', bg: 'from-green-500/5' },
            red: { border: 'border-red-500/30', hover: 'hover:border-red-500', text: 'group-hover/card:text-red-400', shadow: 'dark:hover:shadow-red-500/[0.1]', bg: 'from-red-500/5' },
            purple: { border: 'border-purple-500/30', hover: 'hover:border-purple-500', text: 'group-hover/card:text-purple-400', shadow: 'dark:hover:shadow-purple-500/[0.1]', bg: 'from-purple-500/5' },
            amber: { border: 'border-amber-500/30', hover: 'hover:border-amber-500', text: 'group-hover/card:text-amber-400', shadow: 'dark:hover:shadow-amber-500/[0.1]', bg: 'from-amber-500/5' },
            orange: { border: 'border-orange-500/30', hover: 'hover:border-orange-500', text: 'group-hover/card:text-orange-400', shadow: 'dark:hover:shadow-orange-500/[0.1]', bg: 'from-orange-500/5' },
            yellow: { border: 'border-yellow-500/30', hover: 'hover:border-yellow-500', text: 'group-hover/card:text-yellow-400', shadow: 'dark:hover:shadow-yellow-500/[0.1]', bg: 'from-yellow-500/5' },
            pink: { border: 'border-pink-500/30', hover: 'hover:border-pink-500', text: 'group-hover/card:text-pink-400', shadow: 'dark:hover:shadow-pink-500/[0.1]', bg: 'from-pink-500/5' },
            blue: { border: 'border-blue-500/30', hover: 'hover:border-blue-500', text: 'group-hover/card:text-blue-400', shadow: 'dark:hover:shadow-blue-500/[0.1]', bg: 'from-blue-500/5' },
            rose: { border: 'border-rose-500/30', hover: 'hover:border-rose-500', text: 'group-hover/card:text-rose-400', shadow: 'dark:hover:shadow-rose-500/[0.1]', bg: 'from-rose-500/5' },
          };

          const variant = colorVariants[item.color] || colorVariants['green'];

          return (
            <Link key={idx} href={item.path} id={(item as any).id}>
              <CardContainer className="inter-var w-full h-full">
                <CardBody className={`
                        bg-black/40 relative group/card dark:hover:shadow-2xl ${variant.shadow}
                        dark:bg-black dark:border-white/[0.2] border-black/[0.1]
                        w-full min-h-[140px] sm:min-h-[180px] md:h-64 rounded-xl p-4 sm:p-6 border ${variant.border}
                        flex flex-col items-center justify-center gap-2 sm:gap-4 overflow-hidden
                        ${variant.hover} transition-colors duration-300
                    `}>

                  <div className={`absolute inset-0 bg-gradient-to-b ${variant.bg} to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity`} />

                  <CardItem translateZ="50" className="w-full flex justify-center items-center">
                    <span className="text-4xl sm:text-5xl md:text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      {item.icon}
                    </span>
                  </CardItem>

                  <CardItem translateZ="60" className="text-center z-10 mt-1 sm:mt-4">
                    <h3 className={`text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 ${variant.text} transition-colors`}>
                      {item.title}
                    </h3>
                    <p className="text-xs font-mono text-white/50 tracking-widest uppercase">
                      {item.subtitle}
                    </p>
                  </CardItem>
                </CardBody>
              </CardContainer>
            </Link>
          );
        })}
      </div>

      {/* Next Season Banner - HIDDEN FOR NOW as per request */}
      {/* 
      <div className="mt-12 relative z-10 w-full max-w-7xl mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md group cursor-pointer hover:border-cyan-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-purple-900/20 to-pink-900/20 opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-black border border-white/20 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold tracking-wider rounded border border-cyan-500/30">COMING SOON</span>
                <span className="text-white/40 text-xs font-mono">SEASON 2 UPDATE</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white italic orbitron bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                THE NEXT EVOLUTION
              </h3>
              <p className="text-gray-400 text-sm max-w-xl mt-1">
                새로운 AI 팩션, 확장된 스토리 챕터, 그리고 완전히 새로운 길드 경쟁 시스템이 찾아옵니다. 사전 예약을 통해 한정판 보상을 놓치지 마세요.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-cyan-400 transition-colors tracking-widest text-sm skew-x-[-10deg]">
              <span className="block skew-x-[10deg]">자세히 보기</span>
            </button>
          </div>
        </div>
      </div>
      */}

      {/* Season 1 Ending Modal */}
      {showEnding && user && (
        <Season1EndingModal
          isOpen={showEnding}
          onClose={() => setShowEnding(false)}
          userName={profile?.nickname || '지휘관'}
          userId={user.uid}
        />
      )}

    </CyberPageLayout>
  );
}
