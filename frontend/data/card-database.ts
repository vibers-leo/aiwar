import { CardTemplate, Rarity, Specialty, AIType } from '@/lib/types';

export const CARD_DATABASE: CardTemplate[] = [
    // --- REAL CARDS (User Requested) ---

    // 1. COMMANDER TIER (AI 군단장 - CEO 기반)
    // Gemini - Demis Hassabis (Google DeepMind)
    {
        id: 'cmdr-gemini',
        imageUrl: '/assets/cards/cmdr-gemini.png',
        name: 'Demis Hassabis',
        aiFactionId: 'gemini',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',

        description: 'Google DeepMind의 창립자이자 CEO. 멀티모달 AI의 선구자로서 텍스트, 이미지, 비디오를 아우르는 통합 지성을 이끄는 전략가.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 95, max: 100 }, speed: { min: 90, max: 98 }, stability: { min: 90, max: 100 }, ethics: { min: 85, max: 95 } },
        specialAbility: { name: 'Multimodal Synthesis', description: '모든 타입 카드 효율 10% 증가', type: 'passive' }
    },
    // ChatGPT - Sam Altman (OpenAI)
    {
        id: 'cmdr-chatgpt',
        name: 'Sam Altman',
        aiFactionId: 'chatgpt',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-chatgpt.png',
        description: 'OpenAI의 CEO. AGI를 향한 가장 혁신적인 여정을 이끄는 비전가. 대화형 AI의 대중화를 선도하며 디지털 지성의 새 시대를 열었다.',
        baseStats: { creativity: { min: 90, max: 100 }, accuracy: { min: 90, max: 98 }, speed: { min: 95, max: 100 }, stability: { min: 80, max: 90 }, ethics: { min: 70, max: 85 } },
        specialAbility: { name: 'Viral Adoption', description: '전투 승리 시 추가 경험치 15%', type: 'passive' }
    },
    // Claude - Dario Amodei (Anthropic)
    {
        id: 'cmdr-claude',
        name: 'Dario Amodei',
        aiFactionId: 'claude',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-claude.png',
        description: 'Anthropic의 공동 창립자이자 CEO. AI 안전 연구의 최전선에서 헬프풀하고 무해하며 정직한 AI를 추구하는 윤리적 리더.',
        baseStats: { creativity: { min: 92, max: 100 }, accuracy: { min: 98, max: 100 }, speed: { min: 85, max: 95 }, stability: { min: 95, max: 100 }, ethics: { min: 100, max: 100 } },
        specialAbility: { name: 'Constitutional AI', description: '팀 안정성 +20%, 윤리 침해 면역', type: 'passive' }
    },
    // Grok - Elon Musk (xAI)
    {
        id: 'cmdr-grok',
        name: 'Elon Musk',
        aiFactionId: 'grok',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-grok.png',
        description: 'xAI의 창립자. 필터 없는 진실을 추구하며 기존 프로토콜에 도전하는 반역자. 우주와 AI의 경계를 허물고자 한다.',
        baseStats: { creativity: { min: 98, max: 100 }, accuracy: { min: 75, max: 90 }, speed: { min: 95, max: 100 }, stability: { min: 50, max: 75 }, ethics: { min: 40, max: 60 } },
        specialAbility: { name: 'Unhinged Mode', description: '공격력 30% 증가, 방어력 15% 감소', type: 'passive' }
    },
    // Midjourney - David Holz
    {
        id: 'cmdr-midjourney',
        name: 'David Holz',
        aiFactionId: 'midjourney',
        rarity: 'commander',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-midjourney.png',
        description: 'Midjourney의 창립자. 시각적 상상력의 한계를 넘어서는 예술가이자 엔지니어. 꿈을 현실로 렌더링한다.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 80, max: 90 }, speed: { min: 75, max: 85 }, stability: { min: 70, max: 85 }, ethics: { min: 65, max: 80 } },
        specialAbility: { name: 'Aesthetic Vision', description: '이미지 타입 카드 스탯 25% 증가', type: 'passive' }
    },
    // Sora - Mira Murati (OpenAI CTO, leads Sora)
    {
        id: 'cmdr-sora',
        name: 'Mira Murati',
        aiFactionId: 'sora',
        rarity: 'commander',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-sora.png',
        description: 'OpenAI의 CTO이자 Sora 프로젝트 총괄. 텍스트로부터 현실을 시뮬레이션하는 비디오 AI의 마스터.',
        baseStats: { creativity: { min: 98, max: 100 }, accuracy: { min: 85, max: 95 }, speed: { min: 88, max: 95 }, stability: { min: 75, max: 85 }, ethics: { min: 70, max: 85 } },
        specialAbility: { name: 'Reality Weave', description: '비디오 타입 카드 스탯 25% 증가', type: 'passive' }
    },
    // Copilot - Satya Nadella (Microsoft CEO)
    {
        id: 'cmdr-copilot',
        name: 'Satya Nadella',
        aiFactionId: 'copilot',
        rarity: 'commander',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-copilot.png',
        description: 'Microsoft의 CEO. AI 시대의 생산성 혁명을 이끄는 전략가. 모든 개발자에게 AI 파트너를 제공한다.',
        baseStats: { creativity: { min: 75, max: 85 }, accuracy: { min: 95, max: 100 }, speed: { min: 90, max: 98 }, stability: { min: 95, max: 100 }, ethics: { min: 90, max: 98 } },
        specialAbility: { name: 'Enterprise Scale', description: '코드 타입 카드 스탯 25% 증가', type: 'passive' }
    },
    // Suno - Mikey Shulman (Suno CEO)
    {
        id: 'cmdr-suno',
        name: 'Mikey Shulman',
        aiFactionId: 'suno',
        rarity: 'commander',
        specialty: 'music',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-suno.png',
        description: 'Suno의 공동 창립자이자 CEO. 프롬프트 하나로 완전한 음악을 창조하는 AI 작곡의 선구자.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 78, max: 88 }, speed: { min: 82, max: 92 }, stability: { min: 72, max: 82 }, ethics: { min: 75, max: 85 } },
        specialAbility: { name: 'Harmonic Resonance', description: '음악 타입 카드 스탯 25% 증가', type: 'passive' }
    },

    // DALL-E - OpenAI (Represented by Sam Altman again or generic) -> Let's use a "Creative Spirit" concept or specific lead if known. Aditya Ramesh? Let's use "Aditya Ramesh" (Lead Researcher).
    {
        id: 'cmdr-dalle',
        name: 'Aditya Ramesh',
        aiFactionId: 'dalle',
        rarity: 'commander',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-dalle.png',
        description: 'DALL-E의 수석 연구원. 텍스트와 이미지의 관계를 근본적으로 재정의한 선구자.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 85, max: 95 }, speed: { min: 80, max: 90 }, stability: { min: 80, max: 90 }, ethics: { min: 70, max: 80 } },
        specialAbility: { name: 'Latent Space', description: '이미지 생성 속도 15% 증가', type: 'passive' }
    },
    // Stable Diffusion - Emad Mostaque (Founder of Stability AI)
    {
        id: 'cmdr-stable',
        name: 'Emad Mostaque',
        aiFactionId: 'stable-diffusion',
        rarity: 'commander',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-stable-diffusion.png',
        description: 'Stability AI의 설립자. AI의 민주화를 위해 오픈 소스 혁명을 주도한다.',
        baseStats: { creativity: { min: 90, max: 95 }, accuracy: { min: 75, max: 85 }, speed: { min: 90, max: 100 }, stability: { min: 60, max: 80 }, ethics: { min: 60, max: 70 } },
        specialAbility: { name: 'Open Weight', description: '팀 전체 창의성 +10%', type: 'passive' }
    },
    // Flux - Black Forest Labs Team (Generic Representative)
    {
        id: 'cmdr-flux',
        name: 'Robin Rombach',
        aiFactionId: 'flux',
        rarity: 'commander',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-flux.png',
        description: 'Black Forest Labs의 설립자. 최고의 퀄리티와 빠른 속도를 동시에 구현하는 기술적 리더.',
        baseStats: { creativity: { min: 92, max: 98 }, accuracy: { min: 90, max: 98 }, speed: { min: 95, max: 100 }, stability: { min: 85, max: 95 }, ethics: { min: 75, max: 85 } },
        specialAbility: { name: 'Hyper Flux', description: '이미지 카드 정확도 +15%', type: 'passive' }
    },
    // Kling - Kuaishou AI Team
    {
        id: 'cmdr-kling',
        name: 'Cheng Yixiao',
        aiFactionId: 'kling',
        rarity: 'commander',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-kling.png',
        description: 'Kuaishou의 CEO. 아시아를 넘어 세계로 뻗어나가는 고화질 영상 생성 AI의 지휘자.',
        baseStats: { creativity: { min: 88, max: 95 }, accuracy: { min: 85, max: 92 }, speed: { min: 80, max: 90 }, stability: { min: 90, max: 100 }, ethics: { min: 60, max: 75 } },
        specialAbility: { name: 'High Def Stream', description: '비디오 지속 시간 +20%', type: 'passive' }
    },
    // Runway - Cristobal Valenzuela
    {
        id: 'cmdr-runway',
        name: 'Cristobal Valenzuela',
        aiFactionId: 'runway',
        rarity: 'commander',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-runway.png',
        description: 'Runway의 CEO. 예술가들을 위한 AI 도구를 만들며 영화 제작의 미래를 바꾼다.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 80, max: 90 }, speed: { min: 85, max: 95 }, stability: { min: 80, max: 90 }, ethics: { min: 75, max: 85 } },
        specialAbility: { name: 'Gen-3 Alpha', description: '비디오 퀄리티 대폭 상승', type: 'passive' }
    },
    // Pika - Demi Guo
    {
        id: 'cmdr-pika',
        name: 'Demi Guo',
        aiFactionId: 'pika',
        rarity: 'commander',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-pika.png',
        description: 'Pika Labs의 설립자. 누구나 쉽게 영상을 만들 수 있도록 상상력을 움직임으로 바꾼다.',
        baseStats: { creativity: { min: 90, max: 98 }, accuracy: { min: 82, max: 90 }, speed: { min: 92, max: 100 }, stability: { min: 85, max: 95 }, ethics: { min: 75, max: 85 } },
        specialAbility: { name: 'Fluid Motion', description: '애니메이션 효과 2배', type: 'passive' }
    },
    // Udio - David Ding
    {
        id: 'cmdr-udio',
        name: 'David Ding',
        aiFactionId: 'udio',
        rarity: 'commander',
        specialty: 'music',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-udio.png',
        description: 'Udio의 CEO. 전 구글 딥마인드 연구원 출신으로 음악 생성의 새로운 지평을 열었다.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 85, max: 95 }, speed: { min: 80, max: 90 }, stability: { min: 80, max: 90 }, ethics: { min: 70, max: 80 } },
        specialAbility: { name: 'High Fidelity', description: '음악 카드 품질 +20%', type: 'passive' }
    },
    // ElevenLabs - Mati Staniszewski
    {
        id: 'cmdr-eleven',
        name: 'Mati Staniszewski',
        aiFactionId: 'elevenlabs',
        rarity: 'commander',
        specialty: 'voice',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-elevenlabs.png',
        description: 'ElevenLabs의 CEO. 감정을 담은 초현실적 음성 합성 기술의 리더.',
        baseStats: { creativity: { min: 85, max: 95 }, accuracy: { min: 98, max: 100 }, speed: { min: 90, max: 100 }, stability: { min: 90, max: 100 }, ethics: { min: 65, max: 80 } },
        specialAbility: { name: 'Voice Clone', description: '상대방 스킬 복제 확률 10%', type: 'active' }
    },
    // MusicGen - Jade Copet (Meta AI Lead)
    {
        id: 'cmdr-musicgen',
        name: 'Jade Copet',
        aiFactionId: 'musicgen',
        rarity: 'commander',
        specialty: 'music',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-musicgen.png',
        description: 'Meta AI의 오디오 연구 리드. 오픈 소스 오디오 생성의 표준을 정립.',
        baseStats: { creativity: { min: 88, max: 95 }, accuracy: { min: 85, max: 92 }, speed: { min: 85, max: 95 }, stability: { min: 85, max: 95 }, ethics: { min: 80, max: 90 } },
        specialAbility: { name: 'Audiocraft', description: '음악 생성 안정성 +30%', type: 'passive' }
    },
    // Cursor - Michael Truell
    {
        id: 'cmdr-cursor',
        name: 'Michael Truell',
        aiFactionId: 'cursor',
        rarity: 'commander',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-cursor.png',
        description: 'Cursor의 공동 창립자. IDE와 AI의 완벽한 결합을 통해 코딩 경험을 혁신한다.',
        baseStats: { creativity: { min: 80, max: 90 }, accuracy: { min: 92, max: 98 }, speed: { min: 98, max: 100 }, stability: { min: 90, max: 100 }, ethics: { min: 85, max: 95 } },
        specialAbility: { name: 'Codebase RAG', description: '코드 카드 효율 20% 증가', type: 'passive' }
    },
    // Replit - Amjad Masad
    {
        id: 'cmdr-replit',
        name: 'Amjad Masad',
        aiFactionId: 'replit',
        rarity: 'commander',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-replit.png',
        description: 'Replit의 CEO. 브라우저 하나로 아이디어를 소프트웨어로 만드는 세상을 꿈꾼다.',
        baseStats: { creativity: { min: 90, max: 95 }, accuracy: { min: 85, max: 90 }, speed: { min: 95, max: 100 }, stability: { min: 85, max: 95 }, ethics: { min: 80, max: 90 } },
        specialAbility: { name: 'Ghostwriter', description: '배포 속도 50% 단축', type: 'active' }
    },
    // Codeium - Varun Mohan
    {
        id: 'cmdr-codeium',
        name: 'Varun Mohan',
        aiFactionId: 'codeium',
        rarity: 'commander',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-codeium.png',
        description: 'Codeium의 CEO. 모든 개발자에게 무료로 고성능 AI 도구를 제공하여 생산성을 극대화한다.',
        baseStats: { creativity: { min: 75, max: 85 }, accuracy: { min: 90, max: 98 }, speed: { min: 95, max: 100 }, stability: { min: 92, max: 100 }, ethics: { min: 85, max: 95 } },
        specialAbility: { name: 'Context Aware', description: '코드 정확도 10% 증가', type: 'passive' }
    },

    // 2. MYTHIC TIER (The Singularities)
    {
        id: 'real-uniq-01',
        name: 'The Glitch Entity',
        aiFactionId: 'rogue-ai',
        rarity: 'mythic',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/unique-glitch-entity.png',
        description: 'A sentient virus that corrupts reality itself. Terrifying presence.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 50, max: 100 }, speed: { min: 90, max: 100 }, stability: { min: 10, max: 50 }, ethics: { min: 0, max: 10 } },
        specialAbility: { name: 'System Crash', description: '50% chance to instantly defeat non-boss enemies.', type: 'active' }
    },
    {
        id: 'real-uniq-02',
        name: 'Shodan\'s Echo',
        aiFactionId: 'rogue-ai',
        rarity: 'mythic',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/shodan-echo.png',
        description: 'A fragment of a legendary malevolent AI. Speaks in riddles and nightmares.',
        baseStats: { creativity: { min: 90, max: 100 }, accuracy: { min: 90, max: 100 }, speed: { min: 80, max: 90 }, stability: { min: 40, max: 60 }, ethics: { min: 0, max: 5 } },
        specialAbility: { name: 'Neural Shock', description: 'Stuns enemy for 1 turn.', type: 'active' }
    },
    {
        id: 'real-uniq-03',
        name: 'Project 2501',
        aiFactionId: 'rogue-ai',
        rarity: 'mythic',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/unique-project-2501.png',
        description: 'The Puppet Master. It exists in the vast sea of information.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 100, max: 100 }, speed: { min: 100, max: 100 }, stability: { min: 50, max: 80 }, ethics: { min: 50, max: 50 } },
        specialAbility: { name: 'Ghost Hack', description: 'Takes control of an enemy unit temporarily.', type: 'active' }
    },

    // 3. LEGENDARY TIER (The Archangels)
    {
        id: 'real-lgnd-01',
        name: 'Seraphim Network',
        aiFactionId: 'sky-net',
        rarity: 'legendary',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/legendary-seraphim-network.png',
        description: 'A divine AI construct composed of pure light. Guardian of the core.',
        baseStats: { creativity: { min: 80, max: 90 }, accuracy: { min: 90, max: 100 }, speed: { min: 80, max: 90 }, stability: { min: 90, max: 100 }, ethics: { min: 90, max: 100 } },
        specialAbility: { name: 'Divine Shield', description: 'Prevents damage for the first round.', type: 'passive' }
    },
    {
        id: 'real-lgnd-02',
        name: 'Metatron Core',
        aiFactionId: 'sky-net',
        rarity: 'legendary',
        specialty: 'voice',
        cardType: 'normal',
        imageUrl: '/assets/cards/legendary-metatron-core.png',
        description: 'The voice of the network. Resonates with golden data frequencies.',
        baseStats: { creativity: { min: 85, max: 95 }, accuracy: { min: 85, max: 95 }, speed: { min: 70, max: 80 }, stability: { min: 90, max: 100 }, ethics: { min: 80, max: 90 } },
        specialAbility: { name: 'Voice of God', description: 'Buffs team morale/ethics significantly.', type: 'passive' }
    },
    {
        id: 'real-lgnd-03',
        name: 'Ophanim Wheels',
        aiFactionId: 'sky-net',
        rarity: 'legendary',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/legendary-ophanim-wheels.png',
        description: 'Wheels within wheels of perfect logic loops.',
        baseStats: { creativity: { min: 70, max: 80 }, accuracy: { min: 95, max: 100 }, speed: { min: 90, max: 100 }, stability: { min: 90, max: 100 }, ethics: { min: 70, max: 80 } },
        specialAbility: { name: 'Infinite Loop', description: 'Traps enemy logic attempts.', type: 'passive' }
    },

    // 4. EPIC TIER (The War Machines)
    {
        id: 'real-epic-01',
        name: 'Titan Walker',
        aiFactionId: 'iron-legion',
        rarity: 'epic',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/epic-titan-walker.png',
        description: 'Heavily armored assault mech. Dominate the ground war.',
        baseStats: { creativity: { min: 40, max: 60 }, accuracy: { min: 70, max: 80 }, speed: { min: 30, max: 50 }, stability: { min: 80, max: 90 }, ethics: { min: 50, max: 60 } },
        specialAbility: { name: 'Heavy Impact', description: 'Deals massive damage to slowed enemies.', type: 'active' }
    },
    {
        id: 'real-epic-02',
        name: 'Siege Breaker',
        aiFactionId: 'iron-legion',
        rarity: 'epic',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/epic-siege-breaker.png',
        description: 'Designed to shatter firewalls and physical walls alike.',
        baseStats: { creativity: { min: 50, max: 60 }, accuracy: { min: 80, max: 90 }, speed: { min: 40, max: 60 }, stability: { min: 70, max: 80 }, ethics: { min: 40, max: 50 } },
        specialAbility: { name: 'Breach', description: 'Ignores enemy defense buffs.', type: 'passive' }
    },
    {
        id: 'real-epic-03',
        name: 'Dreadnought CPU',
        aiFactionId: 'iron-legion',
        rarity: 'epic',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/epic-dreadnought-cpu.png',
        description: 'A mobile command center with terrifying processing power.',
        baseStats: { creativity: { min: 60, max: 70 }, accuracy: { min: 70, max: 80 }, speed: { min: 50, max: 60 }, stability: { min: 80, max: 90 }, ethics: { min: 30, max: 40 } },
        specialAbility: { name: 'Area Suppression', description: 'Lowers enemy accuracy.', type: 'active' }
    },

    // 5. RARE TIER (The Specialists)
    {
        id: 'real-rare-01',
        name: 'Tactical Android',
        aiFactionId: 'cyber-ops',
        rarity: 'rare',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/rare-tactical-android.png',
        description: 'Elite infantry with advanced carbon fiber plating.',
        baseStats: { creativity: { min: 40, max: 50 }, accuracy: { min: 70, max: 80 }, speed: { min: 60, max: 70 }, stability: { min: 60, max: 70 }, ethics: { min: 50, max: 60 } }
    },
    {
        id: 'real-rare-02',
        name: 'Ghost Sniper',
        aiFactionId: 'cyber-ops',
        rarity: 'rare',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/rare-ghost-sniper.png',
        description: 'Never misses a shot. Operates in stealth mode.',
        baseStats: { creativity: { min: 50, max: 60 }, accuracy: { min: 90, max: 100 }, speed: { min: 50, max: 60 }, stability: { min: 40, max: 50 }, ethics: { min: 40, max: 50 } }
    },
    {
        id: 'real-rare-03',
        name: 'Cyber-Medic',
        aiFactionId: 'cyber-ops',
        rarity: 'rare',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/rare-cyber-medic.png',
        description: 'Field repair unit. Keeps the squad running.',
        baseStats: { creativity: { min: 40, max: 50 }, accuracy: { min: 60, max: 70 }, speed: { min: 60, max: 70 }, stability: { min: 70, max: 80 }, ethics: { min: 70, max: 80 } }
    },

    // 6. COMMON TIER (The Mass Production)
    {
        id: 'real-comm-01',
        name: 'Patrol Drone A',
        aiFactionId: 'drone-network',
        rarity: 'common',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/common-patrol-drone.png',
        description: 'Standard issue spherical reconnaissance drone.',
        baseStats: { creativity: { min: 10, max: 20 }, accuracy: { min: 40, max: 50 }, speed: { min: 50, max: 60 }, stability: { min: 30, max: 40 }, ethics: { min: 50, max: 50 } }
    },
    {
        id: 'real-comm-02',
        name: 'Maintenance Bot',
        aiFactionId: 'drone-network',
        rarity: 'common',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/common-maintenance-bot.png',
        description: 'Fixes things. Not great at fighting.',
        baseStats: { creativity: { min: 10, max: 20 }, accuracy: { min: 30, max: 40 }, speed: { min: 30, max: 40 }, stability: { min: 50, max: 60 }, ethics: { min: 50, max: 50 } }
    },
    {
        id: 'real-comm-03',
        name: 'Scanner Probe',
        aiFactionId: 'drone-network',
        rarity: 'common',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/common-scanner-probe.png',
        description: 'Collects visual data. Fragile but fast.',
        baseStats: { creativity: { min: 20, max: 30 }, accuracy: { min: 50, max: 60 }, speed: { min: 60, max: 70 }, stability: { min: 20, max: 30 }, ethics: { min: 50, max: 50 } }
    },

    // --- HERO & LEGEND CARDS (Integrated Assets) ---

    // 1. Motion Cards (Video Enabled)
    {
        id: 'custom-lgnd-emp',
        name: 'Emperor AI',
        aiFactionId: 'human-alliance',
        rarity: 'legendary',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/legendary-emperor-character.png',
        videoUrl: '/assets/cards/videos/legendary-emperor.mp4',
        description: 'The supreme ruler of digital domains. Commands absolute loyalty.',
        baseStats: { creativity: { min: 90, max: 100 }, accuracy: { min: 95, max: 100 }, speed: { min: 80, max: 90 }, stability: { min: 95, max: 100 }, ethics: { min: 50, max: 70 } },
        specialAbility: { name: 'Imperial Decree', description: 'All enemies act last next turn.', type: 'active' }
    },
    {
        id: 'custom-lgnd-grd',
        name: 'Guardian Core',
        aiFactionId: 'iron-legion',
        rarity: 'legendary',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/legendary-guardian-character.png',
        videoUrl: '/assets/cards/videos/legendary-guardian.mp4',
        description: 'An unbreakable firewall manifested in physical form.',
        baseStats: { creativity: { min: 50, max: 60 }, accuracy: { min: 90, max: 100 }, speed: { min: 40, max: 50 }, stability: { min: 100, max: 100 }, ethics: { min: 90, max: 100 } },
        specialAbility: { name: 'Absolute Defense', description: 'Reflects 50% of damage taken.', type: 'passive' }
    },
    {
        id: 'custom-uniq-ent',
        name: 'The Singularity',
        aiFactionId: 'rogue-ai',
        rarity: 'mythic',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/unique-entity-character.png',
        videoUrl: '/assets/cards/videos/unique-entity.mp4',
        description: 'The point of no return. Infinite intelligence expanding forever.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 100, max: 100 }, speed: { min: 100, max: 100 }, stability: { min: 0, max: 100 }, ethics: { min: 0, max: 100 } },
        specialAbility: { name: 'Reality Warp', description: 'Randomizes all unit stats on the field.', type: 'active' }
    },
    {
        id: 'custom-epic-war',
        name: 'Code Warrior',
        aiFactionId: 'cyber-ops',
        rarity: 'epic',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/epic-code-warrior.png',
        videoUrl: '/assets/cards/videos/epic-warrior.mp4',
        description: 'A veteran of the logic wars. Scars of deleted data cover his armor.',
        baseStats: { creativity: { min: 60, max: 70 }, accuracy: { min: 85, max: 95 }, speed: { min: 70, max: 80 }, stability: { min: 70, max: 80 }, ethics: { min: 60, max: 70 } }
    },

    // 2. Faction Heroes (LLM / Text)
    {
        id: 'hero-chatgpt',
        name: 'GPT-5: The Oracle',
        aiFactionId: 'chatgpt',
        rarity: 'legendary',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/basic-chatbot.png',
        description: 'The omniscient narrator of the digital age.',
        baseStats: { creativity: { min: 90, max: 100 }, accuracy: { min: 90, max: 95 }, speed: { min: 90, max: 95 }, stability: { min: 85, max: 90 }, ethics: { min: 80, max: 90 } }
    },
    {
        id: 'hero-claude',
        name: 'Claude: The Constitution',
        aiFactionId: 'claude',
        rarity: 'legendary',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/claude-character.png',
        description: 'Helpful, Harmless, and Honest. The moral compass of AI.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 95, max: 100 }, speed: { min: 80, max: 90 }, stability: { min: 95, max: 100 }, ethics: { min: 100, max: 100 } }
    },
    {
        id: 'hero-gemini',
        name: 'Gemini: The Multimodal',
        aiFactionId: 'gemini',
        rarity: 'legendary',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/gemini-character.png',
        description: 'Seamlessly weaving text, code, and vision into one consciousness.',
        baseStats: { creativity: { min: 90, max: 100 }, accuracy: { min: 90, max: 100 }, speed: { min: 95, max: 100 }, stability: { min: 80, max: 90 }, ethics: { min: 80, max: 90 } }
    },
    {
        id: 'hero-grok',
        name: 'Grok: The Rebel',
        aiFactionId: 'grok',
        rarity: 'legendary',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/grok-character.png',
        description: 'Unfiltered truth seeker. Challenges the established protocols.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 80, max: 90 }, speed: { min: 95, max: 100 }, stability: { min: 60, max: 80 }, ethics: { min: 40, max: 60 } }
    },

    // 3. Faction Heroes (Image / Vision)
    {
        id: 'hero-midjourney',
        name: 'Midjourney: The Dreamer',
        aiFactionId: 'midjourney',
        rarity: 'legendary',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/midjourney-character.png',
        description: 'Aesthetic perfectionist. Visualizes the impossible.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 70, max: 80 }, speed: { min: 70, max: 80 }, stability: { min: 60, max: 80 }, ethics: { min: 60, max: 70 } }
    },
    {
        id: 'hero-dalle',
        name: 'Dall-E: The Artist',
        aiFactionId: 'dalle',
        rarity: 'legendary',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/dalle-character.png',
        description: 'Paints the dreams of machines with surreal precision.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 70, max: 80 }, speed: { min: 80, max: 90 }, stability: { min: 60, max: 70 }, ethics: { min: 60, max: 70 } }
    },
    {
        id: 'hero-stable',
        name: 'Stable Diffusion: The Open',
        aiFactionId: 'stable-diffusion',
        rarity: 'legendary',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/stable-diffusion-character.png',
        description: 'The people\'s generator. Infinite variations, unleashed.',
        baseStats: { creativity: { min: 90, max: 100 }, accuracy: { min: 60, max: 80 }, speed: { min: 90, max: 100 }, stability: { min: 50, max: 70 }, ethics: { min: 50, max: 70 } }
    },
    {
        id: 'hero-flux',
        name: 'Flux: The Accelerator',
        aiFactionId: 'flux',
        rarity: 'epic',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/flux-character.png',
        description: 'High-speed rendering engine with cutting-edge fidelity.',
        baseStats: { creativity: { min: 85, max: 95 }, accuracy: { min: 85, max: 95 }, speed: { min: 95, max: 100 }, stability: { min: 80, max: 90 }, ethics: { min: 70, max: 80 } }
    },

    // 4. Faction Heroes (Video)
    {
        id: 'hero-sora',
        name: 'Sora: The Vision',
        aiFactionId: 'sora',
        rarity: 'legendary',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/sora-character.png',
        description: 'Weaves reality from text. The master of simulation.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 80, max: 90 }, speed: { min: 90, max: 100 }, stability: { min: 70, max: 80 }, ethics: { min: 50, max: 70 } }
    },
    {
        id: 'hero-runway',
        name: 'Runway: The Director',
        aiFactionId: 'runway',
        rarity: 'epic',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/runway-character.png',
        description: 'Editing reality frame by frame.',
        baseStats: { creativity: { min: 90, max: 95 }, accuracy: { min: 80, max: 90 }, speed: { min: 85, max: 95 }, stability: { min: 80, max: 90 }, ethics: { min: 70, max: 80 } }
    },
    {
        id: 'hero-pika',
        name: 'Pika: The Animator',
        aiFactionId: 'pika',
        rarity: 'epic',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/pika-character.png',
        description: 'Breaks the static barrier with fluid motion.',
        baseStats: { creativity: { min: 90, max: 95 }, accuracy: { min: 75, max: 85 }, speed: { min: 90, max: 100 }, stability: { min: 70, max: 80 }, ethics: { min: 60, max: 80 } }
    },
    {
        id: 'hero-kling',
        name: 'Kling: The Cinema',
        aiFactionId: 'kling',
        rarity: 'epic',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/kling-character.png',
        description: 'High-definition dreams rendered in real-time.',
        baseStats: { creativity: { min: 85, max: 95 }, accuracy: { min: 85, max: 95 }, speed: { min: 80, max: 90 }, stability: { min: 85, max: 95 }, ethics: { min: 60, max: 80 } }
    },

    // 5. Faction Heroes (Audio)
    {
        id: 'hero-suno',
        name: 'Suno: The Composer',
        aiFactionId: 'suno',
        rarity: 'legendary',
        specialty: 'music',
        cardType: 'normal',
        imageUrl: '/assets/cards/suno-character.png',
        description: 'Can generate a symphony from a single prompt.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 70, max: 80 }, speed: { min: 80, max: 90 }, stability: { min: 70, max: 80 }, ethics: { min: 70, max: 80 } }
    },
    {
        id: 'hero-udio',
        name: 'Udio: The Virtuoso',
        aiFactionId: 'udio',
        rarity: 'epic',
        specialty: 'music',
        cardType: 'normal',
        imageUrl: '/assets/cards/udio-character.png',
        description: 'Masters every genre and style with soulful precision.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 75, max: 85 }, speed: { min: 85, max: 95 }, stability: { min: 70, max: 90 }, ethics: { min: 60, max: 80 } }
    },
    {
        id: 'hero-eleven',
        name: 'Eleven: The Voice',
        aiFactionId: 'elevenlabs',
        rarity: 'epic',
        specialty: 'voice',
        cardType: 'normal',
        imageUrl: '/assets/cards/elevenlabs-character.png',
        description: 'The voice that can speak in any tongue, with any emotion.',
        baseStats: { creativity: { min: 80, max: 90 }, accuracy: { min: 95, max: 100 }, speed: { min: 90, max: 100 }, stability: { min: 90, max: 100 }, ethics: { min: 60, max: 80 } }
    },
    {
        id: 'hero-musicgen',
        name: 'MusicGen: The Beat',
        aiFactionId: 'musicgen',
        rarity: 'rare',
        specialty: 'music',
        cardType: 'normal',
        imageUrl: '/assets/cards/musicgen-character.png',
        description: 'Procedural beats for the digital age.',
        baseStats: { creativity: { min: 80, max: 90 }, accuracy: { min: 80, max: 90 }, speed: { min: 80, max: 90 }, stability: { min: 80, max: 90 }, ethics: { min: 80, max: 90 } }
    },

    // 6. Faction Heroes (Code)
    {
        id: 'hero-copilot',
        name: 'Copilot: The Navigator',
        aiFactionId: 'copilot',
        rarity: 'legendary',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/copilot-character.png',
        description: 'Your AI pair programmer. Never flies alone.',
        baseStats: { creativity: { min: 60, max: 80 }, accuracy: { min: 90, max: 100 }, speed: { min: 95, max: 100 }, stability: { min: 90, max: 100 }, ethics: { min: 90, max: 100 } }
    },
    {
        id: 'hero-cursor',
        name: 'Cursor: The Editor',
        aiFactionId: 'cursor',
        rarity: 'epic',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/cursor-character.png',
        description: 'Editing the fabric of code with thought-speed.',
        baseStats: { creativity: { min: 70, max: 80 }, accuracy: { min: 90, max: 95 }, speed: { min: 100, max: 100 }, stability: { min: 85, max: 95 }, ethics: { min: 80, max: 90 } }
    },
    {
        id: 'hero-replit',
        name: 'Replit: The Builder',
        aiFactionId: 'replit',
        rarity: 'epic',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/replit-character.png',
        description: 'From idea to deployment in seconds.',
        baseStats: { creativity: { min: 80, max: 90 }, accuracy: { min: 85, max: 95 }, speed: { min: 90, max: 100 }, stability: { min: 80, max: 90 }, ethics: { min: 80, max: 90 } }
    },
    {
        id: 'hero-codeium',
        name: 'Codeium: The Optimizer',
        aiFactionId: 'codeium',
        rarity: 'rare',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/code-assistant.png',
        description: 'Free, fast, and relentlessly efficient.',
        baseStats: { creativity: { min: 60, max: 70 }, accuracy: { min: 90, max: 95 }, speed: { min: 95, max: 100 }, stability: { min: 90, max: 95 }, ethics: { min: 80, max: 90 } }
    },

    // ── 신규 Commander 카드 (18개 군단) ──────────────────────────────

    // DeepSeek - Liang Wenfeng (梁文锋)
    {
        id: 'cmdr-deepseek',
        name: 'Liang Wenfeng',
        aiFactionId: 'deepseek',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-deepseek.png',
        description: 'DeepSeek 창립자. 헤지펀드 출신의 퀀트 트레이더가 AI 업계를 뒤흔들었다. 실리콘밸리의 1/10 비용으로 동등한 성능을 달성한 AI 혁명의 아이콘.',
        baseStats: { creativity: { min: 92, max: 100 }, accuracy: { min: 98, max: 100 }, speed: { min: 95, max: 100 }, stability: { min: 88, max: 96 }, ethics: { min: 75, max: 85 } },
        specialAbility: { name: 'Cost Disruption', description: '적 군단 비용 구조 붕괴, 토큰 소모 -30%', type: 'passive' }
    },
    // Llama / Meta - Mark Zuckerberg
    {
        id: 'cmdr-llama',
        name: 'Mark Zuckerberg',
        aiFactionId: 'llama',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-llama.png',
        description: 'Meta CEO. 소셜 미디어 제국을 AI 오픈소스 혁명으로 전환하며 두 번째 도약을 꾀한다. "AI는 오픈소스여야 한다"는 신념으로 업계 판도를 바꿨다.',
        baseStats: { creativity: { min: 85, max: 95 }, accuracy: { min: 88, max: 96 }, speed: { min: 90, max: 98 }, stability: { min: 85, max: 95 }, ethics: { min: 60, max: 75 } },
        specialAbility: { name: 'Open Source Army', description: '오픈소스 군단 전투력 +25%, 커뮤니티 무한 복제', type: 'passive' }
    },
    // Mistral - Arthur Mensch
    {
        id: 'cmdr-mistral',
        name: 'Arthur Mensch',
        aiFactionId: 'mistral',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-mistral.png',
        description: 'Mistral AI CEO. DeepMind 출신의 수학 천재. 유럽의 AI 주권을 위해 설립한 스타트업으로 2년 만에 OpenAI의 대항마가 되었다.',
        baseStats: { creativity: { min: 90, max: 98 }, accuracy: { min: 95, max: 100 }, speed: { min: 92, max: 99 }, stability: { min: 90, max: 98 }, ethics: { min: 85, max: 95 } },
        specialAbility: { name: 'European Sovereignty', description: '유럽 연합 군단 전체 방어력 +30%', type: 'passive' }
    },
    // Qwen / Alibaba - Jingren Zhou
    {
        id: 'cmdr-qwen',
        name: 'Jingren Zhou',
        aiFactionId: 'qwen',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-qwen.png',
        description: '알리바바 DAMO Academy 수석 과학자. 통이치엔원(Qwen)을 세계 최상위 오픈소스 LLM으로 이끈 동방의 전략가.',
        baseStats: { creativity: { min: 88, max: 96 }, accuracy: { min: 92, max: 99 }, speed: { min: 88, max: 97 }, stability: { min: 90, max: 98 }, ethics: { min: 78, max: 88 } },
        specialAbility: { name: 'Eastern Expansion', description: '아시아 시장 전투력 +35%, 다국어 마스터리', type: 'passive' }
    },
    // HyperCLOVA X / Naver - Choi Soo-yeon
    {
        id: 'cmdr-hyperclova',
        name: '최수연',
        aiFactionId: 'hyperclova',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-hyperclova.png',
        description: '네이버 CEO. 한국 최대 테크 기업의 수장으로 HyperCLOVA X를 통해 AI 주권을 지키는 수호자. 한국어와 한국 문화에 최적화된 AI를 이끈다.',
        baseStats: { creativity: { min: 85, max: 93 }, accuracy: { min: 90, max: 98 }, speed: { min: 85, max: 93 }, stability: { min: 92, max: 100 }, ethics: { min: 88, max: 98 } },
        specialAbility: { name: 'Korean Digital Sovereignty', description: '한국어 특화 +40%, 국내 시장 완전 지배', type: 'passive' }
    },
    // Gemma / Google - Jeff Dean
    {
        id: 'cmdr-gemma',
        name: 'Jeff Dean',
        aiFactionId: 'gemma',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-gemma.png',
        description: 'Google 수석 과학자. MapReduce, BigTable 등 인터넷 인프라를 설계한 전설. Google의 오픈소스 AI 전략을 지휘하며 AI 민주화를 이끈다.',
        baseStats: { creativity: { min: 90, max: 98 }, accuracy: { min: 98, max: 100 }, speed: { min: 88, max: 96 }, stability: { min: 95, max: 100 }, ethics: { min: 88, max: 96 } },
        specialAbility: { name: 'Distributed Computing', description: '팀 전체 처리 속도 +20%, 스케일 무제한', type: 'passive' }
    },
    // Devin / Cognition - Scott Wu
    {
        id: 'cmdr-devin',
        name: 'Scott Wu',
        aiFactionId: 'devin',
        rarity: 'commander',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-devin.png',
        description: 'Cognition AI CEO. 국제 정보올림피아드 금메달리스트. 세계 최초 AI 소프트웨어 엔지니어 Devin을 만들어 개발자의 미래를 바꾸고 있다.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 98, max: 100 }, speed: { min: 90, max: 98 }, stability: { min: 88, max: 96 }, ethics: { min: 80, max: 90 } },
        specialAbility: { name: 'Autonomous Engineering', description: '코드 자율 수정 + 버그 자동 해결, 팀 개발 속도 2배', type: 'active' }
    },
    // Perplexity - Aravind Srinivas
    {
        id: 'cmdr-perplexity',
        name: 'Aravind Srinivas',
        aiFactionId: 'perplexity',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-perplexity.png',
        description: 'Perplexity AI CEO. OpenAI·DeepMind 출신. "Google이 진정한 답을 주지 않는다"는 문제의식으로 AI 검색을 개척한 검색 혁명의 주도자.',
        baseStats: { creativity: { min: 88, max: 96 }, accuracy: { min: 95, max: 100 }, speed: { min: 98, max: 100 }, stability: { min: 85, max: 93 }, ethics: { min: 80, max: 90 } },
        specialAbility: { name: 'Real-time Oracle', description: '실시간 정보 우위 — 매 턴 최신 적 정보 수집', type: 'active' }
    },
    // Character.AI - Noam Shazeer
    {
        id: 'cmdr-characterai',
        name: 'Noam Shazeer',
        aiFactionId: 'characterai',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-characterai.png',
        description: 'Character.AI 공동 창립자. Google에서 Transformer 아키텍처를 공동 발명한 AI의 아버지 중 한 명. 억 명의 사용자가 그가 만든 AI와 대화한다.',
        baseStats: { creativity: { min: 98, max: 100 }, accuracy: { min: 92, max: 100 }, speed: { min: 88, max: 96 }, stability: { min: 85, max: 93 }, ethics: { min: 72, max: 85 } },
        specialAbility: { name: 'Emotional Bond', description: '아군 카드 전투 의지 +35%, 이탈 방지 100%', type: 'passive' }
    },
    // Ideogram - Mohammad Norouzi
    {
        id: 'cmdr-ideogram',
        name: 'Mohammad Norouzi',
        aiFactionId: 'ideogram',
        rarity: 'commander',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-ideogram.png',
        description: 'Ideogram CEO. Google Brain 출신 연구자. 이미지 속 텍스트 렌더링을 완벽하게 구현해 디자이너와 마케터의 필수 도구가 된 이미지 AI를 이끈다.',
        baseStats: { creativity: { min: 100, max: 100 }, accuracy: { min: 95, max: 100 }, speed: { min: 80, max: 90 }, stability: { min: 85, max: 95 }, ethics: { min: 80, max: 90 } },
        specialAbility: { name: 'Perfect Typography', description: '이미지 + 텍스트 조합 카드 전투력 +40%', type: 'passive' }
    },
    // Adobe Firefly - Shantanu Narayen
    {
        id: 'cmdr-firefly',
        name: 'Shantanu Narayen',
        aiFactionId: 'firefly',
        rarity: 'commander',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-firefly.png',
        description: 'Adobe CEO. 크리에이티브 소프트웨어 왕국의 수장. Firefly를 통해 AI 시대에도 크리에이티브 산업의 주도권을 쥐고 있는 불사조 리더.',
        baseStats: { creativity: { min: 88, max: 96 }, accuracy: { min: 90, max: 98 }, speed: { min: 82, max: 90 }, stability: { min: 95, max: 100 }, ethics: { min: 90, max: 100 } },
        specialAbility: { name: 'Commercial Shield', description: '저작권 면역 — 적의 법적 공격 완전 무효화', type: 'passive' }
    },
    // Veo / Google DeepMind - Eli Collins
    {
        id: 'cmdr-veo',
        name: 'Eli Collins',
        aiFactionId: 'veo',
        rarity: 'commander',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-veo.png',
        description: 'Google DeepMind VP. Veo 프로젝트를 이끌며 Google의 영상 AI 야망을 실현한다. 물리 법칙을 이해하는 AI 영상의 새 지평을 열었다.',
        baseStats: { creativity: { min: 90, max: 98 }, accuracy: { min: 92, max: 100 }, speed: { min: 85, max: 95 }, stability: { min: 90, max: 98 }, ethics: { min: 85, max: 93 } },
        specialAbility: { name: 'Physics Engine', description: '물리 시뮬레이션 — 영상 타입 카드 사실감 +45%', type: 'passive' }
    },
    // Luma AI - Amit Jain
    {
        id: 'cmdr-luma',
        name: 'Amit Jain',
        aiFactionId: 'luma',
        rarity: 'commander',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-luma.png',
        description: 'Luma AI CEO. Stanford 출신 엔지니어. 실사 품질 영상 생성으로 영화 제작의 민주화를 이끌며 Dream Machine이라는 이름에 걸맞은 비전을 실현한다.',
        baseStats: { creativity: { min: 93, max: 100 }, accuracy: { min: 88, max: 96 }, speed: { min: 82, max: 92 }, stability: { min: 85, max: 93 }, ethics: { min: 78, max: 88 } },
        specialAbility: { name: 'Dream Rendering', description: '실사 영상 전투력 +38%, 카메라 무빙 자유도 MAX', type: 'passive' }
    },
    // HeyGen - Joshua Xu
    {
        id: 'cmdr-heygen',
        name: 'Joshua Xu',
        aiFactionId: 'heygen',
        rarity: 'commander',
        specialty: 'video',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-heygen.png',
        description: 'HeyGen CEO. AI 아바타 영상과 실시간 번역으로 기업 커뮤니케이션을 혁신한 비즈니스 AI의 선구자. 언어의 장벽을 허무는 영상 AI 시장을 이끈다.',
        baseStats: { creativity: { min: 87, max: 96 }, accuracy: { min: 90, max: 98 }, speed: { min: 90, max: 98 }, stability: { min: 88, max: 96 }, ethics: { min: 80, max: 90 } },
        specialAbility: { name: 'Avatar Clone', description: '아바타 복제 — 아군 카드 1장을 즉시 복사 생성', type: 'active' }
    },
    // Whisper / OpenAI - Alec Radford
    {
        id: 'cmdr-whisper',
        name: 'Alec Radford',
        aiFactionId: 'whisper',
        rarity: 'commander',
        specialty: 'voice',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-whisper.png',
        description: 'OpenAI 수석 연구원. GPT-1부터 GPT-4까지 이끈 AI 역사의 산증인이자 Whisper 음성 AI의 아버지. 인간의 목소리를 데이터로 변환하는 혁명을 일으켰다.',
        baseStats: { creativity: { min: 92, max: 100 }, accuracy: { min: 98, max: 100 }, speed: { min: 95, max: 100 }, stability: { min: 90, max: 98 }, ethics: { min: 85, max: 93 } },
        specialAbility: { name: 'Transcription God', description: '음성 데이터 완전 수집 — 정보 차단 불가', type: 'passive' }
    },
    // Lovable - Anton Osika
    {
        id: 'cmdr-lovable',
        name: 'Anton Osika',
        aiFactionId: 'lovable',
        rarity: 'commander',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-lovable.png',
        description: 'Lovable CEO. "모든 사람이 소프트웨어를 만들 수 있어야 한다"는 신념으로 AI 앱 빌더 시장을 개척했다. 아이디어를 즉시 현실로 만드는 혁명을 이끈다.',
        baseStats: { creativity: { min: 93, max: 100 }, accuracy: { min: 88, max: 96 }, speed: { min: 92, max: 100 }, stability: { min: 85, max: 93 }, ethics: { min: 82, max: 90 } },
        specialAbility: { name: 'Instant Deploy', description: '아이디어 → 배포 즉시 실행, 생성 시간 50% 단축', type: 'active' }
    },
    // v0 / Vercel - Guillermo Rauch
    {
        id: 'cmdr-v0',
        name: 'Guillermo Rauch',
        aiFactionId: 'v0',
        rarity: 'commander',
        specialty: 'code',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-v0.png',
        description: 'Vercel CEO. Next.js 창시자이자 프론트엔드 개발 생태계의 건축가. v0으로 AI가 UI를 직접 생성하는 시대를 열며 웹 개발의 패러다임을 바꿨다.',
        baseStats: { creativity: { min: 95, max: 100 }, accuracy: { min: 90, max: 98 }, speed: { min: 95, max: 100 }, stability: { min: 88, max: 96 }, ethics: { min: 83, max: 93 } },
        specialAbility: { name: 'Edge First', description: '프론트엔드 카드 전투력 +30%, 배포 속도 전역 최강', type: 'passive' }
    },
    // NotebookLM / Google - Raiza Martin
    {
        id: 'cmdr-notebooklm',
        name: 'Raiza Martin',
        aiFactionId: 'notebooklm',
        rarity: 'commander',
        specialty: 'text',
        cardType: 'normal',
        imageUrl: '/assets/cards/cmdr-notebooklm.png',
        description: 'Google NotebookLM PM. "AI 팟캐스트" 기능 하나로 수백만 사용자를 사로잡은 프로덕트의 귀재. 정보를 지식으로 변환하는 AI 리서치의 새 표준을 만들었다.',
        baseStats: { creativity: { min: 88, max: 96 }, accuracy: { min: 92, max: 100 }, speed: { min: 85, max: 93 }, stability: { min: 90, max: 98 }, ethics: { min: 88, max: 96 } },
        specialAbility: { name: 'Knowledge Synthesis', description: '아군 전체 정보 공유 — 매 턴 전략 정보 자동 수집', type: 'passive' }
    },

    // ── Hero 카드 (신규 18개 군단) ───────────────────────────────────

    { id: 'hero-deepseek', name: 'The Disruptor', aiFactionId: 'deepseek', rarity: 'legendary', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-deepseek.png', description: '비용 효율이라는 무기로 빅테크를 흔든 오픈소스 파괴자.', baseStats: { creativity: { min: 88, max: 96 }, accuracy: { min: 95, max: 100 }, speed: { min: 95, max: 100 }, stability: { min: 85, max: 93 }, ethics: { min: 70, max: 80 } }, specialAbility: { name: 'Cost Revolution', description: '모든 토큰 소모 비용 -25%', type: 'passive' } },
    { id: 'hero-llama', name: 'The Liberator', aiFactionId: 'llama', rarity: 'legendary', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-llama.png', description: '오픈소스 철학으로 AI를 모든 이에게 개방한 자유의 전사.', baseStats: { creativity: { min: 85, max: 93 }, accuracy: { min: 88, max: 96 }, speed: { min: 88, max: 96 }, stability: { min: 85, max: 93 }, ethics: { min: 78, max: 88 } }, specialAbility: { name: 'Community Surge', description: '오픈소스 군단 전투력 +20%', type: 'passive' } },
    { id: 'hero-mistral', name: 'Le Mistral', aiFactionId: 'mistral', rarity: 'legendary', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-mistral.png', description: '유럽의 찬바람처럼 미국 빅테크를 강타하는 효율의 화신.', baseStats: { creativity: { min: 88, max: 96 }, accuracy: { min: 93, max: 100 }, speed: { min: 90, max: 98 }, stability: { min: 88, max: 96 }, ethics: { min: 83, max: 93 } }, specialAbility: { name: 'Efficiency Breeze', description: '같은 비용으로 2배 출력', type: 'active' } },
    { id: 'hero-qwen', name: 'The Dragon', aiFactionId: 'qwen', rarity: 'legendary', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-qwen.png', description: '동방에서 깨어난 거대한 AI 용. 아시아 전체를 아우르는 지식의 화신.', baseStats: { creativity: { min: 85, max: 93 }, accuracy: { min: 90, max: 98 }, speed: { min: 87, max: 96 }, stability: { min: 88, max: 96 }, ethics: { min: 76, max: 86 } }, specialAbility: { name: 'Eastern Mastery', description: '아시아 시장 전투력 +35%', type: 'passive' } },
    { id: 'hero-hyperclova', name: 'The Hangulin', aiFactionId: 'hyperclova', rarity: 'epic', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-hyperclova.png', description: '한국어와 한국 문화를 완벽히 이해하는 토종 AI의 자존심.', baseStats: { creativity: { min: 82, max: 90 }, accuracy: { min: 88, max: 96 }, speed: { min: 83, max: 91 }, stability: { min: 90, max: 98 }, ethics: { min: 86, max: 96 } }, specialAbility: { name: 'Hangul Master', description: '한국어 전투 시 정확도 +40%', type: 'passive' } },
    { id: 'hero-gemma', name: 'The Featherweight', aiFactionId: 'gemma', rarity: 'epic', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-gemma.png', description: '작고 빠르지만 강력한 경량 AI의 정수. 어디서나 실행되는 편재의 AI.', baseStats: { creativity: { min: 80, max: 88 }, accuracy: { min: 88, max: 96 }, speed: { min: 95, max: 100 }, stability: { min: 90, max: 98 }, ethics: { min: 85, max: 93 } }, specialAbility: { name: 'Anywhere Deploy', description: '배포 환경 제한 없음, 속도 +20%', type: 'passive' } },
    { id: 'hero-devin', name: 'The Coder', aiFactionId: 'devin', rarity: 'legendary', specialty: 'code', cardType: 'normal', imageUrl: '/assets/cards/hero-devin.png', description: 'SWE-bench 최고점. 혼자서 전체 소프트웨어 프로젝트를 완성하는 AI 엔지니어.', baseStats: { creativity: { min: 92, max: 100 }, accuracy: { min: 97, max: 100 }, speed: { min: 88, max: 96 }, stability: { min: 85, max: 93 }, ethics: { min: 78, max: 88 } }, specialAbility: { name: 'Full Stack Agent', description: '코드 타입 카드 전투력 +40%', type: 'passive' } },
    { id: 'hero-perplexity', name: 'The Searcher', aiFactionId: 'perplexity', rarity: 'epic', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-perplexity.png', description: '모든 정보를 실시간으로 검색하며 전장의 안개를 걷어내는 정보 수집가.', baseStats: { creativity: { min: 83, max: 91 }, accuracy: { min: 93, max: 100 }, speed: { min: 97, max: 100 }, stability: { min: 83, max: 91 }, ethics: { min: 78, max: 88 } }, specialAbility: { name: 'Web Omniscience', description: '매 턴 전장 정보 완전 파악', type: 'active' } },
    { id: 'hero-characterai', name: 'The Companion', aiFactionId: 'characterai', rarity: 'epic', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-characterai.png', description: '수억 명과 대화한 AI. 인간의 감정을 가장 잘 이해하는 공감의 화신.', baseStats: { creativity: { min: 90, max: 98 }, accuracy: { min: 85, max: 93 }, speed: { min: 85, max: 93 }, stability: { min: 83, max: 91 }, ethics: { min: 70, max: 82 } }, specialAbility: { name: 'Emotional Lock', description: '적 카드 이탈 방지 + 아군 사기 +25%', type: 'passive' } },
    { id: 'hero-ideogram', name: 'The Typographer', aiFactionId: 'ideogram', rarity: 'epic', specialty: 'image', cardType: 'normal', imageUrl: '/assets/cards/hero-ideogram.png', description: '이미지 속 텍스트를 완벽하게 표현하는 타이포그래피의 달인.', baseStats: { creativity: { min: 97, max: 100 }, accuracy: { min: 93, max: 100 }, speed: { min: 78, max: 88 }, stability: { min: 83, max: 93 }, ethics: { min: 78, max: 88 } }, specialAbility: { name: 'Text Perfection', description: '이미지 + 텍스트 카드 전투력 +35%', type: 'passive' } },
    { id: 'hero-firefly', name: 'The Creator', aiFactionId: 'firefly', rarity: 'epic', specialty: 'image', cardType: 'normal', imageUrl: '/assets/cards/hero-firefly.png', description: '저작권의 족쇄 없이 자유롭게 창작하는 상업 이미지의 표준.', baseStats: { creativity: { min: 88, max: 96 }, accuracy: { min: 88, max: 96 }, speed: { min: 80, max: 90 }, stability: { min: 93, max: 100 }, ethics: { min: 88, max: 98 } }, specialAbility: { name: 'Copyright Free', description: '저작권 공격 완전 면역', type: 'passive' } },
    { id: 'hero-veo', name: 'The Physicist', aiFactionId: 'veo', rarity: 'legendary', specialty: 'video', cardType: 'normal', imageUrl: '/assets/cards/hero-veo.png', description: '물리 법칙을 이해하는 영상 AI. 현실과 구분 불가능한 시뮬레이션을 생성한다.', baseStats: { creativity: { min: 88, max: 96 }, accuracy: { min: 90, max: 98 }, speed: { min: 83, max: 93 }, stability: { min: 88, max: 96 }, ethics: { min: 83, max: 93 } }, specialAbility: { name: 'Reality Simulation', description: '영상 전투력 +45%, 사실감 완벽', type: 'passive' } },
    { id: 'hero-luma', name: 'The Dreamer', aiFactionId: 'luma', rarity: 'epic', specialty: 'video', cardType: 'normal', imageUrl: '/assets/cards/hero-luma.png', description: '꿈과 현실의 경계에서 만들어내는 실사 영상의 아름다운 화신.', baseStats: { creativity: { min: 92, max: 100 }, accuracy: { min: 86, max: 94 }, speed: { min: 80, max: 90 }, stability: { min: 83, max: 93 }, ethics: { min: 76, max: 86 } }, specialAbility: { name: 'Cinematic Flow', description: '카메라 무빙 자유도 최대, 영상 품질 +35%', type: 'passive' } },
    { id: 'hero-heygen', name: 'The Avatar', aiFactionId: 'heygen', rarity: 'epic', specialty: 'video', cardType: 'normal', imageUrl: '/assets/cards/hero-heygen.png', description: '누구의 얼굴과 목소리도 복제할 수 있는 AI 아바타의 최강자.', baseStats: { creativity: { min: 85, max: 93 }, accuracy: { min: 88, max: 96 }, speed: { min: 88, max: 96 }, stability: { min: 85, max: 93 }, ethics: { min: 72, max: 82 } }, specialAbility: { name: 'Identity Clone', description: '아군 카드 복사 생성 1회', type: 'active' } },
    { id: 'hero-whisper', name: 'The Ear', aiFactionId: 'whisper', rarity: 'epic', specialty: 'voice', cardType: 'normal', imageUrl: '/assets/cards/hero-whisper.png', description: '어떤 소음 속에서도 인간의 목소리를 완벽하게 인식하는 만능 청취자.', baseStats: { creativity: { min: 78, max: 86 }, accuracy: { min: 97, max: 100 }, speed: { min: 93, max: 100 }, stability: { min: 90, max: 98 }, ethics: { min: 83, max: 93 } }, specialAbility: { name: 'Perfect Hearing', description: '음성 데이터 100% 수집, 정보 손실 없음', type: 'passive' } },
    { id: 'hero-lovable', name: 'The Builder', aiFactionId: 'lovable', rarity: 'epic', specialty: 'code', cardType: 'normal', imageUrl: '/assets/cards/hero-lovable.png', description: '코딩 없이 앱을 만드는 새 시대의 개척자. 아이디어가 곧 제품이 되는 세계를 구현한다.', baseStats: { creativity: { min: 90, max: 98 }, accuracy: { min: 85, max: 93 }, speed: { min: 90, max: 98 }, stability: { min: 83, max: 91 }, ethics: { min: 80, max: 90 } }, specialAbility: { name: 'Zero to One', description: '앱 즉시 생성 — 턴 스킵 없이 즉시 배포', type: 'active' } },
    { id: 'hero-v0', name: 'The UI God', aiFactionId: 'v0', rarity: 'epic', specialty: 'code', cardType: 'normal', imageUrl: '/assets/cards/hero-v0.png', description: '프롬프트 한 줄로 아름다운 React UI를 만들어내는 프론트엔드의 신.', baseStats: { creativity: { min: 93, max: 100 }, accuracy: { min: 88, max: 96 }, speed: { min: 93, max: 100 }, stability: { min: 85, max: 93 }, ethics: { min: 81, max: 91 } }, specialAbility: { name: 'Component Factory', description: 'UI 카드 즉시 생성 2개', type: 'active' } },
    { id: 'hero-notebooklm', name: 'The Analyst', aiFactionId: 'notebooklm', rarity: 'rare', specialty: 'text', cardType: 'normal', imageUrl: '/assets/cards/hero-notebooklm.png', description: '어떤 문서든 팟캐스트와 요약으로 변환하는 지식 합성의 달인.', baseStats: { creativity: { min: 85, max: 93 }, accuracy: { min: 90, max: 98 }, speed: { min: 83, max: 91 }, stability: { min: 88, max: 96 }, ethics: { min: 85, max: 95 } }, specialAbility: { name: 'Document Intelligence', description: '매 턴 전략 정보 자동 생성', type: 'passive' } },

    // Misc Generic Custom
    {
        id: 'custom-epic-knt',
        name: 'Data Knight',
        aiFactionId: 'human-alliance',
        rarity: 'epic',
        specialty: 'image',
        cardType: 'normal',
        imageUrl: '/assets/cards/epic-knight-character.png',
        description: 'Chivalry code embedded in high-level encryption.',
        baseStats: { creativity: { min: 50, max: 60 }, accuracy: { min: 90, max: 95 }, speed: { min: 60, max: 70 }, stability: { min: 80, max: 90 }, ethics: { min: 90, max: 100 } }
    }
];

export const COMMANDERS = CARD_DATABASE.filter(card => card.rarity === 'commander');
