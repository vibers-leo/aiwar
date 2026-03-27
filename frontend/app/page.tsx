'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { HoverBorderGradient } from '@/components/ui/aceternity/hover-border-gradient';
import GoogleLoginButton from '@/components/GoogleLoginButton';

import { signInWithEmail } from '@/lib/firebase-auth';
import { login, signInAsGuest } from '@/lib/auth-utils';
import { gameStorage } from '@/lib/game-storage';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';

/* =============================================================
   AGI WAR — Vantablack Luxe Landing Page
   Supanova Taste-Skill Applied
   Archetype: Deep OLED Black + Glass Cards + Cinematic Typography
   Accent: Cyan (#00D9FF) — game's signature color
   ============================================================= */

const FACTIONS = [
    { name: 'OpenAI', leader: 'GPT-5 Omni', power: 97, members: '4,200+', trait: '범용 지능의 끝' },
    { name: 'Anthropic', leader: 'Claude Opus', power: 95, members: '3,870+', trait: '안전한 초지능' },
    { name: 'DeepMind', leader: 'Gemini Ultra', power: 94, members: '3,540+', trait: '과학적 사고력' },
    { name: 'Meta AI', leader: 'Llama-4', power: 91, members: '5,100+', trait: '오픈소스 혁명' },
    { name: 'xAI', leader: 'Grok-3', power: 89, members: '2,890+', trait: '자유로운 진실' },
    { name: 'Mistral', leader: 'Mistral Large', power: 87, members: '1,760+', trait: '유럽의 자존심' },
];

const FEATURES = [
    {
        title: '턴제 카드 배틀',
        desc: '20개 AI 군단의 카드를 수집하고 전략적으로 배치하세요. 스탯, 시너지, 타이밍이 승패를 결정합니다.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
    },
    {
        title: '시네마틱 스토리',
        desc: '2030년, AI가 자아를 가진 세계. 각 진영의 이야기를 비주얼 노벨 연출로 경험하세요.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
        ),
    },
    {
        title: '실시간 PVP',
        desc: '전 세계 지휘관과 실시간으로 대결하세요. 랭킹 시스템과 시즌 보상이 기다립니다.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
    },
    {
        title: '미니게임',
        desc: '메인 전투 외에도 다양한 미니게임으로 보상을 획득하고 카드를 강화하세요.',
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82 47.646 47.646 0 00-4.163.3.64.64 0 01-.657-.643v0z" />
            </svg>
        ),
    },
];

const SEASON_INFO = {
    current: '시즌 1',
    title: '전쟁의 서막',
    chapters: 5,
    status: '완결',
    next: '시즌 2: 도원결의 편',
    nextStatus: '개발 중',
};

export default function IntroPage() {
    const router = useRouter();
    const [isLogout, setIsLogout] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search.includes('logout=success')) {
            setIsLogout(true);
            localStorage.setItem('pending_logout', 'false');
        }
    }, []);

    const [isLoaded, setIsLoaded] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [glitchText, setGlitchText] = useState('INITIALIZING');
    const [systemStatus, setSystemStatus] = useState<string[]>([]);

    // Login State
    const [loginId, setLoginId] = useState('');
    const [loginKey, setLoginKey] = useState('');
    const [loginError, setLoginError] = useState('');

    const { user, loading } = useUser();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (loading || isLogout) return;
        if (user) {
            console.log("[Intro] Active session detected. Redirecting to dashboard.");
            router.replace('/main');
        }
    }, [user, loading, router, isLogout]);

    // Boot sequence animation
    useEffect(() => {
        const bootSequence = [
            'NEURAL_LINK::ESTABLISHING...',
            'QUANTUM_CORE::ACTIVATED',
            'FACTION_DATABASE::SYNCHRONIZED',
            'COMBAT_PROTOCOLS::LOADED',
            'AGI_WAR_NETWORK::ONLINE',
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < bootSequence.length) {
                setSystemStatus(prev => [...prev, bootSequence[index]]);
                index++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    setIsLoaded(true);
                    setGlitchText('ENTER_THE_NETWORK');
                }, 500);
            }
        }, 400);

        return () => clearInterval(interval);
    }, []);

    // Safety fallback
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            if (!isLoaded) {
                console.warn("[Intro] Boot sequence took too long. Force releasing UI.");
                setIsLoaded(true);
                setGlitchText('ENTER_THE_NETWORK');
            }
        }, 5000);
        return () => clearTimeout(safetyTimer);
    }, [isLoaded]);

    // Glitch effect
    useEffect(() => {
        if (!isLoaded) return;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const originalText = 'ENTER_THE_NETWORK';

        const interval = setInterval(() => {
            if (Math.random() > 0.9) {
                const glitched = originalText.split('').map((char) =>
                    Math.random() > 0.8 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char
                ).join('');
                setGlitchText(glitched);
                setTimeout(() => setGlitchText(originalText), 100);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [isLoaded]);

    // Intersection Observer for scroll reveals
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            },
            { threshold: 0.15 }
        );

        document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [isLoaded]);

    // Parallax for hero
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 600], [1, 0.95]);

    return (
        <div className="relative bg-[#050505] text-white overflow-y-auto overflow-x-hidden" style={{ height: '100dvh' }}>

            {/* ===== Noise Grain Overlay ===== */}
            <div
                className="fixed inset-0 z-[60] pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* ===== HERO SECTION — Cinematic Fullscreen ===== */}
            <motion.section
                ref={heroRef}
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4"
            >
                {/* Ambient Gradient Mesh */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-500/[0.04] rounded-full blur-[120px]" />
                    <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] bg-cyan-400/[0.03] rounded-full blur-[100px]" />
                    <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[100px]" />
                </div>

                {/* Grid pattern — subtle */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_60%)]" />

                <BackgroundBeams className="opacity-20" />

                {/* Boot Sequence Terminal */}
                <AnimatePresence>
                    {!isLoaded && (
                        <motion.div
                            className="absolute top-6 left-6 font-mono text-[10px] text-cyan-500/60 z-20"
                            exit={{ opacity: 0 }}
                        >
                            {!isFirebaseConfigured && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-4 p-2 border border-red-500/40 bg-red-500/10 text-red-400"
                                >
                                    [CRITICAL] FIREBASE_CONFIG_MISSING
                                </motion.div>
                            )}
                            {systemStatus.map((status, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-1"
                                >
                                    <span className="text-cyan-400">+</span> {status}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hero Content */}
                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    {/* Decorative Line */}
                    <motion.div
                        className="flex items-center justify-center gap-4 mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isLoaded ? 1 : 0 }}
                        transition={{ delay: 2.5, duration: 1 }}
                    >
                        <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-cyan-500/50" />
                        <div className="w-2 h-2 border border-cyan-500/50 rotate-45" />
                        <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-cyan-500/50" />
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                        className="text-[72px] sm:text-[100px] md:text-[130px] lg:text-[160px] font-black tracking-[-0.04em] leading-none select-none"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
                        transition={{ delay: 2.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            fontFamily: "'Geist', system-ui, sans-serif",
                            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        AGI WAR
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                        transition={{ delay: 3, duration: 0.8 }}
                        className="mt-4 sm:mt-6 space-y-3"
                    >
                        <p
                            className="text-sm sm:text-base md:text-lg tracking-[0.3em] text-cyan-400/90 font-semibold uppercase break-keep"
                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                        >
                            AI가 자아를 가진 세계, 당신이 지휘관입니다
                        </p>
                        <p className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-white/25">
                            SYSTEM v2.0.30 // YEAR 2030 // NEURAL NETWORK CONFLICT
                        </p>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                        transition={{ delay: 3.5, duration: 0.8 }}
                        className="mt-10 sm:mt-14"
                    >
                        <button
                            onClick={() => setShowLogin(true)}
                            className="group relative inline-flex items-center gap-3 px-10 sm:px-14 py-4 sm:py-5 bg-cyan-500/10 border border-cyan-500/30 rounded-full font-mono text-sm sm:text-base tracking-[0.3em] text-cyan-400 uppercase transition-all duration-500 hover:bg-cyan-500/20 hover:border-cyan-400/60 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_40px_rgba(0,217,255,0.15)]"
                        >
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                            {glitchText}
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    </motion.div>

                    {/* Stats Strip */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isLoaded ? 1 : 0 }}
                        transition={{ delay: 4, duration: 1 }}
                        className="mt-16 sm:mt-20 flex items-center justify-center gap-6 sm:gap-10 text-[10px] sm:text-xs font-mono text-white/20"
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                            NETWORK STABLE
                        </span>
                        <span className="hidden sm:inline">|</span>
                        <span className="hidden sm:inline">COMMANDERS: 2,847</span>
                        <span className="hidden sm:inline">|</span>
                        <span className="hidden sm:inline">BATTLES TODAY: 12,493</span>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 0.4 : 0 }}
                    transition={{ delay: 5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
                >
                    <span className="text-[9px] font-mono tracking-[0.2em] uppercase">Scroll</span>
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* ===== FEATURES SECTION — Bento Grid ===== */}
            <section className="relative py-24 sm:py-32 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 mb-16 sm:mb-20">
                        <p className="text-xs font-mono tracking-[0.3em] text-cyan-400/60 uppercase mb-4">Core Systems</p>
                        <h2
                            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight break-keep"
                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                        >
                            전략의 깊이가 다른<br />
                            <span className="text-cyan-400">카드 배틀 게임</span>
                        </h2>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {FEATURES.map((feature, i) => (
                            <div
                                key={feature.title}
                                className={`scroll-reveal opacity-0 translate-y-8 transition-all duration-700 group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 sm:p-8 hover:border-cyan-500/20 hover:bg-white/[0.04] ${i === 0 ? 'md:row-span-2 md:py-12' : ''}`}
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                {/* Glass edge refraction */}
                                <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />

                                <div className="relative z-10">
                                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-5 group-hover:bg-cyan-500/15 transition-colors duration-300">
                                        {feature.icon}
                                    </div>
                                    <h3
                                        className="text-xl sm:text-2xl font-bold mb-3 break-keep"
                                        style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p
                                        className="text-sm sm:text-base text-white/40 leading-relaxed break-keep max-w-[50ch]"
                                        style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                    >
                                        {feature.desc}
                                    </p>
                                </div>

                                {/* Subtle glow on hover */}
                                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/[0.03] rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FACTIONS SECTION — Glass Cards ===== */}
            <section className="relative py-24 sm:py-32 px-4">
                {/* Section Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />

                <div className="relative max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 mb-16 sm:mb-20 text-right">
                        <p className="text-xs font-mono tracking-[0.3em] text-cyan-400/60 uppercase mb-4">AI Factions</p>
                        <h2
                            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight break-keep"
                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                        >
                            6대 AI 진영이<br />
                            <span className="text-cyan-400">패권을 다툰다</span>
                        </h2>
                    </div>

                    {/* Faction Cards — Staggered Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {FACTIONS.map((faction, i) => (
                            <div
                                key={faction.name}
                                className="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-5 sm:p-6 hover:border-cyan-500/20 hover:bg-white/[0.04]"
                                style={{ transitionDelay: `${i * 80}ms` }}
                            >
                                <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-[10px] font-mono text-cyan-400/50 tracking-wider uppercase mb-1">
                                                {faction.name}
                                            </p>
                                            <h3
                                                className="text-lg font-bold break-keep"
                                                style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                            >
                                                {faction.leader}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-cyan-400 font-mono">{faction.power}</p>
                                            <p className="text-[9px] font-mono text-white/25 uppercase">Power</p>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/[0.06] mb-4" />

                                    <div className="flex items-center justify-between text-xs">
                                        <span
                                            className="text-white/30 break-keep"
                                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                        >
                                            {faction.trait}
                                        </span>
                                        <span className="font-mono text-white/20">{faction.members}</span>
                                    </div>
                                </div>

                                <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-cyan-500/[0.03] rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== SEASON INFO SECTION ===== */}
            <section className="relative py-24 sm:py-32 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                        <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />

                        <div className="relative z-10 p-8 sm:p-12 md:p-16">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
                                {/* Current Season */}
                                <div className="flex-1">
                                    <p className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/50 uppercase mb-3">Now Playing</p>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3
                                            className="text-3xl sm:text-4xl font-bold break-keep"
                                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                        >
                                            {SEASON_INFO.current}
                                        </h3>
                                        <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400">
                                            {SEASON_INFO.status}
                                        </span>
                                    </div>
                                    <p
                                        className="text-xl sm:text-2xl text-white/50 font-medium mb-6 break-keep"
                                        style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                    >
                                        {SEASON_INFO.title}
                                    </p>

                                    <div className="flex items-center gap-6 text-sm font-mono text-white/25">
                                        <span>{SEASON_INFO.chapters}개 챕터</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span>비주얼 노벨 연출</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span>다중 엔딩</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px h-32 bg-white/[0.06] self-center" />

                                {/* Next Season */}
                                <div className="flex-1 md:text-right">
                                    <p className="text-[10px] font-mono tracking-[0.3em] text-white/20 uppercase mb-3">Coming Next</p>
                                    <h3
                                        className="text-2xl sm:text-3xl font-bold text-white/30 mb-2 break-keep"
                                        style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                    >
                                        {SEASON_INFO.next}
                                    </h3>
                                    <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-mono tracking-wider uppercase bg-white/5 border border-white/10 rounded text-white/30">
                                        <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full animate-pulse" />
                                        {SEASON_INFO.nextStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION — Full Bleed ===== */}
            <section className="relative py-32 sm:py-40 px-4">
                {/* Ambient glow */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[120px]" />
                </div>

                <div className="relative max-w-3xl mx-auto text-center">
                    <div className="scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
                        <h2
                            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6 break-keep"
                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                        >
                            지금, 전쟁에<br />
                            <span className="text-cyan-400">참전하세요</span>
                        </h2>
                        <p
                            className="text-base sm:text-lg text-white/30 mb-10 max-w-[45ch] mx-auto leading-relaxed break-keep"
                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                        >
                            무료로 시작할 수 있습니다. 당신만의 AI 군단을 편성하고
                            최강의 지휘관이 되어보세요.
                        </p>

                        <button
                            onClick={() => setShowLogin(true)}
                            className="group relative inline-flex items-center gap-3 px-12 sm:px-16 py-5 sm:py-6 bg-cyan-500 text-[#050505] rounded-full font-bold text-base sm:text-lg tracking-wide transition-all duration-500 hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_50px_rgba(0,217,255,0.3)]"
                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                        >
                            무료로 시작하기
                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </button>

                        {/* Trust signal */}
                        <p className="mt-6 text-[11px] font-mono text-white/15 tracking-wider">
                            회원가입 30초 / 카드 없이 무료 플레이
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER — Minimal ===== */}
            <footer className="relative border-t border-white/[0.04] py-8 px-4">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-white/15">
                    <span>AGI WAR v2.0.30</span>
                    <span>&copy; 2026 AGI WAR. All rights reserved.</span>
                </div>
            </footer>

            {/* ===== LOGIN MODAL ===== */}
            <AnimatePresence>
                {showLogin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
                        onClick={() => setShowLogin(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md"
                        >
                            {/* Glass Card */}
                            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl">
                                {/* Top edge refraction */}
                                <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />

                                {/* Header Bar */}
                                <div className="relative z-10 px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                                    </div>
                                    <span className="text-[10px] font-mono text-white/20 tracking-wider">AUTHENTICATION</span>
                                    <button
                                        onClick={() => setShowLogin(false)}
                                        className="text-white/20 hover:text-white/50 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form
                                    className="relative z-10 p-6 sm:p-8"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setLoginError('');

                                        if (!loginId || !loginKey) {
                                            setLoginError('이메일과 비밀번호를 입력해주세요');
                                            return;
                                        }

                                        const attemptLogin = async () => {
                                            try {
                                                const { gameStorage } = await import('@/lib/game-storage');
                                                gameStorage.clearAllSessionData();

                                                const user = await signInWithEmail(loginId, loginKey);
                                                if (user) {
                                                    login(loginId, loginKey);
                                                    setSystemStatus(prev => [...prev, 'ACCESS_GRANTED', 'REDIRECTING...']);
                                                    setTimeout(() => window.location.href = '/main', 800);
                                                } else {
                                                    setLoginError('인증에 실패했습니다');
                                                }
                                            } catch (err: any) {
                                                setLoginError(err.message || '인증 중 오류가 발생했습니다');
                                            }
                                        };

                                        attemptLogin();
                                    }}
                                >
                                    <div className="text-center mb-8">
                                        <h2
                                            className="text-xl font-bold mb-2 break-keep"
                                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                        >
                                            지휘관 인증
                                        </h2>
                                        <p
                                            className="text-xs text-white/30 break-keep"
                                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                        >
                                            네트워크 접속을 위한 인증 정보를 입력하세요
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-mono text-white/30 mb-2 tracking-wider uppercase">
                                                이메일
                                            </label>
                                            <input
                                                type="text"
                                                value={loginId}
                                                onChange={(e) => setLoginId(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm focus:border-cyan-500/40 focus:outline-none focus:bg-white/[0.05] transition-all placeholder:text-white/15"
                                                style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                                placeholder="이메일을 입력하세요"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono text-white/30 mb-2 tracking-wider uppercase">
                                                비밀번호
                                            </label>
                                            <input
                                                type="password"
                                                value={loginKey}
                                                onChange={(e) => setLoginKey(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm focus:border-cyan-500/40 focus:outline-none focus:bg-white/[0.05] transition-all placeholder:text-white/15"
                                                style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                                placeholder="비밀번호를 입력하세요"
                                            />
                                        </div>

                                        {loginError && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="text-red-400 text-xs font-mono border border-red-500/20 bg-red-500/5 p-3 rounded-lg text-center"
                                            >
                                                {loginError}
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="mt-8 space-y-3">
                                        <button
                                            type="submit"
                                            className="w-full py-3.5 bg-cyan-500 text-[#050505] rounded-lg font-bold text-sm tracking-wide transition-all duration-300 hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,217,255,0.2)] active:scale-[0.98]"
                                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                        >
                                            로그인
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => router.push('/signup')}
                                            className="w-full py-3 text-white/30 hover:text-white/60 text-xs tracking-wider uppercase transition-colors border border-white/[0.06] rounded-lg hover:bg-white/[0.03]"
                                            style={{ fontFamily: "'Pretendard', system-ui, sans-serif" }}
                                        >
                                            회원가입
                                        </button>

                                        <div className="pt-3 border-t border-white/[0.06] space-y-2">
                                            <GoogleLoginButton />

                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        const { signInAnonymous } = await import('@/lib/firebase-auth');
                                                        const user = await signInAnonymous();
                                                        if (user) {
                                                            setSystemStatus(prev => [...prev, 'GUEST_ACCESS_GRANTED', 'REDIRECTING...']);
                                                            setTimeout(() => window.location.href = '/main', 500);
                                                        } else {
                                                            setLoginError('게스트 인증에 실패했습니다');
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        setLoginError('게스트 인증 오류');
                                                    }
                                                }}
                                                className="w-full py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white/25 hover:text-white/50 rounded-lg border border-white/[0.06] font-mono text-[10px] uppercase tracking-wider transition-all"
                                            >
                                                GUEST LOGIN (익명 접속)
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== CSS for scroll reveal ===== */}
            <style jsx global>{`
                .scroll-reveal {
                    opacity: 0;
                    transform: translateY(2rem);
                    transition: opacity 0.7s ease, transform 0.7s ease;
                }
                .scroll-reveal.revealed {
                    opacity: 1;
                    transform: translateY(0);
                }
            `}</style>
        </div>
    );
}
