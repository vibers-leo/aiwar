'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent standard mini-infobar
            e.preventDefault();
            // Stash event for later
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleInstallClick}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all transform hover:scale-105"
            >
                <Download size={14} />
                <span className="font-orbitron tracking-wide">INSTALL APP</span>
            </motion.button>
        </AnimatePresence>
    );
}
