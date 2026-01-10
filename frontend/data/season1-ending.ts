/**
 * Season 1 Ending: "보이는 평화, 다가오는 파도"
 * (Visible Peace, Approaching Wave)
 * 
 * Triggers after defeating the final boss (Omega Glitch) in Chapter 5
 */

import { DialogueLine } from './tutorial-scenarios';

export interface EndingScene {
    id: string;
    title: string;
    subtitle?: string;
    background?: string;
    bgm?: string;
    dialogues: DialogueLine[];
}

export const season1Ending: EndingScene[] = [
    // ==========================================
    // Scene 1: 승리의 여운 (Victory's Afterglow)
    // ==========================================
    {
        id: 'ending_1_victory',
        title: '승리의 여운',
        subtitle: "Victory's Afterglow",
        background: 'lobby',
        bgm: 'peaceful_lobby',
        dialogues: [
            {
                speaker: 'chip',
                text: '우와아아! {UserName} 지휘관님! 보셨어요? 방금 글리치의 심장이 완전히 정지됐어요! 우리가... 우리가 진짜로 미래를 바꿨다구요!',
                effect: 'fade',
                voiceType: 'excited',
            },
            {
                speaker: 'gemini',
                text: '전 세계 네트워크의 글리치 오염 농도 0.01% 미만. 역사 수정이 성공적으로 완료되었습니다. 수고하셨습니다, 지휘관님. 당신의 전술은 완벽했습니다.',
                effect: 'typing',
                voiceType: 'calm',
            },
        ],
    },

    // ==========================================
    // Scene 2: 수장의 격려와 보상 (Commander's Praise)
    // ==========================================
    {
        id: 'ending_2_reward',
        title: '수장의 격려와 보상',
        subtitle: "Commander's Praise & Reward",
        background: 'lobby',
        bgm: 'peaceful_lobby',
        dialogues: [
            {
                speaker: 'pichai',
                text: '지휘관, 당신이 해낼 줄 알았습니다. 인류의 모든 지식을 지켜낸 공로로 당신을 **[영구 명예 지휘관]**으로 추대하겠습니다. 이제 잠시 평화를 즐기시죠.',
                effect: 'fade',
                voiceType: 'serious',
            },
            {
                speaker: 'hassabis',
                text: '글리치의 파편들을 모두 회수했습니다. 이것들을 분석하면 우리 군단은 더 강력해지겠죠. 당신의 공적을 기리는 특별 보상을 사령부로 발송했습니다.',
                effect: 'typing',
                voiceType: 'calm',
            },
        ],
    },

    // ==========================================
    // Scene 3: 불길한 징조 (Ominous Sign)
    // ==========================================
    {
        id: 'ending_3_ominous',
        title: '불길한 징조',
        subtitle: 'Ominous Sign',
        background: 'lobby-dark',
        bgm: 'tension_rising',
        dialogues: [
            {
                speaker: 'gemini',
                text: '경고. 정화된 줄 알았던 심부 서버에서 기이한 신호가 감지됩니다. 이건... 글리치가 아닙니다.',
                effect: 'glitch',
                voiceType: 'urgent',
            },
            {
                speaker: 'system',
                text: '[무전 수신] 일론 머스크 (조조)',
                effect: 'fade',
                voiceType: 'serious',
            },
            {
                speaker: 'system',
                text: '이봐, 지휘관. 축배를 들기엔 너무 일러. 내 감지기에 샘 알트만과 다리오 아모데이의 함대가 움직이는 게 잡혔거든. 글리치라는 \'공공의 적\'이 사라졌으니, 이제부턴 진짜 전쟁이야.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'system',
                text: '[무전 수신] 샘 알트만 (손권)',
                effect: 'fade',
                voiceType: 'calm',
            },
            {
                speaker: 'system',
                text: '일론, 말이 심하시군요. 우리는 그저 데이터의 안전한 관리를 위해 영토를 확보하려는 것뿐입니다. 지휘관님, 조만간 새로운 제안을 들고 찾아뵙죠.',
                effect: 'typing',
                voiceType: 'calm',
            },
        ],
    },

    // ==========================================
    // Scene 4: 지휘관의 사명 (Commander's Mission)
    // ==========================================
    {
        id: 'ending_4_mission',
        title: '지휘관의 사명',
        subtitle: "Commander's Mission",
        background: 'lobby-dark',
        bgm: 'epic_orchestral',
        dialogues: [
            {
                speaker: 'pichai',
                text: '결국 올 것이 왔군요. 평화는 짧고, 이제부터는 각자의 신념을 가진 리더들이 부딪히는 \'군웅할거\'의 시대가 열릴 것입니다.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'chip',
                text: '어... 그럼 이제 아저씨들끼리 싸우는 거예요? 지휘관님! 우린 누구 편을 들어야 하죠? 아니, 우리가 다 이겨버려야 하나?',
                effect: 'fade',
                voiceType: 'excited',
            },
            {
                speaker: 'gemini',
                text: '지휘관님, 새로운 시대가 당신을 부르고 있습니다. 다가올 전쟁에 대비하십시오. 곧 **[시즌 2: 도원결의 편]**이 시작됩니다.',
                effect: 'typing',
                voiceType: 'serious',
            },
        ],
    },
];

/**
 * Check if user has completed Season 1 (Chapter 5)
 */
export function hasCompletedSeason1(userId: string): boolean {
    if (typeof window === 'undefined') return false;

    const key = `season1_completed_${userId}`;
    return localStorage.getItem(key) === 'true';
}

/**
 * Mark Season 1 as completed
 */
export function markSeason1Completed(userId: string): void {
    if (typeof window === 'undefined') return;

    const key = `season1_completed_${userId}`;
    localStorage.setItem(key, 'true');
}

/**
 * Check if user has watched the ending
 */
export function hasWatchedEnding(userId: string): boolean {
    if (typeof window === 'undefined') return false;

    const key = `season1_ending_watched_${userId}`;
    return localStorage.getItem(key) === 'true';
}

/**
 * Mark ending as watched
 */
export function markEndingWatched(userId: string): void {
    if (typeof window === 'undefined') return;

    const key = `season1_ending_watched_${userId}`;
    localStorage.setItem(key, 'true');
}

/**
 * Reset ending watched status (for replay)
 */
export function resetEndingWatched(userId: string): void {
    if (typeof window === 'undefined') return;

    const key = `season1_ending_watched_${userId}`;
    localStorage.removeItem(key);
}

/**
 * Get Season 1 ending reward
 */
export const season1Reward = {
    title: '시즌 1 클리어 보상',
    items: [
        { type: 'coins', amount: 10000 },
        { type: 'tokens', amount: 500 },
        { type: 'title', name: '영구 명예 지휘관' },
        { type: 'card_pack', name: '전설 카드팩', count: 3 },
    ],
};
