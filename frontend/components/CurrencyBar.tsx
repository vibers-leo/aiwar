'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { getSubscribedFactions } from '@/lib/faction-subscription-utils';
import { calculateRechargeParams } from '@/lib/token-system';
import styles from '@/components/CurrencyBar.module.css';

export default function CurrencyBar() {
    const { coins, tokens, maxTokens, level, user, profile } = useUser();
    const [timeUntilRecharge, setTimeUntilRecharge] = useState<string>('');
    const [rechargeRate, setRechargeRate] = useState<number>(10);
    const [rechargeInterval, setRechargeInterval] = useState<number>(10);
    const [progress, setProgress] = useState<number>(0);

    // Calculate recharge parameters based on subscriptions
    useEffect(() => {
        if (!user) return;

        const subscriptions = getSubscribedFactions(user.uid);
        const params = calculateRechargeParams(subscriptions, level);

        setRechargeRate(params.rateAmount);
        setRechargeInterval(params.intervalMin);
    }, [user, level]);

    // Calculate time until next recharge
    useEffect(() => {
        if (!profile?.lastTokenUpdate || tokens >= maxTokens) {
            setTimeUntilRecharge('');
            setProgress(100);
            return;
        }

        const updateTimer = () => {
            try {
                const lastUpdate = new Date(
                    profile.lastTokenUpdate.toDate
                        ? profile.lastTokenUpdate.toDate()
                        : profile.lastTokenUpdate
                );
                const now = new Date();
                const diffMs = now.getTime() - lastUpdate.getTime();
                const diffMin = diffMs / (1000 * 60);

                const timePassedInInterval = diffMin % rechargeInterval;
                const timeRemainingMin = rechargeInterval - timePassedInInterval;

                // Calculate progress (0-100%)
                const progressPercent = (timePassedInInterval / rechargeInterval) * 100;
                setProgress(Math.min(100, progressPercent));

                // Format time remaining
                const minutes = Math.floor(timeRemainingMin);
                const seconds = Math.floor((timeRemainingMin - minutes) * 60);
                setTimeUntilRecharge(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            } catch (err) {
                console.error('Timer calculation error:', err);
                setTimeUntilRecharge('');
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [profile, tokens, maxTokens, rechargeInterval]);

    const tokenPercentage = maxTokens > 0 ? (tokens / maxTokens) * 100 : 0;

    return (
        <div className={styles.bar}>
            {/* Coins */}
            <div className={styles.item}>
                <span className={styles.icon}>💰</span>
                <span className={styles.amount}>{coins.toLocaleString()}</span>
            </div>

            {/* Tokens with recharge info */}
            <div className={`${styles.item} ${styles.tokenItem}`}>
                <span className={styles.icon}>⚡</span>
                <div className={styles.tokenInfo}>
                    <div className={styles.tokenAmount}>
                        <span className={styles.amount}>{tokens.toLocaleString()}</span>
                        <span className={styles.maxAmount}>/{maxTokens.toLocaleString()}</span>
                    </div>

                    {tokens < maxTokens && (
                        <div className={styles.rechargeInfo}>
                            {/* Progress bar */}
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Time and rate info */}
                            <div className={styles.rechargeText}>
                                {timeUntilRecharge && (
                                    <span className={styles.timer}>{timeUntilRecharge}</span>
                                )}
                                <span className={styles.rate}>+{rechargeRate}/{rechargeInterval}분</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
