export type SoundType = 'bgm' | 'sfx';

class SoundManager {
    private static instance: SoundManager;
    private audioContext: AudioContext | null = null;
    private bgmAudio: HTMLAudioElement | null = null;
    private isMuted: boolean = false;
    private volume: number = 0.5;

    private missingFiles = new Set<string>();

    private constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Resume context on first user interaction if suspended
            const resumeContext = () => {
                if (this.audioContext?.state === 'suspended') {
                    this.audioContext.resume();
                }
                window.removeEventListener('click', resumeContext);
                window.removeEventListener('keydown', resumeContext);
            };
            window.addEventListener('click', resumeContext);
            window.addEventListener('keydown', resumeContext);
        }
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    public setMute(mute: boolean) {
        this.isMuted = mute;
        if (this.bgmAudio) {
            this.bgmAudio.muted = mute;
        }
    }

    public setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.volume;
        }
    }

    private currentBgmUrl: string | null = null;
    private activeBgmRequestId: number = 0;

    public async playBGM(url: string) {
        console.log(`[SoundManager] playBGM: ${url}`);

        // Prevent restarting the same BGM
        if (this.currentBgmUrl === url && this.bgmAudio && !this.bgmAudio.paused) {
            console.log(`[SoundManager] BGM already playing: ${url}`);
            return;
        }

        const requestId = Date.now();
        this.activeBgmRequestId = requestId;

        if (this.missingFiles.has(url)) {
            console.debug(`[SoundManager] Skipping missing BGM: ${url}`);
            return;
        }

        // [FIX] Check if BGM file exists before attempting to play
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (!response.ok) {
                console.warn(`[SoundManager] BGM file not found: ${url}`);
                this.missingFiles.add(url);
                return;
            }
        } catch (e) {
            console.warn(`[SoundManager] Could not check BGM file: ${url}`, e);
            this.missingFiles.add(url);
            return;
        }

        // Check cancellation (if stopBGM called or new playBGM called)
        if (this.activeBgmRequestId !== requestId) {
            console.log(`[SoundManager] BGM request cancelled: ${url}`);
            return;
        }

        this.stopBGM(); // Properly stop previous

        this.bgmAudio = new Audio(url);
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = this.volume;
        this.bgmAudio.muted = this.isMuted;
        this.currentBgmUrl = url;

        this.bgmAudio.play().catch(e => {
            console.warn('BGM play failed (autoplay policy?):', e);
        });
    }


    public stopBGM() {
        // Cancel any pending async BGM starts
        this.activeBgmRequestId = 0;
        this.currentBgmUrl = null;

        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
    }

    public playSFX(url: string, fallbackType?: 'click' | 'attack' | 'success' | 'error') {
        console.log(`[SoundManager] playSFX: ${url}`);
        if (this.isMuted) return;
        if (this.missingFiles.has(url)) {
            console.debug(`[SoundManager] Skipping missing SFX (was 404): ${url}`);
            if (fallbackType) this.playSynthSound(fallbackType);
            return;
        }

        const audio = new Audio(url);
        audio.volume = this.volume;

        audio.play().then(() => {
            console.log(`[SoundManager] Playing: ${url}`);
        }).catch((e) => {
            console.warn(`[SoundManager] SFX play failed: ${url}`, e);
            // File not found or playback error -> Fallback to synth
            // Mark as missing to assume 404 (or format issue) and skip next time to save network
            this.missingFiles.add(url);

            if (fallbackType) {
                console.log(`[SoundManager] Falling back to synth: ${fallbackType}`);
                this.playSynthSound(fallbackType);
            }
        });
    }

    // Web Audio API Synth Fallback
    private playSynthSound(type: 'click' | 'attack' | 'success' | 'error') {
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        switch (type) {
            case 'click':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
                gainNode.gain.setValueAtTime(0.1 * this.volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
            case 'attack':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.2);
                gainNode.gain.setValueAtTime(0.2 * this.volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
            case 'success':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, now); // A4
                oscillator.frequency.setValueAtTime(554, now + 0.1); // C#5
                oscillator.frequency.setValueAtTime(659, now + 0.2); // E5
                gainNode.gain.setValueAtTime(0.1 * this.volume, now);
                gainNode.gain.linearRampToValueAtTime(0.1 * this.volume, now + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                oscillator.start(now);
                oscillator.stop(now + 0.6);
                break;
            case 'error':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, now);
                oscillator.frequency.linearRampToValueAtTime(80, now + 0.3);
                gainNode.gain.setValueAtTime(0.2 * this.volume, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;
        }
    }
}

export default SoundManager;
