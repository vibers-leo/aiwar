import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    isDisabled?: boolean;
    delay?: number;
    allowClick?: boolean;
}

export const Tooltip = ({
    content,
    children,
    placement = 'top',
    className,
    isDisabled = false,
    delay = 0,
    allowClick = false
}: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPersistent, setIsPersistent] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updateCoords = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();

        let top = 0;
        let left = 0;

        // Space between trigger and tooltip
        const offset = 12;

        switch (placement) {
            case 'top':
                top = rect.top - offset;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + offset;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - offset;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + offset;
                break;
        }

        setCoords({ top, left });
    };

    const showTooltip = () => {
        if (isDisabled) return;
        updateCoords();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(true);
    };

    const hideTooltip = () => {
        if (isPersistent) return;
        timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 100);
    };

    const togglePersistent = (e: React.MouseEvent) => {
        if (allowClick) {
            e.stopPropagation();
            const nextState = !isPersistent;
            setIsPersistent(nextState);
            if (nextState) {
                updateCoords();
                setIsVisible(true);
            }
        }
    };

    useEffect(() => {
        if (isVisible || isPersistent) {
            window.addEventListener('scroll', updateCoords);
            window.addEventListener('resize', updateCoords);
            updateCoords(); // Initial position update when showing
        }
        return () => {
            window.removeEventListener('scroll', updateCoords);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isVisible, isPersistent]);

    const motionVariants = {
        top: { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 } },
        bottom: { initial: { opacity: 0, y: -5 }, animate: { opacity: 1, y: 0 } },
        left: { initial: { opacity: 0, x: 5 }, animate: { opacity: 1, x: 0 } },
        right: { initial: { opacity: 0, x: -5 }, animate: { opacity: 1, x: 0 } },
    };

    const placementStyles = {
        top: { transform: 'translate(-50%, -100%)' },
        bottom: { transform: 'translate(-50%, 0)' },
        left: { transform: 'translate(-100%, -50%)' },
        right: { transform: 'translate(0, -50%)' },
    };

    return (
        <div
            ref={triggerRef}
            className="relative inline-block"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onClick={togglePersistent}
        >
            {children}
            {mounted && typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {(isVisible || isPersistent) && (
                        <motion.div
                            initial={motionVariants[placement].initial}
                            animate={motionVariants[placement].animate}
                            exit={motionVariants[placement].initial}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "fixed z-[10000] px-3 py-2 text-xs font-bold text-white bg-[#050510]/95 border border-white/20 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-auto",
                                className
                            )}
                            style={{
                                top: coords.top,
                                left: coords.left,
                                ...placementStyles[placement]
                            }}
                            onMouseEnter={showTooltip}
                            onMouseLeave={hideTooltip}
                        >
                            {/* Bridge to prevent closing when moving to tooltip */}
                            <div className={cn(
                                "absolute bg-transparent",
                                placement === 'top' && "bottom-[-20px] left-0 right-0 h-[20px]",
                                placement === 'bottom' && "top-[-20px] left-0 right-0 h-[20px]",
                                placement === 'left' && "right-[-20px] top-0 bottom-0 w-[20px]",
                                placement === 'right' && "left-[-20px] top-0 bottom-0 w-[20px]",
                            )} />
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};


