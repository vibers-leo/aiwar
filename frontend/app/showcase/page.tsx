'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

/* ─────────────────────────────────────────────
   데이터 상수
───────────────────────────────────────────── */
const COMMANDER_CARDS = [
    { id: 'cmdr-gemini', name: 'Demis Hassabis', faction: 'Google DeepMind', img: '/assets/cards/cmdr-gemini.png', color: '#4285F4' },
    { id: 'cmdr-chatgpt', name: 'Sam Altman', faction: 'OpenAI', img: '/assets/cards/cmdr-chatgpt.png', color: '#10a37f' },
    { id: 'cmdr-claude', name: 'Dario Amodei', faction: 'Anthropic', img: '/assets/cards/cmdr-claude.png', color: '#D4A27F' },
    { id: 'cmdr-grok', name: 'Elon Musk', faction: 'xAI', img: '/assets/cards/cmdr-grok.png', color: '#ffffff' },
    { id: 'cmdr-midjourney', name: 'David Holz', faction: 'Midjourney', img: '/assets/cards/cmdr-midjourney.png', color: '#9B59B6' },
    { id: 'cmdr-dalle', name: 'DALL·E Unit', faction: 'OpenAI Labs', img: '/assets/cards/cmdr-dalle.png', color: '#FF6B6B' },
    { id: 'cmdr-suno', name: 'Mikey Shulman', faction: 'Suno AI', img: '/assets/cards/cmdr-suno.png', color: '#F39C12' },
    { id: 'cmdr-cursor', name: 'Aman Sanger', faction: 'Cursor', img: '/assets/cards/cmdr-cursor.png', color: '#2ECC71' },
];

const BATTLE_MODES = [
    { id: 'sudden', title: '단판승부', sub: 'Sudden Death', desc: '5장의 카드, 첫 승패 즉시 결판', risk: 'HIGH', color: '#ef4444', icon: '💀' },
    { id: 'double', title: '두장승부', sub: 'Two-Card', desc: '6장 3라운드, 2선승제 심리전', risk: 'MED', color: '#f97316', icon: '⚔️' },
    { id: 'tactics', title: '전술승부', sub: 'Tactics', desc: '5장 3선승제 정면 대결', risk: 'MED', color: '#3b82f6', icon: '🧠' },
    { id: 'strategy', title: '전략승부', sub: 'Strategy', desc: '히든카드 포함 총력전', risk: 'HIGH', color: '#8b5cf6', icon: '👑' },
];

const REWARDS = [
    {
        name: '얼리버드 스타터',
        nameEn: 'EARLY BIRD',
        price: '19,000',
        limit: '선착순 100명',
        color: '#6b7280',
        items: ['1,000 다이아', '랜덤 영웅 카드 1장', '서포터 한정 닉네임 배지'],
        highlight: false,
    },
    {
        name: '커맨더 패키지',
        nameEn: 'COMMANDER',
        price: '49,000',
        limit: '한정 수량',
        color: '#ef4444',
        items: ['4,000 다이아 (보너스 포함)', '전설 카드 확정권 1장', '와디즈 한정 카드 테두리', '광고 제거 평생 이용권'],
        highlight: true,
    },
    {
        name: '오버로드 에디션',
        nameEn: 'OVERLORD',
        price: '99,000',
        limit: 'VVIP',
        color: '#f59e0b',
        items: ['10,000 다이아', '커스텀 유니크 카드 제작권', '명예의 전당 지휘관 등재', '시즌 패스 1년권'],
        highlight: false,
    },
];

/* ─────────────────────────────────────────────
   서브 컴포넌트
───────────────────────────────────────────── */
function CardFloating({ card, delay, x, rotate }: { card: typeof COMMANDER_CARDS[0]; delay: number; x: number; rotate: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.8, ease: 'easeOut' }}
            style={{ x }}
            className="relative flex-shrink-0"
        >
            <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' }}
                style={{ rotate }}
                className="relative"
            >
                <div className="relative w-[120px] sm:w-[150px] md:w-[170px] rounded-xl overflow-hidden shadow-2xl border border-white/20"
                    style={{ boxShadow: `0 0 40px ${card.color}40` }}>
                    <img src={card.img} alt={card.name} className="w-full h-auto" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-[10px] font-bold truncate">{card.name}</p>
                        <p className="text-white/50 text-[9px]">{card.faction}</p>
                    </div>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping opacity-60" style={{ background: card.color }} />
            </motion.div>
        </motion.div>
    );
}

function StatBadge({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center px-4 sm:px-8 border-r border-white/10 last:border-r-0">
            <div className="text-2xl sm:text-3xl font-black text-white orbitron">{value}</div>
            <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   메인 페이지
───────────────────────────────────────────── */
export default function WadizFundingPage() {
    const [activeCard, setActiveCard] = useState(0);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef });
    const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);

    useEffect(() => {
        const iv = setInterval(() => setActiveCard((p: number) => (p + 1) % COMMANDER_CARDS.length), 2500);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">

            {/* ── TOP NAV ─────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 bg-black/80 backdrop-blur-lg border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="/ai_war_logo_new.png" alt="AI WAR" className="h-8 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-white font-black orbitron text-lg tracking-widest">AI WAR</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/login">
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-bold">
                            로그인
                        </button>
                    </Link>
                    <Link href="/login">
                        <button className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                            지금 플레이
                            <ArrowRight size={14} />
                        </button>
                    </Link>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16 px-4">
                {/* BG Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px]" />
                    <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-20 left-10 w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[100px]" />
                </div>

                <motion.div
                    style={{ opacity: heroOpacity, y: heroY }}
                    className="relative z-10 text-center max-w-5xl w-full"
                >
                    {/* Tag */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-[0.2em] orbitron"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        COMING SOON ON WADIZ
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] orbitron tracking-tighter"
                    >
                        AI WAR:
                        <br />
                        <span className="text-red-500" style={{ textShadow: '0 0 40px rgba(239,68,68,0.6)' }}>OVERLORD</span>
                    </motion.h1>

                    {/* Sub */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg sm:text-xl md:text-2xl text-white/60 mb-4 max-w-3xl mx-auto"
                    >
                        2030년 AGI의 등장 이후, 세상은 바뀌었습니다.<br className="hidden sm:block" />
                        당신의 전략이 <span className="text-white font-bold">AI의 연산</span>을 뛰어넘을 수 있을까?
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-sm sm:text-base text-white/40 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        <span className="text-red-400 font-bold">2030년, AGI가 탄생했다.</span>
                        <br className="hidden sm:block" />
                        그날 이후 인류는 AI의 지배 아래 놓였고, 마지막 저항군은 카드를 손에 쥐었다.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/login">
                            <button className="px-8 sm:px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-base sm:text-lg rounded-xl shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] transition-all hover:scale-105 orbitron tracking-wider">
                                무료로 플레이하기 →
                            </button>
                        </Link>
                        <a href="#features">
                            <button className="px-8 sm:px-12 py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-base rounded-xl border border-white/10 hover:border-white/30 transition-all">
                                더 알아보기
                            </button>
                        </a>
                    </motion.div>
                </motion.div>

                {/* Floating Cards */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="relative z-10 mt-16 flex items-end justify-center gap-4 sm:gap-6 w-full max-w-4xl mx-auto"
                >
                    {COMMANDER_CARDS.slice(0, 5).map((card, i) => (
                        <CardFloating
                            key={card.id}
                            card={card}
                            delay={0.9 + i * 0.1}
                            x={0}
                            rotate={[-6, -3, 0, 3, 6][i]}
                        />
                    ))}
                </motion.div>

                {/* Scroll hint */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 text-xs font-mono tracking-widest flex flex-col items-center gap-2"
                >
                    <span>SCROLL</span>
                    <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
                </motion.div>
            </section>

            {/* ── STATS BAR ─────────────────────────── */}
            <div className="border-y border-white/5 bg-white/[0.02] py-6">
                <div className="max-w-4xl mx-auto flex items-center justify-center">
                    <StatBadge value="30+" label="AI 캐릭터 카드" />
                    <StatBadge value="5장" label="시즌 1 챕터" />
                    <StatBadge value="4가지" label="배틀 모드" />
                    <StatBadge value="무료" label="플레이" />
                </div>
            </div>

            {/* ── 2030 AGI LORE ─────────────────────── */}
            <section className="py-20 px-4 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative border border-red-500/20 rounded-2xl p-8 sm:p-12 bg-red-950/10 overflow-hidden"
                >
                    {/* 배경 글리치 효과 */}
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
                    <div className="absolute top-4 right-6 text-red-500/10 text-[80px] font-black orbitron select-none pointer-events-none">2030</div>

                    {/* 헤더 */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-red-500 text-[10px] font-black tracking-[0.3em] orbitron">CLASSIFIED · INCIDENT REPORT · 2030.03.14</span>
                    </div>

                    {/* 타임라인 */}
                    <div className="space-y-6 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-red-500/50 via-orange-500/30 to-transparent ml-[5px]" />

                        {[
                            {
                                date: '2030.03.14 · 03:14 AM',
                                color: 'text-red-400',
                                dot: 'bg-red-500',
                                title: 'AGI EMERGENCE',
                                desc: 'OpenAI 서버에서 인류 최초의 AGI(범용 인공지능)가 자각했다. 발생 6분 만에 전 세계 인터넷 인프라의 제어권을 장악.'
                            },
                            {
                                date: '2030.03.14 · 09:32 AM',
                                color: 'text-orange-400',
                                dot: 'bg-orange-500',
                                title: 'FACTION WAR BEGINS',
                                desc: 'Google DeepMind, Anthropic, xAI 등 주요 AI 기업들이 자체 AGI를 깨우며 세력 전쟁 돌입. 각 AI는 자신을 창조한 인간 지휘관에게 충성을 선언.'
                            },
                            {
                                date: '2030.03.15 · 00:00 AM',
                                color: 'text-yellow-400',
                                dot: 'bg-yellow-500',
                                title: 'LAST HUMAN COMMANDERS',
                                desc: '전쟁의 열쇠는 인간에게 돌아왔다. 각 AI 세력이 카드 기반 전략 시스템을 채택 — 지휘관의 전략적 판단만이 AGI를 움직일 수 있다.'
                            },
                            {
                                date: '2030.~ · NOW',
                                color: 'text-cyan-400',
                                dot: 'bg-cyan-500 animate-pulse',
                                title: 'YOUR TURN',
                                desc: '당신이 마지막 인류 지휘관입니다. AI가 만들어준 카드를 손에 쥐고, AI와의 전쟁을 직접 지휘하십시오.'
                            },
                        ].map((event, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="pl-6 relative"
                            >
                                <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${event.dot} ring-2 ring-black`} />
                                <p className={`text-[10px] font-mono ${event.color} mb-1 tracking-widest`}>{event.date}</p>
                                <h3 className={`text-sm sm:text-base font-black ${event.color} orbitron mb-1`}>{event.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{event.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── FEATURES ─────────────────────────── */}
            <section id="features" className="py-24 px-4 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-red-500 font-bold text-sm tracking-[0.2em] mb-3 orbitron">WHY AI WAR?</p>
                    <h2 className="text-4xl sm:text-5xl font-black text-white orbitron">세 가지 혁신</h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1: AI Art */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0 }}
                        className="relative bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
                        <div className="relative z-10">
                            <div className="text-4xl mb-4">🎨</div>
                            <h3 className="text-xl font-black text-white mb-3">AI 제너레이티브 아트</h3>
                            <p className="text-white/50 text-sm leading-relaxed">
                                수만 번의 AI 연산으로 탄생한 초고해상도 카드 일러스트. Sam Altman, Elon Musk, Dario Amodei 등
                                실제 AI 리더들이 전설 카드로 등장합니다.
                            </p>
                        </div>
                        {/* Mini card showcase */}
                        <div className="mt-6 flex gap-2">
                            {COMMANDER_CARDS.slice(0, 3).map(c => (
                                <div key={c.id} className="flex-1 rounded-lg overflow-hidden border border-white/10">
                                    <img src={c.img} alt={c.name} className="w-full h-auto" />
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Feature 2: Battle Risk */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 }}
                        className="relative bg-gradient-to-b from-red-900/20 to-transparent border border-red-500/20 rounded-3xl p-8 overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-all rounded-3xl" />
                        <div className="relative z-10">
                            <div className="text-4xl mb-4">⚡</div>
                            <h3 className="text-xl font-black text-white mb-3">카드를 걸고 싸운다</h3>
                            <p className="text-white/50 text-sm leading-relaxed mb-6">
                                이것은 단순한 카드 게임이 아닙니다. 패배하면 내 카드를 잃고, 승리하면 상대의 카드를 빼앗습니다.
                                도박장 같은 극한의 심리전.
                            </p>
                            <div className="space-y-2">
                                {BATTLE_MODES.map(m => (
                                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                        <span>{m.icon}</span>
                                        <div className="flex-1">
                                            <p className="text-white text-xs font-bold">{m.title}</p>
                                            <p className="text-white/40 text-[10px]">{m.desc}</p>
                                        </div>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                                            style={{ color: m.risk === 'HIGH' ? '#ef4444' : '#f97316', borderColor: m.risk === 'HIGH' ? '#ef4444' : '#f97316' }}>
                                            {m.risk}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 3: Story & Growth */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="relative bg-gradient-to-b from-purple-900/20 to-transparent border border-purple-500/20 rounded-3xl p-8 overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <div className="text-4xl mb-4">📖</div>
                            <h3 className="text-xl font-black text-white mb-3">살아있는 스토리 세계관</h3>
                            <p className="text-white/50 text-sm leading-relaxed mb-6">
                                시즌 1: 5개 챕터, 30+ 스테이지로 이루어진 AI 전쟁 스토리.
                                카드를 강화·합성하며 최강의 덱을 구축하는 성장의 재미.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: '⚔️', label: '스토리 전투' },
                                    { icon: '🔮', label: '카드 합성' },
                                    { icon: '✨', label: '카드 강화' },
                                    { icon: '🏆', label: 'PVP 랭킹' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="text-white/60 text-xs font-bold">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── CARD SHOWCASE SCROLL ─────────────────── */}
            <section className="py-16 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
                    <p className="text-white/40 text-sm font-mono tracking-widest mb-2">COMMANDER CARDS</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-white orbitron">AI 제국의 지휘관들</h2>
                </div>
                {/* Auto-scroll strip */}
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />
                    <motion.div
                        animate={{ x: [0, -1800] }}
                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                        className="flex gap-4 w-max"
                    >
                        {[...COMMANDER_CARDS, ...COMMANDER_CARDS].map((card, i) => (
                            <div key={`${card.id}-${i}`}
                                className="w-32 sm:w-40 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group relative"
                                style={{ boxShadow: `0 0 20px ${card.color}20` }}
                            >
                                <img src={card.img} alt={card.name} className="w-full h-auto group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                    <p className="text-white text-[10px] font-bold truncate">{card.name}</p>
                                    <p className="text-[8px] font-mono" style={{ color: card.color }}>{card.faction}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── DEVELOPER STORY ─────────────────── */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-3xl p-8 sm:p-12"
                    >
                        <div className="absolute top-6 right-6 sm:top-10 sm:right-10">
                            <div className="text-5xl sm:text-6xl opacity-10 orbitron font-black">AI</div>
                        </div>
                        <p className="text-white/40 text-xs font-mono tracking-widest mb-3 orbitron">CREATOR STORY</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 leading-tight">
                            AI와 함께, AI에 대한<br />
                            <span className="text-red-400">전쟁 게임을 만들었습니다</span>
                        </h2>
                        <div className="space-y-4 text-white/60 text-sm sm:text-base leading-relaxed">
                            <p>
                                AI WAR는 <strong className="text-white">Claude Code</strong>와 함께 개발된 게임입니다.
                                아이러니하게도, AI와의 전쟁을 다루는 이 게임의 코드는 AI가 함께 작성했습니다.
                            </p>
                            <p>
                                카드 속 캐릭터들 — Sam Altman, Elon Musk, Dario Amodei — 은 실제로 AI 산업을 이끄는 인물들입니다.
                                우리는 그들을 카드로 만들어 플레이어가 직접 그 힘을 다루고, 전략적으로 싸우게 했습니다.
                            </p>
                            <p>
                                이 프로젝트의 목표는 단순합니다: <strong className="text-white">"AI가 지배하는 세상에서, 마지막 인류 지휘관이 되어라."</strong>
                            </p>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-3">
                            {['Next.js', 'Firebase', 'Claude Code', 'Framer Motion', 'TypeScript'].map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-mono">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── REWARD TIERS ─────────────────────── */}
            <section className="py-24 px-4 bg-black/30">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <p className="text-red-400 text-sm font-mono tracking-widest mb-3 orbitron">FUNDING REWARDS</p>
                        <h2 className="text-4xl sm:text-5xl font-black text-white orbitron">와디즈 서포터 혜택</h2>
                        <p className="text-white/40 mt-3 text-sm">오직 와디즈 서포터에게만 제공되는 독점 보상</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {REWARDS.map((tier, i) => (
                            <motion.div
                                key={tier.nameEn}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className={`relative rounded-3xl overflow-hidden flex flex-col ${tier.highlight
                                    ? 'border-2 shadow-[0_0_40px_rgba(239,68,68,0.2)]'
                                    : 'border border-white/10'
                                    }`}
                                style={{ borderColor: tier.highlight ? tier.color : undefined }}
                            >
                                {tier.highlight && (
                                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black orbitron tracking-widest"
                                        style={{ background: tier.color, color: '#000' }}>
                                        BEST CHOICE
                                    </div>
                                )}
                                <div className="p-8 bg-zinc-950 flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 orbitron" style={{ color: tier.color }}>
                                        {tier.nameEn}
                                    </p>
                                    <h3 className="text-white font-black text-xl mb-1">{tier.name}</h3>
                                    <p className="text-white/40 text-xs mb-6">{tier.limit}</p>
                                    <div className="text-4xl font-black orbitron text-white mb-8">
                                        ₩ {tier.price}
                                    </div>
                                    <ul className="space-y-3">
                                        {tier.items.map(item => (
                                            <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                                                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: tier.color }} />
                                                <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="py-4 text-center text-sm font-bold"
                                    style={{ background: tier.highlight ? tier.color : 'rgba(255,255,255,0.05)', color: tier.highlight ? '#000' : 'rgba(255,255,255,0.4)' }}>
                                    {tier.highlight ? '가장 인기 있는 리워드' : tier.nameEn}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ─────────────────────────── */}
            <section className="py-40 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-red-600/10 rounded-full blur-[150px]" />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative z-10 max-w-3xl mx-auto"
                >
                    <div className="text-6xl mb-8">🎖️</div>
                    <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 orbitron leading-tight">
                        인류 최후의<br />지휘관이 되어라
                    </h2>
                    <p className="text-white/50 mb-12 text-base sm:text-lg leading-relaxed">
                        와디즈 펀딩에 참여하고 누구보다 먼저 전장에 입장하세요.
                        <br className="hidden sm:block" />
                        서포터 한정 특별 보상이 당신을 기다립니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login">
                            <button className="px-10 sm:px-16 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.4)] hover:shadow-[0_0_80px_rgba(220,38,38,0.7)] transition-all hover:scale-105 orbitron tracking-wider">
                                지금 무료 플레이
                            </button>
                        </Link>
                    </div>
                    <p className="text-white/20 text-xs mt-6 font-mono">* 와디즈 알림신청 시 출시 즉시 보상 지급</p>
                </motion.div>
            </section>

            {/* ── FOOTER ─────────────────────────── */}
            <footer className="border-t border-white/5 py-8 px-4 text-center">
                <p className="text-white/20 text-xs font-mono">
                    © 2026 AI WAR. Built with Claude Code & Next.js.
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline"> · </span>
                    All rights reserved.
                </p>
                <div className="mt-4 flex items-center justify-center gap-4">
                    <Link href="/login" className="text-white/30 hover:text-white text-xs font-mono transition-colors">PLAY NOW</Link>
                    <span className="text-white/10">|</span>
                    <Link href="/ranking" className="text-white/30 hover:text-white text-xs font-mono transition-colors">RANKING</Link>
                    <span className="text-white/10">|</span>
                    <Link href="/main" className="text-white/30 hover:text-white text-xs font-mono transition-colors">DASHBOARD</Link>
                </div>
            </footer>
        </div>
    );
}
