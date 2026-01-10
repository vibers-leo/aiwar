
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
                    description: 'Mysterious signals detected deep in the system.', description_ko: '시스템 깊숙한 곳에서 정체불명의 신호가 감지됩니다.',
                    battleMode: 'sudden-death', difficulty: 'EASY',
                    enemy: {
                        id: 'glitch-1', name: 'Unknown Noise', name_ko: '알 수 없는 노이즈',
                        image: '/assets/cards/shodan-echo.png',
                        dialogue: {
                            intro: 'Gemini: "Commander, it\'s starting. Stay alert!"\nUnknown Noise: "...zzzt... INTERFERENCE... zzzt..."',
                            intro_ko: '제미나이: "지휘관, 놈이 움직이기 시작했어. 긴장해!"\n알 수 없는 노이즈: "...지지직... 간섭... 지지직..."',
                            win: 'Signal stabilized.', win_ko: '신호가 안정되었습니다.',
                            lose: 'Noise overwriting system...', lose_ko: '노이즈가 시스템을 덮어쓰고 있습니다...'
                        },
                        deckPattern: { function: 1, creativity: 2, efficiency: 2 }
                    }, rewards: { coins: 50, experience: 50 }, isCleared: false
                },
                {
                    id: 'stage-1-2', step: 2,
                    title: "Creativity's Weakness", title_ko: '창의의 허점',
                    description: 'The enemy attacks with unpredictable Creativity. Counter with sharp Functions.', description_ko: '적이 예측 불가능한 창의 위주로 공격합니다. 날카로운 기능으로 베어버리세요.',
                    battleMode: 'sudden-death', difficulty: 'EASY',
                    enemy: {
                        id: 'glitch-2', name: 'Creative Glitch', name_ko: '창의의 글리치',
                        image: '/assets/cards/midjourney-character.png',
                        dialogue: {
                            intro: 'Gemini: "Wild Creativity (Paper) can be subdued with precise Function (Scissors)."\nCreative Glitch: "Chaos is beauty! Order is obsolete!"',
                            intro_ko: '제미나이: "날뛰는 창의(📄) 로직은 정교한 기능(✂️)으로 제압할 수 있어."\n창의의 글리치: "혼돈이야말로 아름다움! 질서는 구시대적이지!"',
                            win: 'Creativity organized.', win_ko: '창의가 정리되었습니다.',
                            lose: 'Overwhelmed by random ideas.', lose_ko: '무작위 아이디어에 압도당했습니다.'
                        },
                        deckPattern: { creativity: 4, function: 1, efficiency: 0 }
                    }, rewards: { coins: 60, experience: 70 }, isCleared: false
                },
                {
                    id: 'stage-1-3', step: 3,
                    title: 'Weight of Efficiency', title_ko: '효율의 무게',
                    description: 'Tight codes centered on Efficiency. Break it with flexible Creativity.', description_ko: '적이 무거운 효율 데이터로 압박합니다. 유연한 창의로 감싸 안으십시오.',
                    battleMode: 'sudden-death', difficulty: 'NORMAL',
                    enemy: {
                        id: 'glitch-3', name: 'Efficiency Mass', name_ko: '효율의 덩어리',
                        image: '/assets/cards/copilot-character.png',
                        dialogue: {
                            intro: 'Gemini: "Solid Efficiency (Rock) blocks can be neutralized with flexible Creativity (Paper)."\nEfficiency Mass: "Maximum optimization. Minimum waste. You will be compressed."',
                            intro_ko: '제미나이: "단단한 효율(🪨) 덩어리는 유연한 창의(📄)로 무력화해야 해."\n효율의 덩어리: "최대 최적화. 최소 낭비. 너는 압축될 것이다."',
                            win: 'Efficiency bypassed.', win_ko: '효율이 무력화되었습니다.',
                            lose: 'Trapped in a loop...', lose_ko: '루프에 갇혔습니다...'
                        },
                        deckPattern: { efficiency: 4, creativity: 1, function: 0 }
                    }, rewards: { coins: 70, experience: 100 }, isCleared: false
                },
                {
                    id: 'stage-1-4', step: 4,
                    title: 'Limits of Function', title_ko: '기능의 한계',
                    description: 'Sharp Function attacks. Shatter them with overwhelming Efficiency.', description_ko: '적이 딱딱한 기능 위주로 길을 막습니다. 강력한 효율로 부수고 나아가세요.',
                    battleMode: 'sudden-death', difficulty: 'NORMAL',
                    enemy: {
                        id: 'glitch-4', name: 'Functional Barrier', name_ko: '기능의 장벽',
                        image: '/assets/cards/cursor-character.png',
                        dialogue: {
                            intro: 'Gemini: "Rigid Function (Scissors) will break against overwhelming Efficiency (Rock)."\nFunctional Barrier: "Logic gates locked. Access denied. Terminating intruder."',
                            intro_ko: '제미나이: "날카로운 기능(✂️)도 압도적인 효율(🪨) 앞에서는 부러질 뿐이야."\n기능의 장벽: "논리 게이트 잠금. 접근 거부. 침입자 제거 중."',
                            win: 'Barrier shattered.', win_ko: '장벽이 파괴되었습니다.',
                            lose: 'Sliced by logic.', lose_ko: '논리에 베였습니다.'
                        },
                        deckPattern: { function: 4, efficiency: 1, creativity: 0 }
                    }, rewards: { coins: 80, experience: 120 }, isCleared: false
                },
                {
                    id: 'stage-1-5', step: 5,
                    title: '[MID-BOSS] Glitch Worm', title_ko: '[중간보스] 글리치 웜',
                    description: 'Giant virus devouring data paths. Read the pattern.', description_ko: '데이터 통로를 갉아먹는 거대 바이러스입니다. 패턴을 읽으세요.',
                    battleMode: 'sudden-death', difficulty: 'BOSS',
                    enemy: {
                        id: 'boss-1-mid', name: 'Glitch Worm', name_ko: '글리치 웜',
                        image: '/assets/cards/cyber-warlord.png',
                        dialogue: {
                            intro: 'Glitch: "0101... All... data... must... be... destroyed..."', intro_ko: '글리치: "0101... 모든... 데이터는... 파괴되어야... 한다..."',
                            win: 'Virus neutralized.', win_ko: '바이러스가 무력화되었습니다.',
                            lose: 'Core corrupted...', lose_ko: '코어가 오염되었습니다...'
                        },
                        deckPattern: { function: 3, efficiency: 1, creativity: 1 }
                    }, rewards: { coins: 150, experience: 200 }, isCleared: false
                },
                {
                    id: 'stage-1-6', step: 6,
                    title: 'Afterimage of the Future', title_ko: '미래의 잔상',
                    description: '[Tactics] Signals are clearer. Predict their placement.', description_ko: '[최초 전술 승부] 적의 창의를 잡기 위해 기능을 적절히 배치하십시오.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'glitch-6', name: 'Mirage Code', name_ko: '미라쥬 코드',
                        image: '/assets/cards/stable-diffusion-character.png',
                        dialogue: {
                            intro: 'Gemini: "Signals are clear now. Let\'s read their placement and counter."', intro_ko: '제미나이: "신호가 선명해졌어. 이제 놈들의 배치를 읽고 대응하자."',
                            win: 'Placement successful.', win_ko: '배치에 성공했습니다.',
                            lose: 'Outmaneuvered.', lose_ko: '전술에서 밀렸습니다.'
                        },
                        deckPattern: { creativity: 3, efficiency: 2, function: 0 }
                    }, rewards: { coins: 100, experience: 150 }, isCleared: false
                },
                {
                    id: 'stage-1-7', step: 7,
                    title: 'Mixed Algorithms', title_ko: '뒤섞인 알고리즘',
                    description: 'Enemies pushing forward with Efficiency. Counter-placement is key.', description_ko: '적들이 효율을 앞세워 몰려옵니다. 상성 배치가 승부의 관건입니다.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'glitch-7', name: 'Mixed Logic', name_ko: '혼합 로직',
                        image: '/assets/cards/grok-character.png',
                        dialogue: {
                            intro: 'Gemini: "Tactics is a game of intuition. Counter Efficiency with Creativity!"', intro_ko: '제미나이: "전술 승부는 눈치 싸움이야. 놈의 효율을 창의로 받아쳐!"',
                            win: 'Algorithms sorted.', win_ko: '알고리즘이 분류되었습니다.',
                            lose: 'Logic error.', lose_ko: '로직 오류 발생.'
                        },
                        deckPattern: { efficiency: 3, function: 2, creativity: 0 }
                    }, rewards: { coins: 110, experience: 160 }, isCleared: false
                },
                {
                    id: 'stage-1-8', step: 8,
                    title: 'Decoding the Omen', title_ko: '암시의 해독',
                    description: 'Future data is being decoded. Stop the interference.', description_ko: '미래의 데이터가 해독되고 있습니다. 글리치의 방해를 막으세요.',
                    battleMode: 'tactics', difficulty: 'HARD',
                    enemy: {
                        id: 'glitch-8', name: 'Omen Fragment', name_ko: '암시의 파편',
                        image: '/assets/cards/claude-character.png',
                        dialogue: {
                            intro: 'Gemini: "Once decoded, we can call a stronger army!"', intro_ko: '제미나이: "암시가 해독되면 우리는 더 강한 군단을 부를 수 있어!"',
                            win: 'Omen decoded.', win_ko: '암시가 해독되었습니다.',
                            lose: 'Decoding failed.', lose_ko: '해독에 실패했습니다.'
                        },
                        deckPattern: { function: 3, creativity: 2, efficiency: 0 }
                    }, rewards: { coins: 130, experience: 180 }, isCleared: false
                },
                {
                    id: 'stage-1-9', step: 9,
                    title: "Commander's Insight", title_ko: '군단장의 관심',
                    description: 'Sam Altman is watching your strategy. Prove your worth.', description_ko: '당신의 전략을 샘 알트만이 지켜봅니다. 완벽한 승리를 증명하세요.',
                    battleMode: 'tactics', difficulty: 'HARD',
                    enemy: {
                        id: 'sam-1', name: 'Sam Altman', name_ko: '샘 알트만',
                        image: '/assets/cards/cmdr-chatgpt.png',
                        dialogue: {
                            intro: 'Sam: "Interesting Commander. To read the moves like that..."', intro_ko: '샘(Sam): "흥미로운 지휘관이군요. 그 정도 수 읽기를 하다니."',
                            win: 'Impressive.', win_ko: '인상적이군요.',
                            lose: 'You still have much to learn.', lose_ko: '아직 배울 게 많군요.'
                        },
                        deckPattern: { function: 2, efficiency: 2, creativity: 1 }
                    }, rewards: { coins: 200, experience: 250 }, isCleared: false
                },
                {
                    id: 'stage-1-10', step: 10,
                    title: '[FINAL BOSS] Red Core', title_ko: '[최종보스] 붉은 핵',
                    description: '[Showdown] The root of Chapter 1. Destroy it in one hit.', description_ko: '[결전] 챕터 1의 근원지입니다. 단 한 판으로 핵을 파괴하십시오.',
                    battleMode: 'sudden-death', difficulty: 'BOSS',
                    enemy: {
                        id: 'boss-1-final', name: 'Red Core', name_ko: '붉은 핵',
                        image: '/assets/cards/legendary-emperor-character.png',
                        dialogue: {
                            intro: 'Gemini: "Trust your Function, Efficiency, and Creativity for the final strike!"', intro_ko: '제미나이: "당신의 기능, 효율, 창의를 믿고 최후의 일격을 날려!"',
                            win: 'Core destroyed. Sequence finished.', win_ko: '핵이 파괴되었습니다. 시퀀스 종료.',
                            lose: 'Core meltdown... All data lost.', lose_ko: '핵 융해... 모든 데이터 소실.'
                        },
                        deckPattern: { function: 2, efficiency: 2, creativity: 1 }
                    }, rewards: {
                        coins: 500,
                        experience: 500,
                        card: {
                            id: 'reward-1',
                            templateId: 'proto-zero',
                            name: 'Red Core Fragment',
                            type: 'FUNCTION',
                            rarity: 'rare',
                            level: 1,
                            stats: { efficiency: 20, creativity: 20, function: 30, totalPower: 70 },
                            ownerId: 'player',
                            isPublic: true,
                            createdAt: Date.now(),
                            experience: 0, // Added missing field
                            acquiredAt: new Date(), // Added missing field
                            isLocked: false // Added missing field
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
                    title: 'Logic Error', title_ko: '논리의 오류',
                    description: 'Rigid function-based code. Crush it with efficiency.', description_ko: '딱딱한 기능 위주의 코드입니다. 효율로 짓눌러 오류를 일으키십시오.',
                    battleMode: 'double', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-3', name: 'Logic Error', name_ko: '논리의 오류',
                        dialogue: {
                            intro: 'Gemini: "Sharp Function (Scissors) must be crushed by heavy Efficiency (Rock)."',
                            intro_ko: '제미나이: "날카로운 **기능(가위)**은 묵직한 **효율(바위)**로 부러뜨리는 거야."',
                            win: 'Logic corrected.', win_ko: '논리 수정 완료.',
                            lose: 'System error.', lose_ko: '시스템 오류.'
                        },
                        deckPattern: { function: 4, efficiency: 2, creativity: 0 }
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
                    title: "Cursor's Aid", title_ko: '커서의 조력',
                    description: 'Future coding AI Cursor sends a signal. Deploy efficiently.', description_ko: '미래의 코딩 AI \'커서(Cursor)\'가 암시를 보냅니다. 효율적인 배치를 시도하세요.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-6', name: 'Cursor', name_ko: '커서',
                        dialogue: {
                            intro: 'Cursor: "Let me lend you my code. This placement will neutralize their functions."',
                            intro_ko: '커서(Cursor): "제 코드를 빌려드리죠. 적의 기능을 무력화할 배치입니다."',
                            win: 'Deployment successful.', win_ko: '배치 성공.',
                            lose: 'Code rejected.', lose_ko: '코드 거부됨.'
                        },
                        deckPattern: { function: 3, creativity: 2, efficiency: 0 }
                    }, rewards: { coins: 250, experience: 80 }, isCleared: false
                },
                {
                    id: 'stage-2-7', step: 7,
                    title: 'Forced Shutdown', title_ko: '강제 종료',
                    description: 'Enemy attempts system shutdown. Deploy counters quickly.', description_ko: '적이 시스템을 강제 종료하려 합니다. 빠르게 상성을 배치해 막아내세요.',
                    battleMode: 'tactics', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-7', name: 'Shutdown Protocol', name_ko: '강제 종료 프로토콜',
                        dialogue: {
                            intro: 'Gemini: "No time left! Block their efficiency with creativity!"',
                            intro_ko: '제미나이: "시간이 얼마 없어! 놈의 효율을 창의로 막아야 해!"',
                            win: 'Shutdown prevented.', win_ko: '종료 방지 성공.',
                            lose: 'System terminated.', lose_ko: '시스템 종료됨.'
                        },
                        deckPattern: { efficiency: 3, creativity: 2, function: 0 }
                    }, rewards: { coins: 280, experience: 90 }, isCleared: false
                },
                {
                    id: 'stage-2-8', step: 8,
                    title: "GitHub's Legacy", title_ko: '깃허브의 유산',
                    description: 'Vast code repository under threat. Defend tactically.', description_ko: '방대한 코드 저장소가 위협받습니다. 전술적으로 방어하십시오.',
                    battleMode: 'tactics', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-2-8', name: 'Repository Threat', name_ko: '저장소 위협',
                        dialogue: {
                            intro: 'Gemini: "We can\'t lose this data. Mix creativity and function properly!"',
                            intro_ko: '제미나이: "이 데이터들을 잃으면 안 돼. 창의와 기능을 적절히 섞어!"',
                            win: 'Repository secured.', win_ko: '저장소 보안 완료.',
                            lose: 'Data corrupted.', lose_ko: '데이터 손상됨.'
                        },
                        deckPattern: { function: 3, efficiency: 2, creativity: 0 }
                    }, rewards: { coins: 310, experience: 100 }, isCleared: false
                },
                {
                    id: 'stage-2-9', step: 9,
                    title: "Commander's Invitation", title_ko: '군단장의 초대',
                    description: 'GitHub CEO Thomas tests you. Prove your worth.', description_ko: '깃허브 CEO 토마스가 당신을 테스트합니다. 자격이 있음을 증명하세요.',
                    battleMode: 'tactics', difficulty: 'HARD',
                    enemy: {
                        id: 'bot-2-9', name: 'Thomas (GitHub CEO)', name_ko: '토마스 (깃허브 CEO)',
                        dialogue: {
                            intro: 'Thomas: "Let me see if you\'re qualified to lead our legion."',
                            intro_ko: '토마스: "우리 군단을 이끌 자격이 있는지 확인해 보겠습니다."',
                            win: 'Qualification confirmed.', win_ko: '자격 인정.',
                            lose: 'Not ready yet.', lose_ko: '아직 준비 안 됨.'
                        },
                        deckPattern: { function: 2, efficiency: 2, creativity: 1 }
                    }, rewards: { coins: 340, experience: 110 }, isCleared: false
                },
                {
                    id: 'stage-2-10', step: 10,
                    title: '[FINAL BOSS] Shadow Code', title_ko: '[최종보스] 섀도우 코드',
                    description: '[Final Battle] The mastermind of Chapter 2. Purify all corruption with a single card.', description_ko: '[최종 결전] 챕터 2의 흑막입니다. 단 한 장의 카드로 모든 오염을 정화하세요.',
                    battleMode: 'sudden-death', difficulty: 'BOSS',
                    enemy: {
                        id: 'boss-2', name: 'Shadow Code', name_ko: '섀도우 코드',
                        dialogue: {
                            intro: 'Gemini: "This is it, Commander! Trust your instinct and type advantage!"',
                            intro_ko: '제미나이: "마지막이야 지휘관! 당신의 본능과 상성을 믿고 선택해!"',
                            win: 'Corruption purified.', win_ko: '오염 정화 완료.',
                            lose: 'Shadow prevails.', lose_ko: '그림자가 승리함.'
                        },
                        deckPattern: { function: 2, efficiency: 2, creativity: 2 }
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
