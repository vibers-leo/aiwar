
export const CHARACTER_VOICES: Record<string, string> = {
    '제미나이': 'cgS0pAt99v89p4vIicrF', // Jessica (Intelligent Female)
    'Gemini': 'cgS0pAt99v89p4vIicrF',
    '칩': '21m00Tcm4TlvDq8ikWAM',   // Rachel (Youthful/Cute)
    'Chip': '21m00Tcm4TlvDq8ikWAM',
    '일론': 'ErXw6X7Tty7B8I0Y52Vj', // Antoni (Strong Male)
    'Elon': 'ErXw6X7Tty7B8I0Y52Vj',
    '그록': 'pNInz6ob9uHq4tX9MUn7', // Josh (Sassy/Casual)
    'Grok': 'pNInz6ob9uHq4tX9MUn7',
    '샘': 'VR6Aewr9cg3z3YvAAnAy',   // Arnold (Calm Professional)
    'Sam': 'VR6Aewr9cg3z3YvAAnAy',
    '다리오': 'N2lVS1wzWy92CDRW4tp6', // Brian (Deep voice)
    'Dario': 'N2lVS1wzWy92CDRW4tp6',
    '마크': 'MF3mGyEYCl7XYW7D5u6f',  // Elli (Standard Female)
    'Mark': 'MF3mGyEYCl7XYW7D5u6f',
    '가디언': 'onwPHqze98BiCWnQUfWj', // Guardian (Robotic/Deep)
    'Guardian': 'onwPHqze98BiCWnQUfWj',
    '하사비스': 'ErXw6X7Tty7B8I0Y52Vj', // Antoni (Deep/Serious - same as Elon/Brian for now logic)
    'Hassabis': 'ErXw6X7Tty7B8I0Y52Vj',
    '코파일럿': 'cgS0pAt99v89p4vIicrF', // Jessica (Intelligent Female - same as Gemini)
    'Copilot': 'cgS0pAt99v89p4vIicrF',
    '알트먼': 'VR6Aewr9cg3z3YvAAnAy',   // Sam (Arnold)
    'Altman': 'VR6Aewr9cg3z3YvAAnAy'
};

export const getVoiceId = (speaker: string): string => {
    // Exact match or contains
    for (const [name, id] of Object.entries(CHARACTER_VOICES)) {
        if (speaker.includes(name)) return id;
    }
    return 'EXAVITQu4vr4xnSDxMaL'; // Default: Bella
};
