'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandscapeGuard() {
    const [isPortrait, setIsPortrait] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            // Check if mobile/tablet (rough heuristic)
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth < 1024; // Treat tablets as mobile-ish for this purpose

            // Check orientation
            const portrait = window.innerHeight > window.innerWidth;

            setIsMobile(isTouch && isSmallScreen);
            setIsPortrait(portrait);
        };

        // Initial check
        checkOrientation();

        // Listen for changes
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    // Only show if mobile AND portrait
    const showGuard = isMobile && isPortrait;

    return (
        <AnimatePresence>
            {showGuard && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl"
                >
                    <motion.div
                        animate={{ rotate: 90 }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            repeatType: "reverse",
                            ease: "easeInOut",
                            repeatDelay: 0.5
                        }}
                        className="mb-8 p-4 bg-white/5 rounded-3xl border border-white/10"
                    >
                        <Smartphone size={64} className="text-blue-400" />
                    </motion.div>

                    <h2 className="text-2xl font-black text-white orbitron tracking-widest mb-4">
                        ROTATE DEVICE
                    </h2>

                    <p className="text-gray-400 font-mono text-sm max-w-xs leading-relaxed">
                        AGI WAR is optimized for landscape mode.<br />
                        For the best commander experience,<br />
                        please rotate your device.
                    </p>

                    <div className="mt-12 flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-150" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
