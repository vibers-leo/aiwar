'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type SoundType = 'click' | 'hover' | 'success' | 'error' | 'start';

interface SoundContextType {
    playSfx: (type: SoundType) => void;
    playBgm: (bgmName: string) => void;
    isMuted: boolean;
    toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false);

    // settings 페이지의 로컬스토리지와 연동 (초기 로드)
    useEffect(() => {
        const storedSettings = localStorage.getItem('gameSettings');
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            if (settings.soundEnabled === false) {
                setIsMuted(true);
            }
        }
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newState = !prev;
            // 설정 저장 로직은 Settings 페이지와 이원화될 수 있으므로, 
            // 여기서는 Context 상태만 변경하고 실제 연동은 Settings 페이지에서 처리하거나
            // 전역 이벤트로 처리해야 함. 현재는 간단히 상태만 관리.
            return newState;
        });
    }, []);

    // List of sounds that actually exist in /public/sounds/sfx
    // Add filenames here (without extension) when you add actual files
    const AVAILABLE_SFX: string[] = ['click', 'hover', 'success', 'error', 'start'];

    // List of BGM files that exist in /public/sounds/bgm
    const AVAILABLE_BGM: string[] = [];

    const playSfx = useCallback((type: SoundType) => {
        if (isMuted) return;

        // Only attempt to play if we know the file exists to avoid console 404s
        if (!AVAILABLE_SFX.includes(type)) return;

        try {
            const audio = new Audio(`/sounds/sfx/${type}.mp3`);
            audio.volume = 0.5;
            audio.play().catch((e) => {
                // Silently handle if play is interrupted
            });
        } catch (e) {
            console.error('[Sound] Audio Error:', e);
        }
    }, [isMuted]);

    const playBgm = useCallback((bgmName: string) => {
        if (isMuted || !AVAILABLE_BGM.includes(bgmName)) return;

        try {
            const audio = new Audio(`/sounds/bgm/${bgmName}.mp3`);
            audio.loop = true;
            audio.volume = 0.3;
            audio.play().catch((e) => {
                // Silently handle
            });
        } catch (e) {
            console.error('[Sound] Audio Error:', e);
        }
    }, [isMuted]);

    return (
        <SoundContext.Provider value={{ playSfx, playBgm, isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
}
