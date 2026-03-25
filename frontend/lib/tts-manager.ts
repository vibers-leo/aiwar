
type TTSRequestCallback = (isPlaying: boolean) => void;

class TTSManager {
    private static instance: TTSManager;
    private currentAudio: HTMLAudioElement | null = null;
    private audioCache: Record<string, string> = {}; // text -> blobUrl
    private activeRequestId: number = 0;
    private statusListeners: Set<TTSRequestCallback> = new Set();
    private currentSpeaker: string | null = null;

    private constructor() { }

    public static getInstance(): TTSManager {
        if (!TTSManager.instance) {
            TTSManager.instance = new TTSManager();
        }
        return TTSManager.instance;
    }

    public isPlaying(): boolean {
        return !!this.currentAudio && !this.currentAudio.paused;
    }

    public async speak(text: string, speaker: string, endpoint: string, voiceId: string, isKorean: boolean, fallbackVoiceId?: string): Promise<void> {
        // Cancel previous
        this.stop();

        const requestId = Date.now();
        this.activeRequestId = requestId;
        this.currentSpeaker = speaker;
        this.notifyStatus(true); // Notify start (loading)

        const cacheKey = `${voiceId}:${text}`;

        try {
            let audioUrl = this.audioCache[cacheKey];

            if (!audioUrl) {
                // Fetch
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(isKorean ? { text, actor_id: voiceId } : { text, voiceId }),
                });

                // Check Cancellation
                if (this.activeRequestId !== requestId) return;

                if (!response.ok) {
                    if (isKorean && fallbackVoiceId) {
                        // Fallback to ElevenLabs
                        const fallbackResponse = await fetch('/api/tts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text, voiceId: fallbackVoiceId }),
                        });
                        if (this.activeRequestId !== requestId) return;
                        if (!fallbackResponse.ok) throw new Error('TTS Fallback failed');
                        const blob = await fallbackResponse.blob();
                        audioUrl = URL.createObjectURL(blob);
                    } else {
                        throw new Error('TTS failed');
                    }
                } else {
                    const blob = await response.blob();
                    audioUrl = URL.createObjectURL(blob);
                }

                if (audioUrl) this.audioCache[cacheKey] = audioUrl;
            }

            // Final Check
            if (this.activeRequestId !== requestId) return;

            const audio = new Audio(audioUrl);
            this.currentAudio = audio;

            audio.onended = () => {
                if (this.activeRequestId === requestId) {
                    this.currentAudio = null;
                    this.notifyStatus(false);
                }
            };

            await audio.play();
        } catch (error) {
            console.error('[TTSManager] Error:', error);
            if (this.activeRequestId === requestId) {
                this.currentAudio = null;
                this.notifyStatus(false);
            }
        }
    }

    public stop() {
        this.activeRequestId = 0; // Invalidate pending
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.notifyStatus(false);
    }

    public subscribe(callback: TTSRequestCallback) {
        this.statusListeners.add(callback);
        return () => { this.statusListeners.delete(callback); };
    }

    private notifyStatus(isPlaying: boolean) {
        this.statusListeners.forEach(cb => cb(isPlaying));
    }
}

export default TTSManager;
