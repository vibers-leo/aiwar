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
            // 1. KST (UTC+9)로 변환된 타임스탬프 계산
            const kstNowMs = now.getTime() + (9 * 60 * 60 * 1000);
            const kstDate = new Date(kstNowMs);

            // 2. 목표 시간 설정 (오늘 오전 6시)
            // kstDate는 이미 9시간 Shift 되었으므로, UTC 메서드로 시간을 설정하면 KST 기준 시간이 됨
            const targetKstDate = new Date(kstNowMs);
            targetKstDate.setUTCHours(6, 0, 0, 0);

            // 3. 현재 시간이 오전 6시 이후라면 내일 오전 6시가 목표
            if (kstDate.getUTCHours() >= 6) {
                targetKstDate.setUTCDate(targetKstDate.getUTCDate() + 1);
            }

            // 4. 남은 시간 계산 (Shift된 시간끼리의 차이는 실제 지속 시간과 동일)
            const diff = targetKstDate.getTime() - kstDate.getTime();

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
