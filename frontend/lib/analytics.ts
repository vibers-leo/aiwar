// GA4 커스텀 이벤트 트래킹
// gtag는 layout.tsx에서 글로벌로 로드됨

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

function track(event: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event, params);
    }
}

// 유저 퍼널
export const analytics = {
    // 회원가입/로그인
    signup: (method: string) => track('sign_up', { method }),
    login: (method: string) => track('login', { method }),
    tutorialComplete: () => track('tutorial_complete'),

    // 카드
    cardGenerated: (rarity: string, faction: string) => track('card_generated', { rarity, faction }),
    cardEnhanced: (rarity: string, level: number) => track('card_enhanced', { rarity, level }),
    cardFused: (resultRarity: string) => track('card_fused', { result_rarity: resultRarity }),

    // 배틀
    battleStarted: (mode: string) => track('battle_started', { mode }),
    battleFinished: (mode: string, result: 'win' | 'loss') => track('battle_finished', { mode, result }),
    stageCleared: (stageId: number, chapter: number) => track('stage_cleared', { stage_id: stageId, chapter }),

    // PVP
    pvpMatchStarted: (battleMode: string) => track('pvp_match_started', { battle_mode: battleMode }),
    pvpMatchFinished: (result: 'win' | 'loss', battleMode: string) => track('pvp_match_finished', { result, battle_mode: battleMode }),

    // 상점
    shopPurchase: (itemId: string, currency: string, amount: number) => track('shop_purchase', { item_id: itemId, currency, amount }),

    // 리텐션
    dailyRewardClaimed: (day: number) => track('daily_reward_claimed', { day }),
    missionCompleted: (missionId: string) => track('mission_completed', { mission_id: missionId }),

    // 소셜
    friendAdded: () => track('friend_added'),
    clashRoomCreated: () => track('clash_room_created'),
};
