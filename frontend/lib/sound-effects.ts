// Web Audio API를 사용한 레트로 사운드 효과 (별도 파일 필요 없음)
// 브라우저 자체 기능만으로 8-bit 스타일 효과음을 생성합니다.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isMuted = false;
let isInitialized = false;

// 오디오 컨텍스트 초기화 (사용자 클릭 시 필요)
export const initAudio = () => {
    if (typeof window === 'undefined') return false;
    if (isInitialized && audioCtx) return true;

    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('[Sound] AudioContext not supported');
                return false;
            }

            audioCtx = new AudioContextClass();
            masterGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);
            masterGain.gain.value = 0.3; // 기본 볼륨
            isInitialized = true;

            console.log('[Sound] Audio system initialized successfully');
        }

        // suspended 상태면 resume 시도
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(err => {
                console.warn('[Sound] Failed to resume AudioContext:', err);
            });
        }

        return true;
    } catch (error) {
        console.error('[Sound] Failed to initialize audio:', error);
        return false;
    }
};

/**
 * 앱 시작 시 안전하게 오디오 시스템 준비
 * 사용자 제스처 없이도 초기화 시도 (suspended 상태로 시작)
 */
export const setupAudioSystem = () => {
    if (typeof window === 'undefined') return;

    // 첫 사용자 인터랙션 시 자동 초기화
    const autoInit = () => {
        if (!isInitialized) {
            initAudio();
            // 초기화 성공 후 리스너 제거
            if (isInitialized) {
                ['click', 'touchstart', 'keydown'].forEach(event => {
                    document.removeEventListener(event, autoInit);
                });
            }
        }
    };

    // 다양한 사용자 제스처 이벤트에 리스너 등록
    ['click', 'touchstart', 'keydown'].forEach(event => {
        document.addEventListener(event, autoInit, { once: true });
    });

    console.log('[Sound] Audio system ready - waiting for user interaction');
};

export const toggleMute = () => {
    isMuted = !isMuted;
    if (masterGain) {
        masterGain.gain.value = isMuted ? 0 : 0.3;
    }
    return isMuted;
};

export const getMuteState = () => isMuted;

// 1. 클릭/선택 사운드 (틱!)
export const playClick = () => {
    if (!audioCtx && !isMuted) initAudio();
    if (!audioCtx || isMuted) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
};

// 2. 베팅/코인 사운드 (띠링!)
export const playBet = () => {
    if (!audioCtx && !isMuted) initAudio();
    if (!audioCtx || isMuted) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(1800, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
};

// 3. 전투 시작/충돌 (쿵!)
export const playClash = () => {
    if (!audioCtx && !isMuted) initAudio();
    if (!audioCtx || isMuted) return;

    // 노이즈 (폭발음)
    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = audioCtx.createGain();

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain!);

    noiseGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    noise.start();
};

// 4. 승리 (빠라바밤!)
export const playWin = () => {
    if (!audioCtx && !isMuted) initAudio();
    if (!audioCtx || isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; // C Major Arpeggio
    let time = audioCtx.currentTime;

    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(masterGain!);

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        osc.start(time);
        osc.stop(time + 0.2);

        time += 0.1;
    });
};

// 5. 패배 (띠로리...)
export const playLose = () => {
    if (!audioCtx && !isMuted) initAudio();
    if (!audioCtx || isMuted) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 1.0);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.0);
};

// 6. 채팅 알림 (뽁!)
export const playChat = () => {
    if (!audioCtx && !isMuted) initAudio();
    if (!audioCtx || isMuted) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
};
