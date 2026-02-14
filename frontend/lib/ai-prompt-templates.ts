/**
 * AI 카드 이미지 생성을 위한 프롬프트 템플릿 시스템
 * Stable Diffusion (SDXL) 최적화
 */

// 군단별 베이스 프롬프트
export const FACTION_PROMPTS = {
    machine: {
        base: "military mech robot, industrial design, metallic armor, mechanical joints,",
        styles: {
            common: "basic chassis, rusty metal, simple design, weathered appearance,",
            rare: "advanced armor plating, weapon systems, glowing energy core,",
            epic: "titan-class mech, particle effects, holographic displays, plasma weapons,",
            legendary: "god-tier war machine, apocalyptic battlefield, cinematic lighting, volumetric fog,",
            mythic: "ultimate destructor mech, reality-bending tech, cosmic energy, transcendent design,"
        },
        theme: "sci-fi military, industrial, warzone"
    },
    cyberpunk: {
        base: "futuristic cyberpunk character, neon-lit, high-tech implants, urban dystopia,",
        styles: {
            common: "simple design, basic clothing, street-level hacker,",
            rare: "enhanced cybernetics, glowing neon tattoos, advanced augmentation,",
            epic: "full-body cyborg, holographic UI overlay, plasma blade, digital wings,",
            legendary: "god-tier netrunner, reality hack effects, neon aura, matrix background,",
            mythic: "transcendent AI-human hybrid, data streams, cosmic circuitry, digital ascension,"
        },
        theme: "cyberpunk, neon lights, blade runner aesthetic"
    },
    union: {
        base: "corporate executive, business suit, holographic displays, high-tech office,",
        styles: {
            common: "standard business attire, tablet device,",
            rare: "luxury suit with tech accessories, AR glasses, gold accents,",
            epic: "CEO in powered exosuit, floating holographic charts, luxury penthouse,",
            legendary: "corporate overlord, reality-warping wealth, golden aura, cityscape throne,",
            mythic: "economic deity, money flows like rivers, infinite wealth manifestation,"
        },
        theme: "corporate sci-fi, luxury, power"
    },
    emperor: {
        base: "imperial commander, military uniform, medals, tactical display,",
        styles: {
            common: "standard officer uniform, simple insignia,",
            rare: "decorated general, advanced tactical gear, command cape,",
            epic: "supreme commander, holographic battle map, glowing command staff,",
            legendary: "god-emperor, reality-bending authority, divine light, cosmic throne,",
            mythic: "ultimate sovereign, universe-spanning empire, celestial crown, infinite armies,"
        },
        theme: "military empire, command authority, strategic power"
    },
    empire: {
        base: "dark empire soldier, black armor, red energy, intimidating presence,",
        styles: {
            common: "basic dark trooper, simple armor,",
            rare: "elite guard, enhanced armor, red glowing visor,",
            epic: "dark knight commander, plasma sword, shadow aura,",
            legendary: "shadow lord, reality-corrupting power, crimson lightning, throne of skulls,",
            mythic: "darkness incarnate, void energy, universe-consuming shadow, eternal darkness,"
        },
        theme: "dark empire, menacing, shadows and red energy"
    }
};

// 유니크 카드 전용 스타일
export const UNIQUE_STYLE_MODIFIERS = {
    artistic: "artistic interpretation, unique art style, concept art, masterpiece,",
    realistic: "hyper-realistic, photorealistic, ultra detailed, 8k resolution,",
    anime: "anime style, vibrant colors, dynamic pose, japanese animation art,",
    painting: "oil painting style, classical art, painterly brushstrokes, museum quality,",
    cinematic: "cinematic composition, movie poster style, dramatic lighting, film grain,"
};

/**
 * 카드 이미지 프롬프트 생성
 * @param faction 군단 ID
 * @param rarity 등급 (common, rare, epic, legendary, mythic, unique)
 * @param name 카드 이름
 * @param userPrompt 사용자 커스텀 프롬프트 (선택)
 * @param styleModifier 스타일 수정자 (선택)
 * @returns 완성된 프롬프트 문자열
 */
export function generateCardPrompt(
    faction: string,
    rarity: string,
    name: string,
    userPrompt?: string,
    styleModifier?: keyof typeof UNIQUE_STYLE_MODIFIERS
): string {
    const factionKey = faction.toLowerCase() as keyof typeof FACTION_PROMPTS;
    const factionData = FACTION_PROMPTS[factionKey] || FACTION_PROMPTS.cyberpunk;

    // 등급별 스타일
    const rarityKey = rarity.toLowerCase() as keyof typeof factionData.styles;
    const rarityStyle = rarity === 'unique'
        ? factionData.styles.legendary // Unique는 Legendary 스타일 베이스
        : (factionData.styles[rarityKey] || factionData.styles.common);

    // 스타일 수정자
    const styleExtra = styleModifier ? UNIQUE_STYLE_MODIFIERS[styleModifier] : '';

    // 사용자 커스텀 프롬프트 우선
    const customPart = userPrompt ? `${userPrompt}, ` : '';

    // 최종 프롬프트 조합
    const mainPrompt = `${customPart}${factionData.base} ${rarityStyle}`;
    const styleTags = `
        ${styleExtra}
        character named "${name}",
        trading card art, portrait orientation,
        magic the gathering style, digital painting,
        dramatic pose, detailed background,
        ${factionData.theme},
        ultra detailed, 4k, high quality,
        professional illustration
    `.trim().replace(/\s+/g, ' ');

    return `${mainPrompt} ${styleTags}`;
}

/**
 * 네거티브 프롬프트 (생성하지 말아야 할 요소)
 */
export const NEGATIVE_PROMPT = `
    low quality, blurry, distorted, ugly, deformed,
    bad anatomy, bad proportions, extra limbs, disfigured,
    duplicate, mutated, text, watermark, signature,
    out of frame, cropped, poor composition,
    worst quality, low resolution, jpeg artifacts,
    overexposed, underexposed, grainy
`.trim().replace(/\s+/g, ' ');

/**
 * Replicate API 파라미터 생성
 * @param prompt 메인 프롬프트
 * @param numOutputs 생성할 이미지 개수 (기본 4장)
 */
export function getReplicateParams(prompt: string, numOutputs: number = 4) {
    return {
        prompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: 768,
        height: 1152,
        num_outputs: numOutputs,
        num_inference_steps: 40,
        guidance_scale: 7.5,
        scheduler: "DPMSolverMultistep",
        refine: "expert_ensemble_refiner",
        high_noise_frac: 0.8
    };
}

/**
 * 프롬프트 프리뷰 생성 (사용자에게 보여줄 요약)
 */
export function getPromptPreview(
    faction: string,
    rarity: string,
    userPrompt?: string
): string {
    const factionKey = faction.toLowerCase() as keyof typeof FACTION_PROMPTS;
    const factionData = FACTION_PROMPTS[factionKey];

    if (!factionData) return userPrompt || "기본 프롬프트";

    const rarityKey = rarity.toLowerCase() as keyof typeof factionData.styles;
    const rarityStyle = factionData.styles[rarityKey] || factionData.styles.common;

    if (userPrompt) {
        return `${userPrompt} + ${factionData.theme} (${rarity})`;
    }

    return `${factionData.base.split(',')[0]} + ${rarityStyle.split(',')[0]}`;
}

/**
 * 예제 프롬프트 (사용자 가이드용)
 */
export const EXAMPLE_PROMPTS = {
    cyberpunk: [
        "neon-wielding hacker with digital katana",
        "street samurai with glowing cybernetic eyes",
        "netrunner surrounded by holographic code"
    ],
    machine: [
        "titan mech with dual plasma cannons",
        "stealth drone with cloaking device",
        "battle tank with energy shield"
    ],
    union: [
        "corporate assassin in powered suit",
        "CEO with reality-warping wealth",
        "business magnate controlling holograms"
    ],
    emperor: [
        "supreme commander on battlefield",
        "strategic genius with tactical displays",
        "war general with cosmic authority"
    ],
    empire: [
        "dark knight with crimson blade",
        "shadow assassin with void energy",
        "sith-like warrior with red lightning"
    ]
};

/**
 * 프롬프트 검증 (부적절한 내용 필터링)
 */
export function validatePrompt(prompt: string): { isValid: boolean; message?: string } {
    const prohibitedWords = [
        'nsfw', 'nude', 'sexual', 'violence', 'gore', 'blood',
        'racist', 'hate', 'offensive', 'explicit'
    ];

    const lowerPrompt = prompt.toLowerCase();
    const foundProhibited = prohibitedWords.find(word => lowerPrompt.includes(word));

    if (foundProhibited) {
        return {
            isValid: false,
            message: `부적절한 내용이 포함되어 있습니다: "${foundProhibited}"`
        };
    }

    if (prompt.length < 5) {
        return {
            isValid: false,
            message: "프롬프트가 너무 짧습니다. 최소 5자 이상 입력해주세요."
        };
    }

    if (prompt.length > 500) {
        return {
            isValid: false,
            message: "프롬프트가 너무 깁니다. 최대 500자까지 입력 가능합니다."
        };
    }

    return { isValid: true };
}
