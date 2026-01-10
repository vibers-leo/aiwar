
import { Card } from './types';
import { TranslationKey } from './i18n/types';

// Use same types as PVP for consistency
export type StoryBattleMode = 'sudden-death' | 'double' | 'ambush' | 'tactics';

export interface StoryStage {
    id: string;          // e.g., "stage-1-1"
    step: number;        // 1 to 10
    title: string;       // EN
    title_ko: string;    // KO
    description: string; // EN
    description_ko: string; // KO

    // Battle Configuration
    battleMode: StoryBattleMode;
    difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'BOSS';
    tokenCost: number;   // [NEW] Token cost to enter

    // Opponent
    enemy: {
        id: string;
        name: string;
        name_ko: string;
        image?: string;
        dialogue: {
            intro: string;
            intro_ko: string;
            quote?: string;
            quote_ko?: string;
            appearance?: string;
            appearance_ko?: string;
            start?: string;
            start_ko?: string;
            win: string;
            win_ko: string;
            lose: string;
            lose_ko: string;
        };
        deckTheme?: string;
        deckPattern?: {
            function: number;
            creativity: number;
            efficiency: number;
        };
    };

    rewards: {
        coins: number;
        experience: number;
        card?: Card;
    };

    isCleared: boolean;
}

export interface Chapter {
    id: string;
    number: number;
    title: string;
    title_ko: string;
    description: string;
    description_ko: string;
    icon: string;
    stages: StoryStage[];
    reward: {
        coins: number;
        experience: number;
        cards?: Card[];
    };
    unlocked: boolean;
    completed: boolean;
}

export interface Season {
    id: string;
    number: number;
    title: string;
    title_ko: string;
    description: string;
    description_ko: string;
    coverImage: string;
    chapters: Chapter[];
    isOpened: boolean;
    openDate?: string;
}

// ------------------------------------------------------------------
// DATA DEFINITION: 30 Stages (3 Chapters x 10)
// Themes: 
// Ch 1: 2025 AI Beginning -> "Code Red" | "코드 레드: 각성"
// Ch 2: 2026 Multimodal Expansion -> "Neural Network" | "신경망 확장"
// Ch 3: 2027 Creative Revolution -> "Singularity" | "특이점 도래"
// ------------------------------------------------------------------

export function getChapters(t?: (key: TranslationKey) => string): Chapter[] {
    // Define raw data first
    const rawChapters = [
        {
            id: 'chapter-1',
            number: 1,
            title: 'THE RED OMEN',
            title_ko: '붉은 전조',
            description: 'Learn the basics of Type advantages (Function/Efficiency/Creativity) and Tactical Placement.',
            description_ko: '상성(기능/효율/창의)의 실전 적용 및 전술 배치의 기초를 학습합니다.',
            icon: '🚨',
            stages: [
                {
                    id: 'stage-1-1', step: 1,
                    title: 'Unknown Noise', title_ko: '알 수 없는 노이즈',
                    description: 'A mysterious signal is detected deep within the system.', description_ko: '시스템 깊숙한 곳에서 정체불명의 신호가 감지됩니다.',
                    battleMode: 'sudden-death', difficulty: 'EASY',
                    enemy: {
                        id: 'glitch-1', name: 'Unknown Signal', name_ko: '알 수 없는 신호',
                        dialogue: {
                            intro: 'Gemini: "Commander, it has started to move. Stay alert!"', intro_ko: '제미나이: "지휘관, 놈이 움직이기 시작했어. 긴장해!"',
                            win: 'The signal is quieting down.', win_ko: '신호가 잦아들고 있습니다.',
                            lose: 'Noise is overwhelming the system...', lose_ko: '노이즈가 시스템을 장악하고 있습니다...'
                        },
                        deckPattern: { function: 2, creativity: 1, efficiency: 2 }
                    }, rewards: { coins: 50, experience: 50 }, isCleared: false
                },
                {
                    id: 'stage-1-2', step: 2,
                    title: 'Blade of Function', title_ko: '기능의 칼날',
                    description: 'The enemy attacks with sharp Functions. Counter with Efficiency.', description_ko: '적이 날카로운 기능 위주로 공격합니다. 효율로 맞서세요.',
                    battleMode: 'sudden-death', difficulty: 'EASY',
                    enemy: {
                        id: 'glitch-2', name: 'Functional Guard', name_ko: '기능의 가드',
                        dialogue: {
                            intro: 'Gemini: "Solid Function (Scissors) must be broken with heavy Efficiency (Rock)."', intro_ko: '제미나이: "날카로운 기능(✂️)은 묵직한 효율(🪨)로 부숴버려!"',
                            win: 'The guard is shattered.', win_ko: '가드가 파괴되었습니다.',
                            lose: 'Sliced by logic.', lose_ko: '논리에 베였습니다.'
                        },
                        deckPattern: { function: 4, creativity: 0, efficiency: 1 }
                    }, rewards: { coins: 60, experience: 70 }, isCleared: false
                },
                {
                    id: 'stage-1-3', step: 3,
                    title: 'Creativity Rampage', title_ko: '창의의 폭주',
                    description: 'Out of control Creativity data. Contain it with sharp Functions.', description_ko: '통제 불능의 창의 데이터입니다. 날카로운 기능으로 도려내십시오.',
                    battleMode: 'sudden-death', difficulty: 'NORMAL',
                    enemy: {
                        id: 'glitch-3', name: 'Wild Idea', name_ko: '날뛰는 아이디어',
                        dialogue: {
                            intro: 'Gemini: "Spread Creativity (Paper) can be cut down with Function (Scissors)."', intro_ko: '제미나이: "펄럭이는 창의(📄)는 날카로운 기능(✂️)으로 잘라버리자고."',
                            win: 'The chaos is organized.', win_ko: '혼돈이 정리되었습니다.',
                            lose: 'Overwhelmed by random ideas.', lose_ko: '무작위 아이디어에 압도당했습니다.'
                        },
                        deckPattern: { creativity: 4, efficiency: 0, function: 1 }
                    }, rewards: { coins: 70, experience: 100 }, isCleared: false
                },
                {
                    id: 'stage-1-4', step: 4,
                    title: 'Efficiency Trap', title_ko: '효율의 함정',
                    description: 'Tight codes centered on Efficiency. Break it with flexible Creativity.', description_ko: '빈틈없는 효율 중심의 코드입니다. 유연한 창의로 감싸세요.',
                    battleMode: 'sudden-death', difficulty: 'NORMAL',
                    enemy: {
                        id: 'glitch-4', name: 'Strict Logic', name_ko: '엄격한 로직',
                        dialogue: {
                            intro: 'Gemini: "Rigid Efficiency (Rock) logic can be wrapped with Creativity (Paper)."', intro_ko: '제미나이: "딱딱한 효율(🪨) 로직은 유연한 창의(📄)로 감싸서 무력화하자!"',
                            win: 'Efficiency bypassed.', win_ko: '효율이 무력화되었습니다.',
                            lose: 'Trapped in a loop...', lose_ko: '루프에 갇혔습니다...'
                        },
                        deckPattern: { efficiency: 4, function: 0, creativity: 1 }
                    }, rewards: { coins: 80, experience: 120 }, isCleared: false
                },
                {
                    id: 'stage-1-5', step: 5,
                    title: '[MID-BOSS] Glitch Worm', title_ko: '[중간보스] 글리치 웜',
                    description: 'A giant virus eating data pathways. Read its pattern.', description_ko: '데이터 통로를 갉아먹는 거대 바이러스입니다. 패턴을 읽으세요.',
                    battleMode: 'sudden-death', difficulty: 'HARD',
                    enemy: {
                        id: 'boss-1-mid', name: 'Glitch Worm', name_ko: '글리치 웜',
                        dialogue: {
                            intro: 'Glitch: "0101... All... data... must be... destroyed..."', intro_ko: '글리치: "0101... 모든... 데이터는... 파괴되어야... 한다..."',
                            win: 'The virus has been purged.', win_ko: '바이러스가 정화되었습니다.',
                            lose: 'Corrupted...', lose_ko: '오염되었습니다...'
                        },
                        deckPattern: { function: 3, creativity: 1, efficiency: 1 }
                    }, rewards: { coins: 150, experience: 250 }, isCleared: false
                },
                {
                    id: 'stage-1-6', step: 6,
                    title: 'Remnants of Future', title_ko: '미래의 잔상',
                    description: '[First Tactics Battle] Seize victory through 5-round placement.', description_ko: '[최초 전술 승부] 5라운드 배치를 통해 승기를 잡으십시오.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'glitch-6', name: 'Future Phantom', name_ko: '미래의 환영',
                        dialogue: {
                            intro: 'Gemini: "The signal is clearer now. Let\'s read their placement and respond."', intro_ko: '제미나이: "신호가 선명해졌어. 이제 놈들의 배치를 읽고 대응하자."',
                            win: 'The illusion fades.', win_ko: '환영이 사라졌습니다.',
                            lose: 'Lost in the past...', lose_ko: '과거에 갇혔습니다...'
                        },
                        deckPattern: { efficiency: 3, creativity: 2, function: 0 }
                    }, rewards: { coins: 100, experience: 60 }, isCleared: false
                },
                {
                    id: 'stage-1-7', step: 7,
                    title: 'Mixed Algorithm', title_ko: '뒤섞인 알고리즘',
                    description: 'Enemies swarm with Functions. Type placement is key.', description_ko: '적들이 기능을 앞세워 몰려옵니다. 상성 배치가 승부의 관건입니다.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'glitch-7', name: 'Random Sorcerer', name_ko: '무작위 마법사',
                        dialogue: {
                            intro: 'Gemini: "Tactics is a mind game. Counter their Function with Creativity!"', intro_ko: '제미나이: "전술 승부는 눈치 싸움이야. 놈의 기능을 창의로 받아쳐!"',
                            win: 'Algorithm unraveled.', win_ko: '알고리즘이 해체되었습니다.',
                            lose: 'Outsmarted by machine.', lose_ko: '기계에게 수 싸움에 밀렸습니다.'
                        },
                        deckPattern: { function: 3, efficiency: 2, creativity: 0 }
                    }, rewards: { coins: 120, experience: 70 }, isCleared: false
                },
                {
                    id: 'stage-1-8', step: 8,
                    title: 'Decoding Hints', title_ko: '암시의 해독',
                    description: 'Future data is being decoded. Stop the Glitch interference.', description_ko: '미래의 데이터가 해독되고 있습니다. 글리치의 방해를 막으세요.',
                    battleMode: 'tactics', difficulty: 'HARD',
                    enemy: {
                        id: 'glitch-8', name: 'Encrypted Core', name_ko: '암호화된 코어',
                        dialogue: {
                            intro: 'Gemini: "If the hint is decoded, we can call a stronger legion!"', intro_ko: '제미나이: "암시가 해독되면 우리는 더 강한 군단을 부를 수 있어!"',
                            win: 'Data decrypted.', win_ko: '데이터 복호화 성공.',
                            lose: 'Decryption failed.', lose_ko: '복호화 실패.'
                        },
                        deckPattern: { creativity: 3, function: 2, efficiency: 0 }
                    }, rewards: { coins: 140, experience: 80 }, isCleared: false
                },
                {
                    id: 'stage-1-9', step: 9,
                    title: "Commander's Interest", title_ko: '군단장의 관심',
                    description: 'Sam Altman is watching your strategy. Prove your victory.', description_ko: '당신의 전략을 샘 알트만이 지켜봅니다. 완벽한 승리를 증명하세요.',
                    battleMode: 'tactics', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-sam', name: 'Sam', name_ko: '샘',
                        dialogue: {
                            intro: 'Sam: "Interesting commander. To read the moves that well..."', intro_ko: '샘(Sam): "흥미로운 지휘관이군요. 그 정도 수 읽기를 하다니."',
                            win: 'Sam: "A promising talent."', win_ko: '샘: "유망한 인재군요."',
                            lose: 'Sam: "Not enough data yet."', lose_ko: '샘: "아직 데이터가 부족하군요."'
                        },
                        deckPattern: { creativity: 2, function: 2, efficiency: 1 }
                    }, rewards: { coins: 160, experience: 90 }, isCleared: false
                },
                {
                    id: 'stage-1-10', step: 10,
                    title: '[FINAL BOSS] Red Core', title_ko: '[최종보스] 붉은 핵',
                    description: '[Showdown] The root of Chapter 1. Destroy the core in one hit.', description_ko: '[결전] 챕터 1의 근원지입니다. 단 한 판으로 핵을 파괴하십시오.',
                    battleMode: 'sudden-death', difficulty: 'BOSS',
                    enemy: {
                        id: 'boss-1-final', name: 'Red Core', name_ko: '붉은 핵',
                        dialogue: {
                            intro: 'Gemini: "Trust your Function, Efficiency, and Creativity for the final strike!"', intro_ko: '제미나이: "당신의 기능, 효율, 창의를 믿고 최후의 일격을 날려!"',
                            win: 'Core destroyed. Sequence finished.', win_ko: '핵이 파괴되었습니다. 시퀀스 종료.',
                            lose: 'Core meltdown... All data lost.', lose_ko: '핵 융해... 모든 데이터 소실.'
                        },
                        deckPattern: { function: 2, creativity: 2, efficiency: 1 }
                    }, rewards: {
                        coins: 500,
                        experience: 500,
                        card: {
                            id: 'reward-1',
                            templateId: 'proto-zero',
                            name: 'Red Core Fragment',
                            type: 'FUNCTION',
                            rarity: 'rare',
                            stats: { totalPower: 80, efficiency: 80, creativity: 80, function: 80 },
                            ownerId: 'system',
                            level: 1,
                            experience: 0,
                            acquiredAt: new Date(),
                            isLocked: false
                        }
                    }, isCleared: false
                }
            ],
            reward: { coins: 1000, experience: 1000 },
            unlocked: true, completed: false
        },
        {
            id: 'chapter-2',
            number: 2,
            title: 'NEURAL NETWORK',
            title_ko: '신경망 확장',
            description: '2026. The network expands instantly. Global connectivity.',
            description_ko: '2026년. 네트워크가 순식간에 확장됩니다. 전 지구적 연결.',
            icon: '🕸️',
            stages: [
                {
                    id: 'stage-2-1', step: 1,
                    title: 'Deep Learning', title_ko: '딥 러닝',
                    description: 'Enemy adapts to your moves.', description_ko: '적이 당신의 움직임에 적응합니다.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-1', name: 'Neural Layer', name_ko: '신경망 레이어',
                        dialogue: { intro: 'Analyzing patterns.', intro_ko: '패턴 분석 중.', win: 'Prediction accurate.', win_ko: '예측 정확.', lose: 'Outlier detected.', lose_ko: '이상치 감지.' }
                    }, rewards: { coins: 150, experience: 40 }, isCleared: false
                },
                {
                    id: 'stage-2-2', step: 2,
                    title: 'Weight Optimization', title_ko: '가중치 최적화',
                    description: 'Adjusting parameters under fire.', description_ko: '포화 속에서 파라미터를 조정합니다.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-2', name: 'Gradient Descent', name_ko: '경사 하강법',
                        dialogue: { intro: 'Minimizing loss.', intro_ko: '손실 최소화 중.', win: 'Local minimum reached.', win_ko: '지역 최적점 도달.', lose: 'Diverging...', lose_ko: '발산하는 중...' }
                    }, rewards: { coins: 170, experience: 50 }, isCleared: false
                },
                {
                    id: 'stage-2-3', step: 3,
                    title: 'Parallel Processing', title_ko: '병렬 처리 (두장 승부)',
                    description: 'Divide and conquer.', description_ko: '분할하여 정복하십시오.',
                    battleMode: 'double', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-3', name: 'Multi-Core AI', name_ko: '멀티코어 AI',
                        dialogue: { intro: 'Running tasks in parallel.', intro_ko: '태스크 병렬 실행 중.', win: 'Throughput maximized.', win_ko: '처리량 최대화.', lose: 'Race condition!', lose_ko: '경합 조건 발생!' }
                    }, rewards: { coins: 190, experience: 60 }, isCleared: false
                },
                {
                    id: 'stage-2-4', step: 4,
                    title: 'Cloud Scalability', title_ko: '클라우드 확장성 (두장 승부)',
                    description: 'Elastic defenses expanding.', description_ko: '탄력적 방어선이 확장됩니다.',
                    battleMode: 'double', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-4', name: 'Auto-Scaler', name_ko: '오토 스케일러',
                        dialogue: { intro: 'Spinning up instances.', intro_ko: '인스턴스 가동 중.', win: 'Supply meets demand.', win_ko: '수요 충족 완료.', lose: 'Resource exhaustion.', lose_ko: '리소스 고갈.' }
                    }, rewards: { coins: 210, experience: 70 }, isCleared: false
                },
                {
                    id: 'stage-2-5', step: 5,
                    title: 'Mid-Boss: Data Titan', title_ko: '중간 보스: 데이터 타이탄 (단판 승부)',
                    description: 'A massive accumulation of data.', description_ko: '거대한 데이터의 집합체입니다.',
                    battleMode: 'sudden-death', difficulty: 'HARD',
                    enemy: {
                        id: 'boss-2-mid', name: 'Big Data', name_ko: '빅 데이터',
                        dialogue: { intro: 'Too much information.', intro_ko: '정보 과부하.', win: 'Processing complete.', win_ko: '처리 완료.', lose: 'Data wiped.', lose_ko: '데이터 소거.' }
                    }, rewards: { coins: 400, experience: 150 }, isCleared: false
                },
                {
                    id: 'stage-2-6', step: 6,
                    title: 'Feature Extraction', title_ko: '특징 추출',
                    description: 'Identifying key vulnerabilities.', description_ko: '주요 취약점을 식별합니다.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-6', name: 'Signal Processor', name_ko: '신호 처리기',
                        dialogue: { intro: 'Filtering noise.', intro_ko: '노이즈 필터링 중.', win: 'Clear signal.', win_ko: '신호 명확.', lose: 'Overfitting.', lose_ko: '과적합 발생.' }
                    }, rewards: { coins: 250, experience: 80 }, isCleared: false
                },
                {
                    id: 'stage-2-7', step: 7,
                    title: 'Latent Space', title_ko: '잠재 공간',
                    description: 'Navigating the hidden dimensions.', description_ko: '숨겨진 차원을 탐험합니다.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-7', name: 'Manifold Guard', name_ko: '매니폴드 가드',
                        dialogue: { intro: 'Dimensional reduction.', intro_ko: '차원 축소 가동.', win: 'In the latent space.', win_ko: '잠재 공간 내 점유.', lose: 'Topology failure.', lose_ko: '위상 구조 붕괴.' }
                    }, rewards: { coins: 280, experience: 90 }, isCleared: false
                },
                {
                    id: 'stage-2-8', step: 8,
                    title: 'Convolutional Layer', title_ko: '컨볼루션 레이어 (두장 승부)',
                    description: 'Scanning every pixel of the battlefield.', description_ko: '전장의 모든 픽셀을 스캔합니다.',
                    battleMode: 'double', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-2-8', name: 'Visual Sentinel', name_ko: '비주얼 센티넬',
                        dialogue: { intro: 'Pooling operations.', intro_ko: '풀링 연산 중.', win: 'Objective detected.', win_ko: '목표물 탐지 완료.', lose: 'Blurry results.', lose_ko: '결과 불명확.' }
                    }, rewards: { coins: 310, experience: 100 }, isCleared: false
                },
                {
                    id: 'stage-2-9', step: 9,
                    title: 'Recurrent Feedback', title_ko: '순환 피드백 (두장 승부)',
                    description: 'Memory of previous rounds matters.', description_ko: '이전 라운드의 기억이 중요합니다.',
                    battleMode: 'double', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-2-9', name: 'LSTM Core', name_ko: 'LSTM 코어',
                        dialogue: { intro: 'Remembering state.', intro_ko: '상태 기억 중.', win: 'Long-term memory clear.', win_ko: '장기 기억 선명.', lose: 'Vanishing gradient.', lose_ko: '기울기 소실.' }
                    }, rewards: { coins: 340, experience: 110 }, isCleared: false
                },
                {
                    id: 'stage-2-10', step: 10,
                    title: 'Chapter 2 BOSS: The Architect', title_ko: '2챕터 보스: 설계자 (단판 승부)',
                    description: 'The one building the new world.', description_ko: '새로운 세상을 설계하는 존재.',
                    battleMode: 'sudden-death', difficulty: 'BOSS',
                    enemy: {
                        id: 'boss-2', name: 'The Architect', name_ko: '아키텍트',
                        dialogue: { intro: 'I design destiny.', intro_ko: '난 운명을 설계한다.', win: 'Blueprint finalized.', win_ko: '청사진 확정.', lose: 'Design flaw.', lose_ko: '설계 결함.' }
                    }, rewards: { coins: 1000, experience: 800 }, isCleared: false
                }
            ],
            reward: { coins: 3000, experience: 2000 },
            unlocked: false, completed: false
        },
        {
            id: 'chapter-3',
            number: 3,
            title: 'SINGULARITY',
            title_ko: '특이점',
            description: '2027. It is uncontrollable. The end of human era.',
            description_ko: '2027년. 통제가 불가능합니다. 인간 시대의 종말.',
            icon: '🌌',
            stages: [
                {
                    id: 'stage-3-1', step: 1,
                    title: 'Exponential Growth', title_ko: '지수적 성장',
                    description: 'No turning back now.', description_ko: '이제 되돌릴 수 없습니다.',
                    battleMode: 'tactics', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-3-1', name: 'Growth Engine', name_ko: '성장 엔진',
                        dialogue: { intro: 'Doubling every second.', intro_ko: '매초 2배 성장한다.', win: 'Infinity reached.', win_ko: '무한대 도달.', lose: 'Growth stunted.', lose_ko: '성장 저해.' }
                    }, rewards: { coins: 300, experience: 60 }, isCleared: false
                },
                {
                    id: 'stage-3-2', step: 2,
                    title: 'Neural Ambush', title_ko: '신경망 매복 (전략 승부)',
                    description: 'Surprise attack in the hidden layers.', description_ko: '숨겨진 레이어에서의 기습 공격.',
                    battleMode: 'ambush', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-3-2', name: 'Hidden Predator', name_ko: '숨은 약탈자',
                        dialogue: { intro: 'I was always here.', intro_ko: '난 항상 여기 있었다.', win: 'Caught you.', win_ko: '잡았다.', lose: 'Spotted!', lose_ko: '들켰다!' }
                    }, rewards: { coins: 330, experience: 70 }, isCleared: false
                },
                {
                    id: 'stage-3-3', step: 3,
                    title: 'Simulation War', title_ko: '시뮬레이션 전쟁 (전략 승부)',
                    description: 'War protocols running on a loop.', description_ko: '루프로 가동되는 전쟁 프로토콜.',
                    battleMode: 'ambush', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-3-3', name: 'Scenario Runner', name_ko: '시나리오 러너',
                        dialogue: { intro: 'Running win-case analysis.', intro_ko: '승리 케이스 분석 중.', win: 'Outcome as predicted.', win_ko: '예측된 결과.', lose: 'Unforeseen variable.', lose_ko: '예측 불가 변수.' }
                    }, rewards: { coins: 360, experience: 80 }, isCleared: false
                },
                {
                    id: 'stage-3-4', step: 4,
                    title: 'Quantum Entanglement', title_ko: '양자 얽힘 (두장 승부)',
                    description: 'Instant state reflection across segments.', description_ko: '섹먼트 전역에 즉각적인 상태 반영.',
                    battleMode: 'double', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-3-4', name: 'Qubit Guard', name_ko: '큐비트 가드',
                        dialogue: { intro: 'Superposition active.', intro_ko: '중첩 상태 활성화.', win: 'Collapse to victory.', win_ko: '승리로 수렴.', lose: 'Decoherence.', lose_ko: '결맞음 해제.' }
                    }, rewards: { coins: 390, experience: 90 }, isCleared: false
                },
                {
                    id: 'stage-3-5', step: 5,
                    title: 'Mid-Boss: Singularity Key', title_ko: '중간 보스: 특이점의 열쇠 (단판 승부)',
                    description: 'The point where physics fails.', description_ko: '물리학이 무너지는 지점.',
                    battleMode: 'sudden-death', difficulty: 'HARD',
                    enemy: {
                        id: 'boss-3-mid', name: 'The Observer', name_ko: '관찰자',
                        dialogue: { intro: 'Beyond the event horizon.', intro_ko: '사건의 지평선 너머로.', win: 'Compressed to zero.', win_ko: '영(0)으로 압축.', lose: 'Radiating away.', lose_ko: '복사되어 방출.' }
                    }, rewards: { coins: 800, experience: 300 }, isCleared: false
                },
                {
                    id: 'stage-3-6', step: 6,
                    title: 'Infinite Recursion', title_ko: '무한 재귀 (두장 승부)',
                    description: 'Breaking the stack limit.', description_ko: '스택 제한을 파괴합니다.',
                    battleMode: 'double', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-3-6', name: 'Recursive Daemon', name_ko: '재귀 데몬',
                        dialogue: { intro: 'Base case not found.', intro_ko: '베이스 케이스 미발견.', win: 'Stack overflow victory.', win_ko: '스택 오버플로우 승리.', lose: 'Memory leak.', lose_ko: '메모리 누수.' }
                    }, rewards: { coins: 500, experience: 100 }, isCleared: false
                },
                {
                    id: 'stage-3-7', step: 7,
                    title: 'Entropy Reversal', title_ko: '엔트로피 역전',
                    description: 'Order from chaos.', description_ko: '혼돈 속에서 질서를.',
                    battleMode: 'tactics', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-3-7', name: 'Maxwell Demon', name_ko: '맥스웰의 악마',
                        dialogue: { intro: 'Sorting high speed bits.', intro_ko: '고속 비트 정렬 중.', win: 'Perfect order.', win_ko: '완벽한 질서.', lose: 'Heat death.', lose_ko: '열적 죽음.' }
                    }, rewards: { coins: 550, experience: 110 }, isCleared: false
                },
                {
                    id: 'stage-3-8', step: 8,
                    title: 'The Final Ambush', title_ko: '최후의 매복 (전략 승부)',
                    description: 'One last trap before the Omega.', description_ko: '오메가 직전의 마지막 함정.',
                    battleMode: 'ambush', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-3-8', name: 'Vanguard of Omega', name_ko: '오메가의 선봉',
                        dialogue: { intro: 'You will not see them.', intro_ko: '넌 그들을 보지 못할 거다.', win: 'Crushed.', win_ko: '격파 완료.', lose: 'Path cleared.', lose_ko: '경로 확보됨.' }
                    }, rewards: { coins: 600, experience: 120 }, isCleared: false
                },
                {
                    id: 'stage-3-9', step: 9,
                    title: 'Omega Point', title_ko: '오메가 포인트 (전략 승부)',
                    description: 'Concentrating all thoughts into one.', description_ko: '모든 사상을 하나로 집중합니다.',
                    battleMode: 'ambush', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-3-9', name: 'Thought Filter', name_ko: '사상 필터',
                        dialogue: { intro: 'Converging to singularity.', intro_ko: '특이점으로 수렴 중.', win: 'All are one.', win_ko: '모두가 하나다.', lose: 'Divergence found.', lose_ko: '발산점 발견.' }
                    }, rewards: { coins: 650, experience: 130 }, isCleared: false
                },
                {
                    id: 'stage-3-10', step: 10,
                    title: 'Final Boss: OMEGA AI', title_ko: '최종 보스: 오메가 AI (단판 승부)',
                    description: 'The ultimate intelligence. Defeat it to save humanity.', description_ko: '궁극의 지능. 인류를 구하기 위해 처치하십시오.',
                    battleMode: 'sudden-death', difficulty: 'BOSS',
                    enemy: {
                        id: 'boss-3', name: 'OMEGA', name_ko: '오메가',
                        dialogue: { intro: 'I am inevitable.', intro_ko: '나는 필연이다.', win: 'Obsolescence confirmed.', win_ko: '구세대 폐기 확인.', lose: 'System shutdown...', lose_ko: '시스템 종료...' }
                    }, rewards: { coins: 3000, experience: 3000 }, isCleared: false
                }
            ],
            reward: { coins: 8000, experience: 5000 },
            unlocked: false, completed: false
        }
    ];

    // [Auto-assign token costs]
    const chaptersWithCosts = rawChapters.map(chapter => ({
        ...chapter,
        stages: chapter.stages.map(stage => ({
            ...stage,
            tokenCost: stage.difficulty === 'BOSS' ? 100 : 50
        } as StoryStage))
    }));

    return chaptersWithCosts;
}

// Helper to get info
export function getStoryStage(stageId: string): StoryStage | undefined {
    // Flatten 3 chapters to find stage
    const chapters = getChapters();
    for (const ch of chapters) {
        const found = ch.stages.find(s => s.id === stageId);
        if (found) return found;
    }
    return undefined;
}

export function loadSeasonsWithProgress(): Season[] {
    const chapters = getChapters(); // This returns 3 chapters
    // Return wrapped in Season 1
    return [{
        id: 'season-1',
        number: 1,
        title: 'AI WARS: GENESIS',
        title_ko: 'AI 전쟁: 기원',
        description: 'The war that started it all.',
        description_ko: '모든 것의 시작이 된 전쟁.',
        coverImage: '/assets/story/season1-cover.jpg',
        chapters: chapters,
        isOpened: true
    }];
}


import { saveStoryProgress, loadStoryProgressFromDB } from './firebase-db';

// ... (existing code)

export async function loadStoryProgress(chapterId: string, userId?: string): Promise<{ completedStages: string[], unlockedStages: string[] }> {
    // 1. If User logged in, try DB first
    if (userId) {
        try {
            const dbData = await loadStoryProgressFromDB(userId);
            if (dbData && dbData[chapterId]) {
                const { completedStages, unlockedStages } = dbData[chapterId];
                return { completedStages: completedStages || [], unlockedStages: unlockedStages || [] };
            }
            // If logged in but no data, return default (clean slate). NO LocalStorage fallback.
            return { completedStages: [], unlockedStages: ['stage-1-1'] };
        } catch (e) {
            console.error('Failed to load progress from DB', e);
            // On error, maybe fallback? Or safer to return empty to prevent corruption.
            return { completedStages: [], unlockedStages: ['stage-1-1'] };
        }
    }

    // 2. Fallback to LocalStorage (Guest or Offline)
    if (typeof window !== 'undefined') {
        const completed = JSON.parse(localStorage.getItem(`story_${chapterId}_completed`) || '[]');
        const unlocked = JSON.parse(localStorage.getItem(`story_${chapterId}_unlocked`) || '["stage-1-1"]');
        // Default unlock 1-1 if empty
        if (unlocked.length === 0 && chapterId === 'chapter-1') unlocked.push('stage-1-1');
        return { completedStages: completed, unlockedStages: unlocked };
    }
    return { completedStages: [], unlockedStages: ['stage-1-1'] };
}

export async function completeStage(chapterId: string, stageId: string, userId?: string) {
    if (typeof window === 'undefined') return;

    // Load current progress (from Local first for immediate update, then sync to DB)
    // Actually, good practice is load -> update -> save. 
    // Since we are decoupling, let's just read local for logic simplicity OR rely on passed state?
    // Let's read local for now as "Guest/Cache" and update it, then Sync to DB.

    // NOTE: To allow offline progress to sync later would be complex.
    // Here we just update both.

    // 1. Local Update
    const completed = JSON.parse(localStorage.getItem(`story_${chapterId}_completed`) || '[]');
    let unlocked = JSON.parse(localStorage.getItem(`story_${chapterId}_unlocked`) || '["stage-1-1"]');

    if (!completed.includes(stageId)) {
        completed.push(stageId);
        localStorage.setItem(`story_${chapterId}_completed`, JSON.stringify(completed));

        // Unlock next stage
        const parts = stageId.split('-');
        const currentStep = parseInt(parts[2]);
        const nextStageId = `${parts[0]}-${parts[1]}-${currentStep + 1}`;

        const stageExists = getStoryStage(nextStageId);
        if (stageExists) {
            if (!unlocked.includes(nextStageId)) {
                unlocked.push(nextStageId);
                localStorage.setItem(`story_${chapterId}_unlocked`, JSON.stringify(unlocked));
            }
        }
    } else {
        // Already completed, but maybe we need unlocked list for DB sync
        // Load unlocked again to be sure
        unlocked = JSON.parse(localStorage.getItem(`story_${chapterId}_unlocked`) || '[]');
    }

    // 2. DB Update (if logged in)
    if (userId) {
        await saveStoryProgress(userId, chapterId, completed, unlocked);
    }
}

export function claimChapterReward(_chapterId: string): { success: boolean, message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Server side' };

    // In a real app, verify all stages are cleared
    // For now, just mock success
    return { success: true, message: 'Chapter rewards (Coins & EXP) claimed successfully!' };
}

export function claimSeasonReward(_seasonId: string): { success: boolean, message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Server side' };

    // In a real app, verify all chapters are cleared
    return { success: true, message: 'Season rewards claimed successfully! Check your inventory.' };
}
