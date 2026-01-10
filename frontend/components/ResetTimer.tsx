'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ResetTimerProps {
    className?: string;
    showLabel?: boolean;
}

export const ResetTimer: React.FC<ResetTimerProps> = ({ className = '', showLabel = true }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();

            // 오전 6시 기준
            target.setHours(6, 0, 0, 0);

            // 현재 시간이 오전 6시 이후라면 내일 오전 6시가 목표
            if (now.getHours() >= 6) {
                target.setDate(target.getDate() + 1);
            }

            const diff = target.getTime() - now.getTime();

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const pad = (n: number) => n.toString().padStart(2, '0');
            setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={`flex items-center gap-2 font-mono text-cyan-400 ${className}`}>
            <Clock size={12} className="animate-pulse" />
            <div className="flex flex-col">
                {showLabel && <span className="text-[8px] text-gray-500 orbitron leading-none uppercase mb-1">RESET IN</span>}
                <span className="text-[10px] font-bold tracking-wider leading-none">{timeLeft}</span>
            </div>
        </div>
    );
};
