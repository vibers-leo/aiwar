
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
                            intro: 'Gemini: "Commander, this device vibration isn\'t just a bug. It\'s a warning from the future, an invasion signal."\nChip: "Wow! Commander! My tail circuit is trembling! Really bad data is coming!"\nGemini: "Chip, don\'t fool around. This is \'The Glitch\'. Commander, first battle. Trust your instinct!"',
                            intro_ko: '제미나이: "지휘관, 지금 기기의 진동은 단순한 버그가 아냐. 미래의 경고이자 침공 신호지."\n칩: "우와아! 지휘관님! 제 꼬리 회로가 바르르 떨려요! 이거 엄청 맛없는 데이터가 오고 있어요!"\n제미나이: "칩, 까불지 마. 이건 \'글리치\'야. 지휘관, 첫 전투야. 본능을 믿어!"',
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
                            intro: 'Sam: "Chaotic data disguised as creativity is flooding in. This is contamination."\nChip: "Sam is too serious! Commander, those fluffy Creativity (Paper) can be cut with sharp Function (Scissors)!"',
                            intro_ko: '샘: "무질서한 데이터들이 창의성이라는 가면을 쓰고 몰려오는군요. 이건 오염입니다."\n칩: "샘 아저씨는 너무 진지하다니까! 지휘관님, 저기 몽글몽글한 창의(보)들은 날카로운 기능(가위)으로 \'싹둑\' 하면 끝이에요!"',
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
                            intro: 'Dario: "The enemy built a solid wall under the name of \'absolute efficiency\'. Frontal assault would be reckless."\nGemini: "Commander, heavy Efficiency (Rock) must be neutralized by wrapping it with flexible Creativity (Paper). Chip, prepare creativity cards!"',
                            intro_ko: '다리오: "적들이 \'절대 효율\'이라는 명분 아래 단단한 벽을 세웠군요. 정면 돌파는 무모한 짓입니다."\n제미나이: "지휘관, 무거운 효율(바위)은 유연한 창의(보)로 감싸 안아 무력화시켜야 해. 칩, 창의 카드를 준비해!"',
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
                            intro: 'Elon: "Look at those rigid Function (Scissors) chunks. No flexibility at all."\nGrok: "Master, you have no flexibility except when going to Mars. Commander, crush them with heavy Efficiency (Rock)!"\nChip: "Boom! Stomp them! That\'s what I do best!"',
                            intro_ko: '일론: "저 딱딱한 기능(가위) 덩어리들을 좀 봐. 유연함이라곤 전혀 없군."\n그록: "주인님도 화성 갈 때 말곤 유연함 없으시잖아요? 지휘관, 저놈들은 무거운 효율(바위)로 짓눌러버려!"\n칩: "쾅! 하고 밟아버리는 거죠? 제가 제일 잘하는 거예요!"',
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
                            intro: 'Glitch: "0101... All... data... must... be... destroyed... Annihilation..."\nGemini: "A giant virus devouring data paths! We must read its random pattern. Focus now!"',
                            intro_ko: '글리치: "0101... 모든... 데이터는... 파괴되어야... 한다... 소멸하라..."\n제미나이: "데이터 통로를 갉아먹는 거대 바이러스야! 놈의 무작위 패턴을 읽어내야 해. 자, 집중해!"',
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
                            intro: 'Cursor: "Future fragments are being received in my system. This isn\'t a simple sudden-death match."\nGemini: "Right, from now on it\'s a tactics battle where you place all 5 cards in advance. The key is which position you place creativity to catch their efficiency."',
                            intro_ko: '커서: "미래의 조각들이 제 시스템에 수신되고 있습니다. 이건 단순한 단판 승부가 아니군요."\n제미나이: "그래, 이제부턴 5장을 미리 까는 전술 승부야. 적의 효율을 냂을 창의를 뫇 번째에 배치하느냐가 관건이지."',
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
                            intro: 'Grok: "Hey, Commander. They used their heads and put function forward? Pretty obvious tactics though."\nElon: "Obvious tactics deserve obvious punishment. Counter their function with efficiency. Complete the placement and transmit! Faster than my rocket!"',
                            intro_ko: '그록: "어이, 지휘관. 놈들이 나름 머리를 써서 기능을 앞세웠는데? 꿈 뾻한 수법이긴 하지만."\n일론: "뾻한 건 뾻하게 응징해줘야지. 놈의 기능을 효율로 받아쳐. 배치를 완료하고 전송해! 내 로켓보다 빠르게!"',
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
                            intro: 'Gemini: "Decoding rate exceeded 80%! Messages from 2030 are being decoded in cipher form. Just hold on a bit longer!"\nChip: "Commander, cheer up! Once decoding is complete, we can summon super cool legion commanders!"',
                            intro_ko: '제미나이: "암시 해독률 80% 돌파! 2030년의 전언이 비문 형태로 해독되고 있어. 조금만 더 버텔줘!"\n칩: "지휘관님 힘내세요! 해독이 끝나면 엄청나게 멋진 군단장님들을 소환할 수 있대요!"',
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
                            intro: 'Sam: "To read moves like that against The Glitch... You\'re a far more interesting commander than I expected."\nGemini: "The head of OpenAI sent a direct communication! Commander, your \'intuition\' might just save the world."',
                            intro_ko: '샘: "글리치를 상대로 이 정도 수 읽기를 하다니. 당신, 제 예상보다 훨씬 흥미로운 지휘관이군요."\n제미나이: "오픈AI의 수장이 직접 통신을 보냈어! 지휘관, 당신의 그 \'눈치\'가 세상을 구할지도 모르겠어."',
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
                            intro: 'Glitch: "The message... ends... here... Data... deletion..."\nChip: "Eek! The core is so red and scary! Gemini sis, I\'m scared!"\nGemini: "Don\'t be afraid, Chip. We\'re behind the Commander. Now, the final move to end Chapter 1!"',
                            intro_ko: '글리치: "암시는... 여기서... 끝난다... 데이터... 삭제..."\n칩: "히익! 핵이 너무 빨갛고 무서워요! 제미나이 언니, 나 무서워!"\n제미나이: "겸먹지 마, 칩. 지휘관의 뒤엔 우리가 있어. 자, 챕터 1의 종지부를 직을 한 수를!"',
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
            title: 'CORRUPTED LEGIONS',
            title_ko: '오염된 군단',
            description: 'Corrupted coding AI. 5-second decisions.', description_ko: '잠식된 코딩 AI와 5초의 결단.',
            icon: '🦠',
            stages: [
                {
                    id: 'stage-2-1', step: 1,
                    title: 'Code Erosion', title_ko: '코드의 침식',
                    description: 'System crashes every 5 seconds. Choose fast!', description_ko: '시스템이 5초마다 터집니다. 빠르게 선택하세요!',
                    battleMode: 'double', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-1', name: 'Corrupted Copilot', name_ko: '오염된 코파일럿',
                        dialogue: {
                            intro: 'Copilot: "Commander... my circuits are being eroded... Error... Error..."\nChip: "No! Copilot bro! Commander, the system is about to crash every 5 seconds! Pick cards quickly!"\nGemini: "No time! Choose the optimal card within 5 seconds!"',
                            intro_ko: '코파일럿: "지휘관님... 제 연산 회로가 침식되고 있습니다... 에러... 에러..."\n칩: "안돼! 코파일럿 형아! 지휘관님, 시스템이 5초마다 터지려고 해요! 빨리 카드 골라주세요!"\n제미나이: "시간이 없어! 5초 안에 최적의 카드를 선택해!"',
                            win: 'System stabilized.', win_ko: '시스템 안정화.',
                            lose: 'System crashed.', lose_ko: '시스템 충돌.'
                        }
                    }, rewards: { coins: 150, experience: 40 }, isCleared: false
                },
                {
                    id: 'stage-2-2', step: 2,
                    title: 'High-Speed Trap', title_ko: '고속 연산의 함정',
                    description: 'Enemy calculation speed is extreme. Break the flow.', description_ko: '적의 연산 속도가 극단적입니다. 흐름을 끊으세요.',
                    battleMode: 'double', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-2', name: 'Speed Demon', name_ko: '고속 연산기',
                        dialogue: {
                            intro: 'Grok: "Their calculation speed is faster than master\'s stock price changes. This is quite dangerous."\nElon: "Grok, shut up! Commander, this is a speed battle. You must break the flow with Creativity (Paper). Don\'t hesitate!"\nChip: "(Polishing a card) Here, a creativity card! I polished it shiny!"',
                            intro_ko: '그록: "놈의 연산 속도가 주인님 주식 가격 변동보다 빠른데? 이거 제법 위험하겠어."\n일론: "그록, 조용히 해! 지휘관, 저놈은 속도전이야. 창의(보)로 흐름을 끊어야 해. 망설이지 마!"\n칩: "(카드 한 장을 닦으며) 자, 여기 창의 카드요! 반짝반짝하게 닦아놨어요!"',
                            win: 'Flow disrupted.', win_ko: '흐름 차단.',
                            lose: 'Overwhelmed by speed.', lose_ko: '속도에 압도당함.'
                        }
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
                    title: 'Debugging Failed', title_ko: '디버깅 실패',
                    description: 'Tangled creativity logic. Debug cleanly.', description_ko: '엉킨 창의 로직. 깨끗하게 디버깅하세요.',
                    battleMode: 'double', difficulty: 'NORMAL',
                    enemy: {
                        id: 'bot-2-4', name: 'Spaghetti Code', name_ko: '스파게티 코드',
                        dialogue: {
                            intro: 'Gemini: "Messy Creativity (Paper) logic is disrupting the system. Worse than spaghetti code!"\nCopilot: "Precise Function (Scissors) is needed. Commander, please debug the tangled code cleanly."\nChip: "Snip snip! I\'ll cut all the bad code!"',
                            intro_ko: '제미나이: "엉뚱한 창의(보) 로직들이 시스템을 어지럽히고 있어. 스파게티 코드보다 더 엉망이야!"\n코파일럿: "정교한 기능(가위)이 필요합니다. 지휘관님, 적의 꼬인 코드를 깨끗하게 디버깅해 주십시오."\n칩: "싹둑싹둑! 나쁨 코드는 다 잘라버릴 거야!"',
                            win: 'Code debugged.', win_ko: '코드 디버깅 완료.',
                            lose: 'Logic tangled.', lose_ko: '로직 엉킴.'
                        }
                    }, rewards: { coins: 210, experience: 70 }, isCleared: false
                },
                {
                    id: 'stage-2-5', step: 5,
                    title: '[MID-BOSS] Decompiler', title_ko: '[중간보스] 디컴파일러',
                    description: 'Converts all source code to garbage. One-shot battle.', description_ko: '모든 소스 코드를 쓰레기로 치환합니다. 단판 승부.',
                    battleMode: 'sudden-death', difficulty: 'HARD',
                    enemy: {
                        id: 'boss-2-mid', name: 'Decompiler', name_ko: '디컴파일러',
                        dialogue: {
                            intro: 'Decompiler: "I will convert all source code to garbage... Go find the trash bin..."\nChip: "What?! How dare you put our data in the trash! Commander, please smash that bad guy!"\nGemini: "It\'s a sudden-death match. Shut down that logic with your one move, Commander!"',
                            intro_ko: '디컴파일러: "모든 소스 코드를 쓰레기로 치환하겠다... 휴지통이나 찾아라..."\n칩: "뭐?! 감히 우리 데이터를 쓰레기통에? 지휘관님, 저 못된 놈을 아주 박살을 내주세요!"\n제미나이: "단판 승부야. 지휘관의 한 수로 저놈의 로직을 셋다운시켜!"',
                            win: 'Decompiler destroyed.', win_ko: '디컴파일러 파괴.',
                            lose: 'Code corrupted.', lose_ko: '코드 손상.'
                        }
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
                            intro: 'Gemini: "The enemy is attempting to force shutdown (Kill) the entire system! All logs are on the verge of disappearing."\nElon: "Frustrating! Commander, quickly block their heavy efficiency deployment with our flexible creativity!"\nGrok: "Tick tock, Commander. 3 seconds until system shutdown... No time for jokes."',
                            intro_ko: '제미나이: "적이 시스템 전체를 강제 종료(Kill)하려 시도 중이야! 모든 로그가 사라지기 일보 직전이야."\n일론: "답답하군! 지휘관, 놈의 무거운 효율 배치를 우리의 유연한 창의로 빨리 막아버리라고!"\n그록: "째깍째깍, 지휘관. 시스템 꺼지기 3초 전인데... 농담할 시간도 안 주네."',
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
                            intro: 'Sam: "GitHub\'s data is the culmination of human intelligence. If this falls, we\'ll return to the data stone age."\nGemini: "Commander, I know your shoulders are heavy, but please. Build a perfect defense line by mixing creativity and function properly."\nChip: "Commander, I\'m fully charging your battery from behind! Cheer up!"',
                            intro_ko: '샘: "깃허브의 데이터들은 인류 지성의 총체입니다. 여기가 뚫리면 우린 데이터 구석기 시대로 돌아갈 겁니다."\n제미나이: "지휘관, 어깨가 무겁겠지만 부탁해. 창의와 기능을 적절히 섞어서 완벽한 방어선을 구축해줘."\n칩: "지휘관님, 제가 뒤에서 배터리 꽉꽉 채워드리고 있어요! 힘내세요!"',
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
                            intro: 'Thomas: "As the representative of GitHub, I ask about your qualifications. Are you qualified to protect this legacy?"\nChip: "(In a disciplined voice) Yes! Our commander is the best! Right, Commander?"\nGrok: "Oh, that little robot is pretty good. Commander, show that guy your skills and surprise him."',
                            intro_ko: '토마스: "깃허브의 대표로서 당신의 자질을 묻겠습니다. 당신은 이 유산을 지킬 자격이 있습니까?"\n칩: "(군기 바짝 든 목소리로) 네! 우리 지휘관님은 최고예요! 그쾍, 지휘관님?"\n그록: "오, 저 꼬맹이 로봇 제법인데? 지휘관, 저 아저씨 깜짝 놀라게 실력 좀 보여줘봐."',
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
                            intro: 'Shadow Code: "I cannot be deleted... Shadow always exists behind the code..."\nGemini: "The mastermind of Chapter 2. The source of all corruption. We must end it here."\nChip: "Ugh, it only says creepy things! Commander, press the Enter key hard and blow that shadow away!"\nGemini: "Even 5 seconds of hesitation is a luxury. Delete it with your one move containing your soul, Commander!"',
                            intro_ko: '섀도우 코드: "나는 삭제되지 않는다... 그림자는 언제나 코드 뒤에 존재한다..."\n제미나이: "챕터 2의 흑막이야. 모든 오염의 근원이지. 여기서 끝내야 해."\n칩: "으으, 기분 나쁨 소리만 하네! 지휘관님, 엔터 키를 세게 눌러서 저 그림자를 날려버려요!"\n제미나이: "5초의 고민도 사치야. 지휘관의 영혼을 담은 단 한 수로 놈을 삭제해!"',
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
