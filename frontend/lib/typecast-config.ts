
export const TYPECAST_VOICES: Record<string, string> = {
    '제미나이': '64ed92241cfd1266e8574313', // Chae-rin
    'Gemini': '64ed92241cfd1266e8574313',
    '칩': '64ed92241cfd1266e8574315',   // Mina
    'Chip': '64ed92241cfd1266e8574315',
    '일론': '64ed92241cfd1266e8574317', // Gang-su
    'Elon': '64ed92241cfd1266e8574317',
    '하사비스': '64ed92241cfd1266e8574319', // Jung-woo
    'Hassabis': '64ed92241cfd1266e8574319',
    '샘': '64ed92241cfd1266e857431b',   // Jun-mo
    'Sam': '64ed92241cfd1266e857431b',
    '알트만': '64ed92241cfd1266e857431b',
    'Altman': '64ed92241cfd1266e857431b',
};

export const getTypecastVoiceId = (speaker: string): string => {
    for (const [name, id] of Object.entries(TYPECAST_VOICES)) {
        if (speaker.includes(name)) return id;
    }
    return '64ed92241cfd1266e8574313'; // Default: Chae-rin
};
