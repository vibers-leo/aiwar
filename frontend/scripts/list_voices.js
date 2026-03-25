
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid dependency
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('ELEVENLABS_API_KEY=')) {
            apiKey = line.split('=')[1].trim();
            break;
        }
    }
}

if (!apiKey) {
    console.error('Error: ELEVENLABS_API_KEY is not set in .env.local');
    process.exit(1);
}

async function listVoices() {
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': apiKey,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error fetching voices:', error);
            return;
        }

        const data = await response.json();
        console.log('Available Voices:');
        data.voices.forEach(voice => {
            console.log(`- ${voice.name}: ${voice.voice_id} (${voice.labels?.accent || 'N/A'}, ${voice.labels?.gender || 'N/A'})`);
        });
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

listVoices();
