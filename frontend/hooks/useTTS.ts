import { useState, useCallback, useEffect } from 'react';
import { getVoiceId } from '@/lib/tts-config';
import { getTypecastVoiceId } from '@/lib/typecast-config';
import TTSManager from '@/lib/tts-manager';

export function useTTS() {
    const [isPlaying, setIsPlaying] = useState(false);
    const manager = TTSManager.getInstance();

    useEffect(() => {
        const unsubscribe = manager.subscribe(setIsPlaying);
        return () => { unsubscribe(); };
    }, [manager]);

    const speak = useCallback((text: string, speaker: string) => {
        if (!text) return;

        // Configuration Logic
        const hasKorean = /[가-힣]/.test(text);
        let endpoint = '/api/tts';
        let voiceId = getVoiceId(speaker);

        if (hasKorean) {
            endpoint = '/api/tts-typecast';
            voiceId = getTypecastVoiceId(speaker);
        }

        // Calculate fallback ID synchronously here
        let fallbackVoiceId: string | undefined;
        if (hasKorean) {
            fallbackVoiceId = getVoiceId(speaker);
        }

        manager.speak(text, speaker, endpoint, voiceId, hasKorean, fallbackVoiceId);
    }, [manager]);

    const stop = useCallback(() => {
        manager.stop();
    }, [manager]);

    return { speak, stop, isPlaying };
}
