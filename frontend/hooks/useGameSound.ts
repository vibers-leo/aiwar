import { useCallback, useEffect, useState } from 'react';
import SoundManager from '@/lib/sound-manager';

export function useGameSound() {
    const [manager] = useState(() => SoundManager.getInstance());

    const playSound = useCallback((soundName: string, type: 'bgm' | 'sfx' = 'sfx') => {
        // Map abstract sound names to file paths
        const soundMap: Record<string, string> = {
            'click': '/assets/sounds/sfx/click.mp3',
            'hover': '/assets/sounds/sfx/hover.mp3',
            'battle_start': '/assets/sounds/sfx/start.mp3',
            'card_play': '/assets/sounds/sfx/click.mp3',
            'attack': '/assets/sounds/sfx/attack.mp3',
            'damage': '/assets/sounds/sfx/error.mp3',
            'victory': '/assets/sounds/sfx/success.mp3',
            'defeat': '/assets/sounds/sfx/error.mp3',
            'success': '/assets/sounds/sfx/success.mp3',
            'bgm_main': '/assets/sounds/bgm/main-theme.mp3',
            'bgm_battle': '/assets/sounds/bgm/main-theme.mp3', // Temporarily same as main
            'bgm_story': '/assets/sounds/bgm/story-ambient.mp3',
            'bgm_victory': '/assets/sounds/bgm/victory.mp3',
        };

        const url = soundMap[soundName] || soundName;
        console.log(`[useGameSound] Playing ${soundName} (${type}) from ${url}`);

        const fallbackMap: Record<string, 'click' | 'attack' | 'success' | 'error' | undefined> = {
            'click': 'click',
            'hover': 'click', // Quiet click
            'attack': 'attack',
            'damage': 'error',
            'victory': 'success',
            'defeat': 'error',
            'card_play': 'click',
            'battle_start': 'success'
        };

        if (type === 'bgm') {
            manager.playBGM(soundMap[soundName] || soundName);
        } else {
            manager.playSFX(soundMap[soundName] || soundName, fallbackMap[soundName]);
        }
    }, [manager]);

    const stopBGM = useCallback(() => {
        manager.stopBGM();
    }, [manager]);

    const setVolume = useCallback((volume: number) => {
        manager.setVolume(volume);
    }, [manager]);

    return { playSound, stopBGM, setVolume };
}
