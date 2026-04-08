import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, ChevronRight, Zap, Star } from 'lucide-react';

type Step = 'home' | 'pick' | 'matching' | 'battle' | 'result';

interface AIChampion {
  id: string;
  name: string;
  model: string;
  emoji: string;
  color: string;
  bg: string;
  power: number;
  specialty: string;
  moves: string[];
}

const CHAMPIONS: AIChampion[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    model: 'GPT-4o',
    emoji: '🤖',
    color: '#10A37F',
    bg: '#E8F5F0',
    power: 92,
    specialty: '추론 최강자',
    moves: ['Chain-of-Thought 연속 공격', '멀티모달 동시 타격', 'o3 딥 리즈닝 폭발'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    model: 'Claude 4',
    emoji: '🧠',
    color: '#D4A574',
    bg: '#FDF5EC',
    power: 90,
    specialty: '안전 + 지능',
    moves: ['Constitutional AI 반격', '200K 컨텍스트 압도', '코딩 정확도 폭격'],
  },
  {
    id: 'google',
    name: 'Google',
    model: 'Gemini 2.5',
    emoji: '✨',
    color: '#4285F4',
    bg: '#EAF0FF',
    power: 88,
    specialty: '멀티모달 황제',
    moves: ['검색 + AI 융합 공격', '1M 컨텍스트 탱킹', 'DeepMind 연구력 폭발'],
  },
  {
    id: 'meta',
    name: 'Meta',
    model: 'Llama 4',
    emoji: '🦙',
    color: '#0866FF',
    bg: '#EEF3FF',
    power: 84,
    specialty: '오픈소스 파괴자',
    moves: ['오픈소스 기습 공격', '전 세계 개발자 소환', 'MoE 혼합 전문가 폭격'],
  },
];

const BATTLE_KEY = 'agiwar_stats_v1';

interface Stats { wins: number; losses: number; streak: number; }
function loadStats(): Stats {
  try { return JSON.parse(localStorage.getItem(BATTLE_KEY) || '{"wins":0,"losses":0,"streak":0}'); }
  catch { return { wins: 0, losses: 0, streak: 0 }; }
}
function saveStats(s: Stats) { localStorage.setItem(BATTLE_KEY, JSON.stringify(s)); }

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export default function BattlePage() {
  const [step, setStep] = useState<Step>('home');
  const [myChamp, setMyChamp] = useState<AIChampion | null>(null);
  const [enemyChamp, setEnemyChamp] = useState<AIChampion | null>(null);
  const [won, setWon] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [matchSec, setMatchSec] = useState(0);

  // 매칭 타이머
  useEffect(() => {
    if (step !== 'matching') return;
    setMatchSec(0);
    const timer = setInterval(() => {
      setMatchSec(s => {
        if (s >= 2) {
          clearInterval(timer);
          // 랜덤 상대 (내 챔피언 제외)
          const pool = CHAMPIONS.filter(c => c.id !== myChamp?.id);
          const enemy = pool[Math.floor(Math.random() * pool.length)];
          setEnemyChamp(enemy);
          setTimeout(() => setStep('battle'), 400);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(timer);
  }, [step, myChamp]);

  function startBattle(champ: AIChampion) {
    setMyChamp(champ);
    setStep('matching');
  }

  function executeBattle() {
    if (!myChamp || !enemyChamp) return;
    // 전투력 + 랜덤 요소로 승패 결정
    const myRoll = myChamp.power + Math.random() * 20;
    const enemyRoll = enemyChamp.power + Math.random() * 20;
    const win = myRoll > enemyRoll;

    // 배틀 로그 생성
    const log = [
      `${myChamp.name}의 "${myChamp.moves[Math.floor(Math.random() * myChamp.moves.length)]}"!`,
      `${enemyChamp.name}이 반격! "${enemyChamp.moves[Math.floor(Math.random() * enemyChamp.moves.length)]}"`,
      win
        ? `치명타! ${myChamp.name} 압승!`
        : `역전! ${enemyChamp.name}의 막판 뒤집기!`,
    ];
    setBattleLog(log);
    setWon(win);

    const next: Stats = {
      wins: stats.wins + (win ? 1 : 0),
      losses: stats.losses + (win ? 0 : 1),
      streak: win ? stats.streak + 1 : 0,
    };
    setStats(next);
    saveStats(next);
    setTimeout(() => setStep('result'), 2200);
  }

  function reset() {
    setMyChamp(null);
    setEnemyChamp(null);
    setBattleLog([]);
    setStep('home');
  }

  return (
    <AnimatePresence mode="wait">
      {/* 홈 */}
      {step === 'home' && (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col min-h-screen bg-[#0D0D1A] px-5 pt-16 pb-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Swords size={28} color="#7C72FF" />
              <span className="text-[#7C72FF] text-sm font-bold tracking-widest">AGI WAR</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-3">
              최강의 AI는<br />누구인가?
            </h1>
            <p className="text-[#8B8B9B] text-sm leading-relaxed mb-8">
              OpenAI·Anthropic·Google·Meta<br />
              4대 AGI 진영 중 하나를 골라 배틀하세요.
            </p>

            {/* 전적 */}
            {(stats.wins + stats.losses) > 0 && (
              <div className="flex gap-3 mb-8">
                <div className="flex-1 bg-[#1A1A2E] rounded-2xl p-3 text-center">
                  <div className="text-2xl font-black text-white">{stats.wins}</div>
                  <div className="text-xs text-[#8B8B9B] mt-0.5">승</div>
                </div>
                <div className="flex-1 bg-[#1A1A2E] rounded-2xl p-3 text-center">
                  <div className="text-2xl font-black text-white">{stats.losses}</div>
                  <div className="text-xs text-[#8B8B9B] mt-0.5">패</div>
                </div>
                <div className="flex-1 bg-[#1A1A2E] rounded-2xl p-3 text-center">
                  <div className="text-2xl font-black text-[#FFD700]">{stats.streak}</div>
                  <div className="text-xs text-[#8B8B9B] mt-0.5">연승</div>
                </div>
              </div>
            )}

            {/* 챔피언 미리보기 */}
            <div className="grid grid-cols-2 gap-2 mb-8">
              {CHAMPIONS.map(c => (
                <div key={c.id} className="bg-[#1A1A2E] rounded-2xl p-3 flex items-center gap-2">
                  <span className="text-2xl">{c.emoji}</span>
                  <div>
                    <div className="text-white text-xs font-bold">{c.name}</div>
                    <div className="text-[#8B8B9B] text-xs">{c.model}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setStep('pick')}
            className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7C72FF, #4F46E5)' }}
          >
            챔피언 선택하기
            <ChevronRight size={18} />
          </motion.button>
        </motion.div>
      )}

      {/* 챔피언 선택 */}
      {step === 'pick' && (
        <motion.div key="pick" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          className="flex flex-col min-h-screen bg-[#0D0D1A] px-5 pt-14 pb-10">
          <h2 className="text-2xl font-black text-white mb-1">내 AI 선택</h2>
          <p className="text-[#8B8B9B] text-sm mb-6">어떤 AGI를 대표해 싸울 건가요?</p>

          <div className="flex flex-col gap-3 flex-1">
            {CHAMPIONS.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startBattle(c)}
                className="w-full p-4 rounded-2xl text-left"
                style={{ backgroundColor: c.bg, border: `1.5px solid ${c.color}30` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.emoji}</span>
                    <div>
                      <div className="font-black text-gray-900 text-base">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.model} · {c.specialty}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap size={13} style={{ color: c.color }} />
                    <span className="font-black text-sm" style={{ color: c.color }}>{c.power}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={c.power} max={100} color={c.color} />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 매칭 중 */}
      {step === 'matching' && (
        <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center min-h-screen bg-[#0D0D1A] px-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
            style={{ border: '3px solid #7C72FF', borderTopColor: 'transparent' }}
          >
            <span className="text-4xl">{myChamp?.emoji}</span>
          </motion.div>
          <h2 className="text-2xl font-black text-white mb-2">상대 탐색 중...</h2>
          <p className="text-[#8B8B9B] text-sm">{myChamp?.name} 진영 대기 중</p>
          <p className="text-[#7C72FF] text-xs mt-4 font-mono">{matchSec}s</p>
        </motion.div>
      )}

      {/* 배틀 */}
      {step === 'battle' && myChamp && enemyChamp && (
        <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col min-h-screen bg-[#0D0D1A] px-5 pt-12 pb-8">
          {/* VS 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-2"
                style={{ backgroundColor: myChamp.bg }}>
                {myChamp.emoji}
              </div>
              <span className="text-white text-xs font-bold">{myChamp.name}</span>
              <div className="flex items-center gap-1 mt-1">
                <Zap size={10} style={{ color: myChamp.color }} />
                <span className="text-xs font-bold" style={{ color: myChamp.color }}>{myChamp.power}</span>
              </div>
            </div>
            <div className="text-2xl font-black text-[#7C72FF] mx-4">VS</div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-2"
                style={{ backgroundColor: enemyChamp.bg }}>
                {enemyChamp.emoji}
              </div>
              <span className="text-white text-xs font-bold">{enemyChamp.name}</span>
              <div className="flex items-center gap-1 mt-1">
                <Zap size={10} style={{ color: enemyChamp.color }} />
                <span className="text-xs font-bold" style={{ color: enemyChamp.color }}>{enemyChamp.power}</span>
              </div>
            </div>
          </div>

          {/* 배틀 로그 */}
          <div className="flex-1 bg-[#1A1A2E] rounded-2xl p-4 mb-6">
            {battleLog.length === 0 ? (
              <p className="text-[#8B8B9B] text-sm text-center mt-8">배틀 시작 버튼을 눌러 승부를 가리세요</p>
            ) : (
              <div className="space-y-3">
                {battleLog.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-[#7C72FF] text-sm shrink-0">▶</span>
                    <p className="text-white text-sm leading-relaxed">{line}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {battleLog.length === 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={executeBattle}
              className="w-full py-4 rounded-2xl font-black text-base text-white"
              style={{ background: 'linear-gradient(135deg, #7C72FF, #4F46E5)' }}
            >
              <Swords size={18} className="inline mr-2" />
              배틀 시작!
            </motion.button>
          )}
        </motion.div>
      )}

      {/* 결과 */}
      {step === 'result' && myChamp && enemyChamp && (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center min-h-screen bg-[#0D0D1A] px-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: won ? 'linear-gradient(135deg, #7C72FF, #4F46E5)' : '#2A2A3E' }}
          >
            {won ? <Trophy size={44} color="white" /> : <span className="text-4xl">😤</span>}
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white mb-2"
          >
            {won ? `${myChamp.name} 승리!` : `${enemyChamp.name} 역전!`}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[#8B8B9B] text-sm text-center mb-6"
          >
            {won ? `연승 ${stats.streak}회 달성!` : '다음엔 복수하세요'}
          </motion.p>

          {won && stats.streak >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 bg-[#1A1A2E] rounded-2xl px-5 py-3 mb-6"
            >
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <span className="text-white text-sm font-bold">{stats.streak}연승 달성! 전설 플레이어</span>
            </motion.div>
          )}

          {/* 전적 */}
          <div className="flex gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{stats.wins}</div>
              <div className="text-xs text-[#8B8B9B]">승</div>
            </div>
            <div className="text-[#3A3A5E] text-2xl font-bold">·</div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{stats.losses}</div>
              <div className="text-xs text-[#8B8B9B]">패</div>
            </div>
          </div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.97 }}
            onClick={reset}
            className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7C72FF, #4F46E5)' }}
          >
            다시 대결하기
            <ChevronRight size={18} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
