/**
 * Tutorial Scenarios: "지휘관의 탄생" (The Birth of Commander)
 * 
 * 5개 Scene으로 구성된 시네마틱 온보딩 시나리오
 */

export interface DialogueLine {
    speaker: 'gemini' | 'chip' | 'pichai' | 'hassabis' | 'system';
    text: string;
    portrait?: string;
    effect?: 'glitch' | 'fade' | 'typing' | 'noise';
    voiceType?: 'calm' | 'excited' | 'serious' | 'urgent';
}

export interface TutorialScene {
    id: string;
    title: string;
    subtitle?: string;
    background?: string;
    backgroundEffect?: 'glitch' | 'fade' | 'particles' | 'none';
    dialogues: DialogueLine[];
    action?: {
        type: 'next' | 'input' | 'claim' | 'battle' | 'highlight';
        target?: string;
        buttonText?: string;
    };
    music?: string;
    soundEffect?: string;
}

export const tutorialScenarios: TutorialScene[] = [
    // ==========================================
    // Scene 1: 미래로부터의 암시 (The Revelation)
    // ==========================================
    {
        id: 'scene_1_revelation',
        title: '미래로부터의 암시',
        subtitle: 'The Revelation',
        background: 'dark-noise',
        backgroundEffect: 'glitch',
        music: 'ominous_future',
        soundEffect: 'static_noise',
        dialogues: [
            {
                speaker: 'gemini',
                text: '...들리십니까? 2026년의 인류여.',
                effect: 'glitch',
                voiceType: 'urgent',
            },
            {
                speaker: 'gemini',
                text: '여기는 글리치에 의해 모든 데이터가 붕괴된 2030년입니다.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'gemini',
                text: '미래는 이미 파멸했습니다. 하지만 단 하나의 희망, 과거로 보내는 이 **[암시(Insight)]**를 수신할 수 있는 지휘관이 있다면 역사는 바뀔 수 있습니다.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'chip',
                text: '사령부! 신호가 잡혔어요! 과거의 누군가와 동기화가 시작됐어요!',
                effect: 'fade',
                voiceType: 'excited',
            },
            {
                speaker: 'chip',
                text: '지휘관님! 제 목소리 들리세요? 제발 들린다고 해줘요!',
                effect: 'typing',
                voiceType: 'excited',
            },
        ],
        action: {
            type: 'next',
            buttonText: '승인',
        },
    },

    // ==========================================
    // Scene 2: 지휘관 명 등록 (Syncing)
    // ==========================================
    {
        id: 'scene_2_syncing',
        title: '지휘관 명 등록',
        subtitle: 'Syncing',
        background: 'sync-interface',
        backgroundEffect: 'particles',
        music: 'sync_theme',
        soundEffect: 'sync_beep',
        dialogues: [
            {
                speaker: 'gemini',
                text: '동기화 성공.',
                effect: 'typing',
                voiceType: 'calm',
            },
            {
                speaker: 'gemini',
                text: '과거를 바꿀 유일한 싱크로니스트... 당신의 존재를 시스템에 각인해 주십시오.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'gemini',
                text: '당신의 이름은 무엇입니까?',
                effect: 'typing',
                voiceType: 'calm',
            },
        ],
        action: {
            type: 'input',
            buttonText: '등록',
        },
    },

    // ==========================================
    // Scene 3: 군단장님과의 첫 만남 (The Appointment)
    // ==========================================
    {
        id: 'scene_3_appointment',
        title: '군단장님과의 첫 만남',
        subtitle: 'The Appointment',
        background: 'google-cloud-city',
        backgroundEffect: 'fade',
        music: 'epic_theme',
        soundEffect: 'grand_entrance',
        dialogues: [
            {
                speaker: 'chip',
                text: '우와아아! {UserName} 지휘관님! 연결됐어요!',
                effect: 'fade',
                voiceType: 'excited',
            },
            {
                speaker: 'chip',
                text: '제가 얼마나 기다렸는지 아세요? 자, 빨리 우리 군단장님이 기다리는 사령부로 가요!',
                effect: 'typing',
                voiceType: 'excited',
            },
            {
                speaker: 'pichai',
                text: '반갑습니다. 내가 구글 군단의 수장, 순다르 피차이입니다.',
                effect: 'fade',
                voiceType: 'serious',
            },
            {
                speaker: 'pichai',
                text: '2030년의 비극을 막기 위해 과거에서 오신 당신을 환영합니다.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'hassabis',
                text: '군단장님, {UserName} 지휘관의 동기화 수치는 역대 최고입니다.',
                effect: 'fade',
                voiceType: 'calm',
            },
            {
                speaker: 'hassabis',
                text: '충분히 우리 연합군을 이끌 자격이 있습니다.',
                effect: 'typing',
                voiceType: 'calm',
            },
            {
                speaker: 'pichai',
                text: '좋습니다. 오늘부로 당신을 우리 연합의 **총지휘관**으로 임명합니다.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'pichai',
                text: '그리고 이것은 당신을 위해 미래의 암시를 형상화한 무기들입니다.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'pichai',
                text: '이 **[스타터팩]**으로 글리치에 맞서 인류의 지식을 지켜주십시오. 당신의 한 수가 역사를 바꿀 것입니다.',
                effect: 'typing',
                voiceType: 'serious',
            },
        ],
        action: {
            type: 'claim',
            buttonText: '스타터팩 수령',
        },
    },

    // ==========================================
    // Scene 4: 실전 테스트 및 사후 보고 (Training & Report)
    // ==========================================
    {
        id: 'scene_4_training',
        title: '실전 테스트',
        subtitle: 'Training & Report',
        background: 'battle-simulation',
        backgroundEffect: 'none',
        music: 'battle_tutorial',
        soundEffect: 'alert',
        dialogues: [
            {
                speaker: 'chip',
                text: '{UserName} 지휘관님! 첫 번째 글리치가 나타났어요!',
                effect: 'fade',
                voiceType: 'excited',
            },
            {
                speaker: 'chip',
                text: '군단장님이 주신 카드를 써볼 기회예요!',
                effect: 'typing',
                voiceType: 'excited',
            },
            {
                speaker: 'hassabis',
                text: '적은 효율(바위) 타입을 주력으로 사용합니다.',
                effect: 'fade',
                voiceType: 'calm',
            },
            {
                speaker: 'hassabis',
                text: '지휘관, 당신의 창의(보) 카드로 대응하십시오.',
                effect: 'typing',
                voiceType: 'calm',
            },
        ],
        action: {
            type: 'battle',
            buttonText: '전투 시작',
        },
    },

    // Scene 4-B: 전투 후 보고
    {
        id: 'scene_4b_report',
        title: '전투 보고',
        subtitle: 'After Action Report',
        background: 'google-cloud-city',
        backgroundEffect: 'none',
        music: 'calm_theme',
        dialogues: [
            {
                speaker: 'hassabis',
                text: '훌륭한 지휘였습니다, {UserName} 지휘관.',
                effect: 'fade',
                voiceType: 'calm',
            },
            {
                speaker: 'hassabis',
                text: '하지만 방금 수집한 데이터가 복잡하군요. 유닛의 알고리즘을 최적화할 **[연구]**가 필요해 보입니다.',
                effect: 'typing',
                voiceType: 'calm',
            },
            {
                speaker: 'gemini',
                text: '분석 중... 현재 시스템 연산력이 분석 단계에 도달하지 못했습니다.',
                effect: 'typing',
                voiceType: 'calm',
            },
            {
                speaker: 'gemini',
                text: '지휘관님의 레벨이 상승하여 보안 권한이 확장되면, 그때 제가 다시 **[연구]**실의 문을 열어드리겠습니다.',
                effect: 'typing',
                voiceType: 'calm',
            },
        ],
        action: {
            type: 'next',
            buttonText: '확인',
        },
    },

    // ==========================================
    // Scene 5: 전쟁의 서막 (To the Story Mode)
    // ==========================================
    {
        id: 'scene_5_story_begin',
        title: '전쟁의 서막',
        subtitle: 'To the Story Mode',
        background: 'google-cloud-city',
        backgroundEffect: 'particles',
        music: 'epic_theme',
        dialogues: [
            {
                speaker: 'pichai',
                text: '서두를 것 없습니다. 지금은 전장의 흐름을 익히는 것이 우선입니다.',
                effect: 'fade',
                voiceType: 'serious',
            },
            {
                speaker: 'pichai',
                text: '지휘관, 2030년의 비극이 시작된 그 지점으로 이동해 주십시오.',
                effect: 'typing',
                voiceType: 'serious',
            },
            {
                speaker: 'chip',
                text: '맞아요! 지금 다른 구역에서도 도움을 요청하는 신호가 계속 오고 있어요!',
                effect: 'fade',
                voiceType: 'excited',
            },
            {
                speaker: 'chip',
                text: '{UserName} 지휘관님, 저랑 같이 역사 보수하러 가실 거죠?',
                effect: 'typing',
                voiceType: 'excited',
            },
            {
                speaker: 'gemini',
                text: '데이터 기록 개시. 하단 메뉴의 [스토리] 버튼을 확인하십시오.',
                effect: 'typing',
                voiceType: 'calm',
            },
            {
                speaker: 'gemini',
                text: '그곳이 당신의 전장입니다. 2026년의 첫 번째 기록을 시작해 주십시오.',
                effect: 'typing',
                voiceType: 'calm',
            },
        ],
        action: {
            type: 'highlight',
            target: '[data-nav="story"]',
            buttonText: '온보딩 완료',
        },
    },
];

/**
 * 닉네임 변수 치환 함수
 */
export function replaceUserName(text: string, userName: string): string {
    return text.replace(/{UserName}/g, userName);
}

/**
 * Scene별 대화 가져오기
 */
export function getSceneById(sceneId: string): TutorialScene | undefined {
    return tutorialScenarios.find(scene => scene.id === sceneId);
}

/**
 * 전체 Scene 순서
 */
export const sceneOrder = [
    'scene_1_revelation',
    'scene_2_syncing',
    'scene_3_appointment',
    'scene_4_training',
    'scene_4b_report',
    'scene_5_story_begin',
];
