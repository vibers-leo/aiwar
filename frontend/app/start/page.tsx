'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { TextHoverEffect } from '@/components/ui/aceternity/text-hover-effect';
import { HoverBorderGradient } from '@/components/ui/aceternity/hover-border-gradient';
import { CardBody, CardContainer, CardItem } from '@/components/ui/aceternity/3d-card';
import { InfiniteMovingCards } from '@/components/ui/aceternity/infinite-moving-cards';
import { TextGenerateEffect } from '@/components/ui/aceternity/text-generate-effect';
import { SparklesCore, Meteors } from "@/components/ui/aceternity/effects";
import { EvervaultCard, Icon } from "@/components/ui/aceternity/evervault-card";
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import { signInWithEmail } from '@/lib/firebase-auth';
import { login } from '@/lib/auth-utils';
import { useUser } from '@/context/UserContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { COMMANDER_IMAGES } from '@/lib/card-images';
import { useGameSound } from '@/hooks/useGameSound';

// Custom Right Sidebar Component
const LandingSidebar = ({ activeSection }: { activeSection: string }) => {
    const navItems = [
        { id: 'hero', label: '01. INTRO' },
        { id: 'commanders', label: '02. COMMANDERS' },
        { id: 'features', label: '03. FEATURES' },
        { id: 'systems', label: '04. SYSTEMS' },
        { id: 'secret', label: '05. CLASSIFIED' },
        { id: 'join', label: '06. JOIN PROTOCOL' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-6"
        >
            {navItems.map((item) => (
                <div
                    key={item.id}
                    className="group flex flex-row-reverse items-center gap-4 cursor-pointer"
                    onClick={() => {
                        const el = document.getElementById(item.id);
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        activeSection === item.id
                            ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] scale-150"
                            : "bg-zinc-700 group-hover:bg-cyan-400/50"
                    )} />
                    <span className={cn(
                        "text-[10px] font-mono tracking-widest transition-all duration-300",
                        activeSection === item.id
                            ? "text-cyan-500 opacity-100"
                            : "text-zinc-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                    )}>
                        {item.label}
                    </span>
                </div>
            ))}

            <div className="h-16 w-px bg-gradient-to-b from-zinc-800 to-transparent mx-auto mt-4" />

            <div className="flex flex-col gap-4 items-center">
                <div className="text-[9px] font-mono text-zinc-600 rotate-90 whitespace-nowrap tracking-widest mt-8">
                    SYSTEM STATUS: NORMAL
                </div>
            </div>
        </motion.div>
    );
};

export default function LandingPage() {
    const router = useRouter();
    const { playSound } = useGameSound();
    const [isLogout, setIsLogout] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search.includes('logout=success')) {
            setIsLogout(true);
            localStorage.setItem('pending_logout', 'false');
        }
    }, []);

    const [isLoaded, setIsLoaded] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [loginId, setLoginId] = useState('');
    const [loginKey, setLoginKey] = useState('');
    const [loginError, setLoginError] = useState('');
    const [activeSection, setActiveSection] = useState('hero');

    const { user, loading } = useUser();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (loading || isLogout) return;
        if (user) {
            console.log("[Intro] Active session detected. Redirecting to dashboard.");
            router.replace('/main');
        }
    }, [user, loading, router, isLogout]);

    // Initial Loading Animation
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Scroll Spy
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['hero', 'commanders', 'features', 'systems', 'secret', 'join'];
            const scrollPosition = window.scrollY + window.innerHeight / 3;

            for (const section of sections) {
                const el = document.getElementById(section);
                if (el) {
                    const { offsetTop, offsetHeight } = el;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Commanders Data
    const commanders = [
        { name: 'Gemini', title: 'DeepMind / Google', image: COMMANDER_IMAGES.gemini, quote: "멀티모달 지능의 정점. 모든 데이터를 융합하여 승리를 예측합니다." },
        { name: 'ChatGPT', title: 'OpenAI', image: COMMANDER_IMAGES.chatgpt, quote: "압도적인 범용성. 그 어떤 상황에서도 최적의 전략을 도출합니다." },
        { name: 'Claude', title: 'Anthropic', image: COMMANDER_IMAGES.claude, quote: "윤리적이고 안전한, 그러나 치명적인 논리적 완벽함." },
        { name: 'Grok', title: 'xAI', image: COMMANDER_IMAGES.grok, quote: "진실을 꿰뚫는 날카로운 통찰력. 유머와 풍자가 섞인 무자비한 공격." },
        { name: 'Midjourney', title: 'Midjourney Inc.', image: COMMANDER_IMAGES.midjourney, quote: "상상을 현실로. 전장을 예술적인 혼돈으로 물들입니다." },
    ];

    // Game Systems Data
    const gameSystems = [
        {
            icon: '🎲',
            title: '카드 생성 시스템',
            subtitle: 'GENERATION PROTOCOL',
            description: '매 턴마다 새로운 AI 유닛을 생성하세요. 랜덤성과 전략이 만나는 순간, 당신만의 최강 덱이 탄생합니다.',
            gradient: 'from-green-500/20 to-emerald-900/20',
            borderColor: 'border-green-500/30',
            glowColor: 'hover:shadow-green-500/50'
        },
        {
            icon: '✨',
            title: '카드 강화 시스템',
            subtitle: 'ENHANCEMENT LAB',
            description: '기존 유닛의 잠재력을 극대화하세요. 레벨업과 스탯 강화로 평범한 카드를 전설로 만드십시오.',
            gradient: 'from-pink-500/20 to-rose-900/20',
            borderColor: 'border-pink-500/30',
            glowColor: 'hover:shadow-pink-500/50'
        },
        {
            icon: '🔮',
            title: '카드 합성 시스템',
            subtitle: 'FUSION CHAMBER',
            description: '두 개의 카드를 융합하여 완전히 새로운 능력을 가진 하이브리드 유닛을 창조하세요. 무한한 조합의 가능성이 열립니다.',
            gradient: 'from-blue-500/20 to-indigo-900/20',
            borderColor: 'border-blue-500/30',
            glowColor: 'hover:shadow-blue-500/50'
        },
        {
            icon: '🧬',
            title: '유니크 유닛 생성',
            subtitle: 'UNIQUE PROTOCOL',
            description: '세상에 단 하나뿐인 당신만의 AI 유닛을 디자인하세요. 커스텀 능력과 외형으로 진정한 독창성을 증명하십시오.',
            gradient: 'from-purple-500/20 to-violet-900/20',
            borderColor: 'border-purple-500/30',
            glowColor: 'hover:shadow-purple-500/50'
        },
        {
            icon: '📖',
            title: '백과사전 시스템',
            subtitle: 'KNOWLEDGE BASE',
            description: '모든 AI 유닛의 정보와 전략을 한눈에. 상대의 약점을 파악하고 완벽한 카운터 전략을 수립하세요.',
            gradient: 'from-cyan-500/20 to-teal-900/20',
            borderColor: 'border-cyan-500/30',
            glowColor: 'hover:shadow-cyan-500/50'
        },
        {
            icon: '🏛️',
            title: '군단 본부',
            subtitle: 'FACTION COMMAND',
            description: '20개의 AI 팩션 중 하나를 선택하고 그들의 고유 능력을 활용하세요. 각 군단은 독특한 플레이스타일을 제공합니다.',
            gradient: 'from-amber-500/20 to-orange-900/20',
            borderColor: 'border-amber-500/30',
            glowColor: 'hover:shadow-amber-500/50'
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-cyan-500/30">
            {/* Custom Sidebar */}
            <LandingSidebar activeSection={activeSection} />

            {/* Login Modal */}
            <AnimatePresence>
                {showLogin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
                        onClick={() => setShowLogin(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
                            <div className="p-8">
                                <h2 className="text-2xl font-bold mb-1 text-white orbitron">ACCESS CONTROL</h2>
                                <p className="text-zinc-500 text-sm mb-6 font-mono">IDENTIFY YOURSELF, COMMANDER.</p>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    setLoginError('');
                                    if (!loginId || !loginKey) { setLoginError('MISSING CREDENTIALS'); return; }

                                    const attemptLogin = async () => {
                                        try {
                                            const { gameStorage } = await import('@/lib/game-storage');
                                            gameStorage.clearAllSessionData();
                                            const user = await signInWithEmail(loginId, loginKey);
                                            if (user) {
                                                login(loginId, loginKey);
                                                window.location.href = '/main';
                                            } else {
                                                setLoginError('INVALID CREDENTIALS');
                                            }
                                        } catch (err: any) {
                                            setLoginError(err.message || 'LOGIN FAILED');
                                        }
                                    };
                                    attemptLogin();
                                }} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-mono text-zinc-500 mb-1 block">CODENAME (EMAIL)</label>
                                        <input
                                            type="text"
                                            value={loginId}
                                            onChange={(e) => setLoginId(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors font-mono"
                                            placeholder="commander@ai-war.net"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-mono text-zinc-500 mb-1 block">ACCESS KEY (PASSWORD)</label>
                                        <input
                                            type="password"
                                            value={loginKey}
                                            onChange={(e) => setLoginKey(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors font-mono"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    {loginError && (
                                        <div className="text-red-500 text-xs font-mono bg-red-500/10 px-3 py-2 rounded border border-red-500/20">
                                            ERROR: {loginError}
                                        </div>
                                    )}
                                    <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors uppercase tracking-widest text-sm">
                                        Establish Link
                                    </button>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => router.push('/signup')} className="flex-1 py-3 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs hover:bg-zinc-700 transition-colors">
                                            CREATE PROFILE
                                        </button>
                                        <button type="button" onClick={async () => {
                                            try {
                                                const { signInAnonymous } = await import('@/lib/firebase-auth');
                                                const user = await signInAnonymous();
                                                if (user) window.location.href = '/main';
                                            } catch (e) {
                                                console.error(e);
                                                setLoginError('GUEST ACCESS DENIED');
                                            }
                                        }} className="flex-1 py-3 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs hover:bg-zinc-700 transition-colors">
                                            GUEST ACCESS
                                        </button>
                                    </div>
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-600">Secure Protocol</span></div>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="w-full"><GoogleLoginButton /></div>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HERO SECTION */}
            <section id="hero" className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
                <BackgroundBeams className="opacity-20 pointer-events-none" />

                <div className="w-full absolute inset-0 h-screen">
                    <SparklesCore
                        id="tsparticlesfullpage"
                        background="transparent"
                        minSize={0.6}
                        maxSize={1.4}
                        particleDensity={100}
                        className="w-full h-full"
                        particleColor="#FFFFFF"
                    />
                </div>

                <div className="z-10 relative flex flex-col items-center justify-center w-full max-w-7xl px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="mb-8"
                    >
                        <h2
                            className="text-cyan-500 font-mono tracking-[0.5em] text-sm md:text-base uppercase text-center mb-4 cursor-default hover:text-cyan-400 transition-colors"
                            onMouseEnter={() => playSound('sfx_hover')}
                        >
                            Protocol 2030 Initiated
                        </h2>
                    </motion.div>

                    <div className="w-full max-w-5xl h-[200px] md:h-[400px] relative z-20 select-none flex items-center justify-center">
                        <TextHoverEffect text="AI WA R" className="text-[300px]" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <h1 className="text-[12vw] md:text-[9vw] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-800 mix-blend-overlay opacity-30">
                                AI WAR
                            </h1>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mt-8 text-center max-w-2xl text-zinc-400 leading-relaxed font-light"
                    >
                        <TextGenerateEffect words="신경망의 충돌이 시작되었습니다. 최고의 AI 모델들을 지휘하여 최후의 승자가 되십시오. 전략, 운, 그리고 알고리즘이 당신의 운명을 결정합니다." />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="mt-12"
                    >
                        <HoverBorderGradient
                            onClick={() => {
                                playSound('sfx_click');
                                setShowLogin(true);
                            }}
                            onMouseEnter={() => playSound('sfx_hover')}
                            containerClassName="rounded-full"
                            className="bg-zinc-950 text-white flex items-center space-x-2 px-8 py-4 cursor-pointer"
                        >
                            <span className="font-mono text-sm tracking-widest uppercase font-bold">Enter The Network</span>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </HoverBorderGradient>
                    </motion.div>
                </div>
            </section>

            {/* COMMANDER SHOWCASE */}
            <section id="commanders" className="py-24 bg-zinc-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
                <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 orbitron bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                        LEGENDARY COMMANDERS
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        현존하는 가장 강력한 AI 모델들을 직접 지휘하십시오. 각 지휘관은 고유한 특성과 전략을 가지고 있습니다.
                    </p>
                </div>

                <InfiniteMovingCards
                    items={commanders.map(c => ({
                        quote: c.quote,
                        name: c.name,
                        title: c.title,
                        content: (
                            <div className="flex flex-col items-center text-center">
                                <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-cyan-500 transition-colors">
                                    <Image
                                        src={c.image}
                                        alt={c.name}
                                        fill
                                        className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{c.name}</h3>
                                <p className="text-xs text-cyan-500 font-mono mb-3">{c.title}</p>
                                <p className="text-sm text-zinc-400 italic">"{c.quote}"</p>
                            </div>
                        )
                    }))}
                    direction="right"
                    speed="slow"
                />
            </section>

            {/* GAMEPLAY FEATURES */}
            <section id="features" className="py-32 bg-black relative">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 orbitron bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                            CORE GAMEPLAY
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            세 가지 핵심 게임 모드로 당신의 전략적 사고를 시험하세요
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <CardContainer className="inter-var">
                            <CardBody className="bg-zinc-900/50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-cyan-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
                                <CardItem translateZ="50" className="text-xl font-bold text-neutral-600 dark:text-white">
                                    전략적 드래프트
                                </CardItem>
                                <CardItem as="p" translateZ="60" className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300">
                                    매 턴 최적의 카드를 선택하여 나만의 덱을 구축하십시오. 시너지를 고려한 선택이 승패를 가릅니다.
                                </CardItem>
                                <CardItem translateZ="100" className="w-full mt-4">
                                    <div className="h-40 w-full bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-lg flex items-center justify-center border border-white/5">
                                        <div className="text-4xl">🃏</div>
                                    </div>
                                </CardItem>
                            </CardBody>
                        </CardContainer>

                        <CardContainer className="inter-var">
                            <CardBody className="bg-zinc-900/50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-purple-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
                                <CardItem translateZ="50" className="text-xl font-bold text-neutral-600 dark:text-white">
                                    실시간 아레나
                                </CardItem>
                                <CardItem as="p" translateZ="60" className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300">
                                    전 세계의 지휘관들과 경쟁하십시오. 랭크 시스템과 리더보드가 당신의 실력을 증명합니다.
                                </CardItem>
                                <CardItem translateZ="100" className="w-full mt-4">
                                    <div className="h-40 w-full bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg flex items-center justify-center border border-white/5">
                                        <div className="text-4xl">⚔️</div>
                                    </div>
                                </CardItem>
                            </CardBody>
                        </CardContainer>

                        <CardContainer className="inter-var">
                            <CardBody className="bg-zinc-900/50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-yellow-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
                                <CardItem translateZ="50" className="text-xl font-bold text-neutral-600 dark:text-white">
                                    몰입감 넘치는 스토리
                                </CardItem>
                                <CardItem as="p" translateZ="60" className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300">
                                    AI 대전쟁의 배후에 숨겨진 진실을 파헤치십시오. 고유의 보스와 다양한 챕터가 기다립니다.
                                </CardItem>
                                <CardItem translateZ="100" className="w-full mt-4">
                                    <div className="h-40 w-full bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-lg flex items-center justify-center border border-white/5">
                                        <div className="text-4xl">📖</div>
                                    </div>
                                </CardItem>
                            </CardBody>
                        </CardContainer>
                    </div>
                </div>
            </section>

            {/* NEW: GAME SYSTEMS SECTION */}
            <section id="systems" className="py-32 bg-zinc-950/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
                <Meteors number={20} />

                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 orbitron bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                            ADVANCED SYSTEMS
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            끊임없이 진화하는 게임 시스템으로 당신만의 전략을 완성하세요
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gameSystems.map((system, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className={cn(
                                    "relative group bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:scale-105",
                                    system.borderColor,
                                    system.glowColor
                                )}
                                onMouseEnter={() => playSound('sfx_hover')}
                            >
                                <div className={cn(
                                    "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br",
                                    system.gradient
                                )} />

                                <div className="relative z-10">
                                    <div className="text-5xl mb-4">{system.icon}</div>
                                    <h3 className="text-xl font-bold text-white mb-2">{system.title}</h3>
                                    <p className="text-xs font-mono text-cyan-500 mb-3 tracking-wider">{system.subtitle}</p>
                                    <p className="text-sm text-zinc-400 leading-relaxed">{system.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CLASSIFIED SECTION */}
            <section id="secret" className="py-24 bg-black relative overflow-hidden flex flex-col items-center justify-center border-t border-b border-white/5">
                <div className="text-center mb-12 relative z-10">
                    <h2 className="text-3xl font-bold mb-4 orbitron tracking-widest text-red-500/80">
                        CLASSIFIED INTEL // TOP SECRET
                    </h2>
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
                        Hover card to decrypt hidden data
                    </p>
                </div>

                <div className="border border-white/10 flex flex-col items-start max-w-sm mx-auto p-4 relative h-[30rem] w-[24rem]">
                    <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white" />
                    <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white" />
                    <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white" />
                    <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white" />

                    <EvervaultCard text="SECRET" />

                    <h2 className="text-white mt-4 text-sm font-light font-mono">
                        PROJECT: BLACK BOX
                    </h2>
                    <p className="text-sm border border-white/20 rounded-full mt-4 text-white hover:border-cyan-500 hover:text-cyan-500 transition-colors px-4 py-2 w-fit cursor-pointer font-mono">
                        ACCESS RESTRICTED
                    </p>
                </div>
            </section>

            {/* FOOTER CTA */}
            <section id="join" className="py-24 border-t border-white/5 bg-zinc-950/80 backdrop-blur-sm relative z-20">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold mb-4 text-white">READY TO DEPLOY?</h2>
                        <p className="text-zinc-400 mb-8 max-w-md">
                            지금 바로 접속하여 사령관님의 능력을 증명하십시오.<br />
                            초기 접속 시 한정판 '제네시스 코어'가 지급됩니다.
                        </p>
                        <button
                            onClick={() => {
                                playSound('sfx_click');
                                setShowLogin(true);
                            }}
                            onMouseEnter={() => playSound('sfx_hover')}
                            className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 group"
                        >
                            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl px-12 uppercase tracking-widest group-hover:bg-slate-900 transition-colors">
                                Join The War
                            </span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex flex-col gap-4 text-center">
                            <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Powered By</span>
                            <div className="font-bold text-xl text-white">Next.js</div>
                            <div className="font-bold text-xl text-white">Firebase</div>
                        </div>
                        <div className="flex flex-col gap-4 text-center">
                            <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Intelligence</span>
                            <div className="font-bold text-xl text-white">Gemini</div>
                            <div className="font-bold text-xl text-white">OpenAI</div>
                        </div>
                    </div>
                </div>
                <div className="mt-24 pt-8 border-t border-white/5 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="flex gap-6 text-zinc-500 text-xs font-mono uppercase tracking-wider">
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">Privacy Protocol</span>
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">Terms of Engagement</span>
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">System Status</span>
                    </div>
                    <div className="text-zinc-700 text-[10px] font-mono">
                        © 2030 AI WAR PROJECT. CLASSIFIED CLEARANCE LEVEL 5 REQUIRED.
                    </div>
                </div>
            </section>
        </div>
    );
}
