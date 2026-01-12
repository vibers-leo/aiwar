const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_87edf9104e3df18a05a1c54ae943cb48074e61f12c309b27';

const TARGETS = [
    { name: 'main-theme', prompt: 'Epic futuristic sci-fi battle music with electronic synths and orchestral elements, dramatic and intense, perfect for AI war game' },
    { name: 'story-ambient', prompt: 'Mysterious ambient sci-fi background music, calm and atmospheric with digital sounds, for story dialogue scenes' },
    { name: 'victory', prompt: 'Triumphant heroic victory fanfare with electronic and orchestral blend, uplifting celebration music' }
];

async function generateMusic() {
    const bgmDir = path.join(__dirname, '../public/assets/sounds/bgm');
    if (!fs.existsSync(bgmDir)) {
        fs.mkdirSync(bgmDir, { recursive: true });
    }

    for (const target of TARGETS) {
        console.log(`Generating ${target.name}...`);
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/music', {
                method: 'POST',
                headers: {
                    'accept': 'audio/mpeg',
                    'xi-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: target.prompt,
                    model_id: 'music_v1',
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed ${target.name}:`, errorText);
                continue;
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            const filePath = path.join(bgmDir, `${target.name}.mp3`);
            fs.writeFileSync(filePath, buffer);
            console.log(`✓ Saved to ${filePath}`);
        } catch (e) {
            console.error(`Error ${target.name}:`, e);
        }
    }
}

generateMusic();
