'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GlitchEffectProps {
    intensity?: 'low' | 'medium' | 'high';
    color?: 'red' | 'blue' | 'cyan';
    children?: React.ReactNode;
}

/**
 * Scene 1용 글리치 효과 컴포넌트
 * 노이즈, 스캔라인, 글리치 기호 등을 표현
 */
export default function GlitchEffect({
    intensity = 'medium',
    color = 'red',
    children
}: GlitchEffectProps) {
    const [glitchSymbols, setGlitchSymbols] = useState<Array<{ id: number; x: number; y: number; symbol: string }>>([]);

    useEffect(() => {
        const symbols = ['█', '▓', '▒', '░', '▀', '▄', '■', '□', '▪', '▫'];
        const count = intensity === 'high' ? 30 : intensity === 'medium' ? 20 : 10;

        const newSymbols = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
        }));

        setGlitchSymbols(newSymbols);

        const interval = setInterval(() => {
            setGlitchSymbols(prev =>
                prev.map(s => ({
                    ...s,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    symbol: symbols[Math.floor(Math.random() * symbols.length)],
                }))
            );
        }, 150);

        return () => clearInterval(interval);
    }, [intensity]);

    const colorClasses = {
        red: 'text-red-500',
        blue: 'text-blue-500',
        cyan: 'text-cyan-500',
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Static Noise Background */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    animation: 'noise 0.2s steps(10) infinite',
                }}
            />

            {/* Scanlines */}
            <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                    background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)',
                }}
            />

            {/* Glitch Symbols */}
            {glitchSymbols.map(({ id, x, y, symbol }) => (
                <motion.div
                    key={id}
                    className={`absolute font-mono text-2xl ${colorClasses[color]} opacity-30 pointer-events-none`}
                    style={{
                        left: `${x}%`,
                        top: `${y}%`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 0.3, repeat: Infinity, repeatDelay: Math.random() * 2 }}
                >
                    {symbol}
                </motion.div>
            ))}

            {/* Horizontal Glitch Lines */}
            <motion.div
                className={`absolute left-0 right-0 h-1 ${color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : 'bg-cyan-500'} opacity-50`}
                animate={{
                    top: ['0%', '100%'],
                    opacity: [0, 0.5, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Content */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>

            {/* CSS Animation for Noise */}
            <style jsx>{`
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
        }
      `}</style>
        </div>
    );
}
