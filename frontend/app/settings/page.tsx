'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { storage } from '@/lib/utils';
import {
    initializeTimers,
    toggleAutoGeneration,
    getAllTimerStatus,
    formatTime
} from '@/lib/automation-utils';
import { getGameState } from '@/lib/game-state';
import CyberPageLayout from '@/components/CyberPageLayout';
import { useTranslation } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { useAlert } from '@/context/AlertContext';
import { Zap } from 'lucide-react';

export default function SettingsPage() {
    const { t, language, setLanguage } = useTranslation();
    const { isAdmin } = useUser();
    const { showAlert } = useAlert();
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [musicEnabled, setMusicEnabled] = useState(true);
    const [autoGenerationEnabled, setAutoGenerationEnabled] = useState(false);
    const [timerStatus, setTimerStatus] = useState<any[]>([]);

    useEffect(() => {
        const settings = storage.get('gameSettings', {
            sound: true,
            music: true,
            autoGeneration: false,
        });
        setSoundEnabled(settings.sound);
        setMusicEnabled(settings.music);
        setAutoGenerationEnabled(settings.autoGeneration || false);

        // 타이머 초기화 및 상태 로드
        initializeTimers();
        loadTimerStatus();
    }, []);

    const loadTimerStatus = () => {
        const status = getAllTimerStatus();
        setTimerStatus(status);
    };

    const saveSettings = () => {
        storage.set('gameSettings', {
            sound: soundEnabled,
            music: musicEnabled,
            autoGeneration: autoGenerationEnabled,
        });
        showAlert({
            title: '설정 저장',
            message: '설정이 저장되었습니다!',
            type: 'success'
        });
    };

    const handleAutoGenerationToggle = (enabled: boolean) => {
        setAutoGenerationEnabled(enabled);

        // 모든 군단의 자동 생성 활성화/비활성화
        const state = getGameState();
        for (const factionId of state.unlockedFactions) {
            toggleAutoGeneration(factionId, enabled);
        }

        loadTimerStatus();
    };

    const resetData = () => {
        showAlert({
            title: '데이터 초기화',
            message: '모든 자원과 카드를 초기화하시겠습니까?',
            type: 'warning',
            confirmText: '확인',
            cancelText: '취소',
            onConfirm: () => {
                localStorage.clear();
                showAlert({
                    title: '초기화 완료',
                    message: '데이터가 초기화되었습니다. 페이지를 새로고침합니다.',
                    type: 'info'
                });
                setTimeout(() => window.location.reload(), 1500);
            }
        });
    };

    return (
        <CyberPageLayout
            title="시스템 설정"
            englishTitle="CONFIGURATION"
            description="게임 환경을 최적화하고 계정을 관리하세요."
            color="blue"
        >
            {/* 언어 설정 (New) */}
            <div className="card p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    🌐 {t('settings.language')}
                </h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => setLanguage('ko')}
                        className={`flex-1 py-4 rounded-lg font-bold transition-all ${language === 'ko'
                            ? 'bg-[var(--primary-blue)] text-black shadow-[0_0_15px_rgba(0,217,255,0.5)]'
                            : 'bg-[var(--dark-overlay)] text-[var(--text-secondary)] hover:bg-white/10'
                            }`}
                    >
                        🇰🇷 한국어
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-4 rounded-lg font-bold transition-all ${language === 'en'
                            ? 'bg-[var(--primary-purple)] text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                            : 'bg-[var(--dark-overlay)] text-[var(--text-secondary)] hover:bg-white/10'
                            }`}
                    >
                        🇺🇸 English
                    </button>
                </div>
            </div>

            {/* 자동화 설정 */}
            <div className="card p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    🤖 {t('settings.automation')}
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[var(--dark-overlay)] rounded-lg">
                        <div>
                            <h3 className="font-bold mb-1">{t('settings.automation')}</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {t('settings.automation.desc')}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoGenerationEnabled}
                                onChange={(e) => handleAutoGenerationToggle(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-blue)]"></div>
                        </label>
                    </div>

                    {autoGenerationEnabled && timerStatus.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="font-bold text-sm mb-2">{t('settings.activeTimers')}</h4>
                            {timerStatus.map((timer) => (
                                <div
                                    key={timer.factionId}
                                    className="p-3 bg-[var(--dark-overlay)] rounded-lg"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold">{timer.factionId}</span>
                                        <span className="text-xs text-[var(--text-secondary)]">
                                            {timer.enabled ? `${t('settings.nextGen')}: ${formatTime(timer.timeUntilNext)}` : t('settings.disabled')}
                                        </span>
                                    </div>
                                    {timer.enabled && (
                                        <div className="w-full h-2 bg-[var(--dark-bg)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[var(--primary-blue)] to-[var(--primary-purple)]"
                                                style={{ width: `${timer.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 게임 정보 */}
            <div className="card p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    ℹ️ {t('settings.gameInfo')}
                </h2>
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex justify-between">
                        <span>{t('settings.version')}</span>
                        <span className="font-bold">v1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('settings.developer')}</span>
                        <span className="font-bold">AI WAR Team</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('settings.lastUpdate')}</span>
                        <span className="font-bold">2025-12-14</span>
                    </div>
                </div>
            </div>

            {/* 데이터 관리 */}
            <div className="card p-6 mb-6 border-2 border-[var(--accent-red)]">
                <h2 className="text-2xl font-bold mb-6 text-[var(--accent-red)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    ⚠️ {t('settings.dataManagement')}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    {t('settings.resetWarning')}
                </p>
                <button
                    onClick={resetData}
                    className="btn bg-[var(--accent-red)] hover:bg-red-700 text-white w-full"
                >
                    {t('settings.resetData')}
                </button>
            </div>

            {/* 도움말 */}
            <div className="card p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    💡 {t('settings.help')}
                </h2>
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                    <div>
                        <h3 className="font-bold text-white mb-1">{t('settings.help.start')}</h3>
                        <p>{t('settings.help.startDesc')}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-1">{t('settings.help.battle')}</h3>
                        <p>{t('settings.help.battleDesc')}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-1">{t('settings.help.enhance')}</h3>
                        <p>{t('settings.help.enhanceDesc')}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-1">{t('settings.help.fusion')}</h3>
                        <p>{t('settings.help.fusionDesc')}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-1">{t('settings.help.auto')}</h3>
                        <p>{t('settings.help.autoDesc')}</p>
                    </div>
                </div>
            </div>

            {/* Admin Section (Removed) */}
        </CyberPageLayout>
    );
}
