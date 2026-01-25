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
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updateCoords = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let top = 0;
        let left = 0;

        switch (placement) {
            case 'top':
                top = rect.top + scrollY - 10;
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + scrollY + 10;
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'left':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.left + scrollX - 10;
                break;
            case 'right':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.right + scrollX + 10;
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
        }
        return () => {
            window.removeEventListener('scroll', updateCoords);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isVisible, isPersistent]);

    const motionVariants = {
        top: { initial: { opacity: 0, y: 5, x: '-50%' }, animate: { opacity: 1, y: 0, x: '-50%' } },
        bottom: { initial: { opacity: 0, y: -5, x: '-50%' }, animate: { opacity: 1, y: 0, x: '-50%' } },
        left: { initial: { opacity: 0, x: 5, y: '-50%' }, animate: { opacity: 1, x: 0, y: '-50%' } },
        right: { initial: { opacity: 0, x: -5, y: '-50%' }, animate: { opacity: 1, x: 0, y: '-50%' } },
    };

    const placementClasses = {
        top: "-translate-x-1/2 -translate-y-full mb-2",
        bottom: "-translate-x-1/2 mt-2",
        left: "-translate-x-full -translate-y-1/2 mr-2",
        right: "-translate-y-1/2 ml-2",
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
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {(isVisible || isPersistent) && (
                        <motion.div
                            initial={motionVariants[placement].initial}
                            animate={motionVariants[placement].animate}
                            exit={motionVariants[placement].initial}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "fixed z-[9999] px-3 py-2 text-xs font-bold text-white bg-[#050510]/95 border border-white/20 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl pointer-events-auto",
                                "before:absolute before:inset-0 before:rounded-lg before:shadow-[0_0_15px_rgba(255,255,255,0.1)] before:pointer-events-none",
                                placementClasses[placement],
                                className
                            )}
                            style={{ top: coords.top, left: coords.left }}
                            onMouseEnter={showTooltip}
                            onMouseLeave={hideTooltip}
                        >
                            {/* The Bridge to keep hover active during gap crossing */}
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


