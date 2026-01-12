
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let API_KEY = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('ELEVENLABS_API_KEY=')) {
            API_KEY = line.split('=')[1].trim();
            break;
        }
    }
}

const TARGETS = [
    { name: 'click', prompt: 'a clean high-tech digital interface button click sound, short and crisp' },
    { name: 'hover', prompt: 'a subtle soft digital UI hover sound, futuristic' },
    { name: 'success', prompt: 'a positive rewarding sci-fi notification sound for success' },
    { name: 'error', prompt: 'a short low-pitch digital buzz for error' },
    { name: 'start', prompt: 'a powerful cinematic sci-fi game start sound effect' },
    { name: 'attack', prompt: 'a sharp sci-fi energy blast or laser hit sound' },
    { name: 'levelup', prompt: 'a triumphant rising digital melody for level up' }
];

async function generateAll() {
    const sfxDir = path.join(__dirname, '../public/assets/sounds/sfx');
    if (!fs.existsSync(sfxDir)) {
        fs.mkdirSync(sfxDir, { recursive: true });
    }

    for (const target of TARGETS) {
        console.log(`Generating ${target.name}...`);
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
                method: 'POST',
                headers: {
                    'accept': 'audio/mpeg',
                    'xi-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: target.prompt,
                    duration_seconds: 1.0,
                }),
            });

            if (!response.ok) {
                console.error(`Failed ${target.name}:`, await response.json());
                continue;
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            const filePath = path.join(sfxDir, `${target.name}.mp3`);
            fs.writeFileSync(filePath, buffer);
            console.log(`Saved to ${filePath}`);
        } catch (e) {
            console.error(`Error ${target.name}:`, e);
        }
    }
}

generateAll();
