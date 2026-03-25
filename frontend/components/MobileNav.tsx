
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, ShoppingBag, BookOpen, Box, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MobileNavProps {
    onMenuToggle: () => void;
}

export default function MobileNav({ onMenuToggle }: MobileNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: '홈', path: '/main', icon: Home },
        { name: '스토리', path: '/story', icon: BookOpen },
        { name: '상점', path: '/shop', icon: ShoppingBag },
        { name: '보관함', path: '/my-cards', icon: Box },
        { name: '메뉴', path: '#menu', icon: Menu, action: onMenuToggle },
    ];

    const isCurrent = (path: string) => {
        if (path === '/main' && pathname === '/') return true;
        if (path === '#menu') return false;
        return pathname?.startsWith(path);
    };

    return (
        <div className="mobile-nav-container fixed bottom-0 left-0 right-0 z-[60] bg-[#050510]/95 backdrop-blur-xl border-t border-white/10 md:hidden pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const active = isCurrent(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                if (item.action) {
                                    item.action();
                                } else {
                                    router.push(item.path);
                                }
                            }}
                            className="relative flex flex-col items-center justify-center w-full h-full space-y-1 group"
                        >
                            {active && (
                                <motion.div
                                    layoutId="mobileNavIndicator"
                                    className="absolute top-0 w-8 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                />
                            )}
                            <item.icon
                                size={20}
                                className={cn(
                                    "transition-all duration-300",
                                    active ? "text-cyan-400 scale-110 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" : "text-gray-500 group-active:scale-95"
                                )}
                            />
                            <span className={cn(
                                "text-[10px] font-medium transition-colors duration-300",
                                active ? "text-white" : "text-gray-600"
                            )}>
                                {item.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
