'use client';

import { useState, createContext, useContext, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import GameSidebar from './GameSidebar';
import GameTopBar from './GameTopBar';
import MobileNav from './MobileNav'; // [NEW]
import dynamic from 'next/dynamic';

// Loading placeholder for hydration
const LoadingPlaceholder = () => (
    <div className="animate-pulse flex items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
);

const DynamicFooter = dynamic(() => import('@/components/DynamicFooter'), {
    ssr: false,
    loading: () => <LoadingPlaceholder />,
});

// [NEW] Unified Tutorial Manager
const TutorialManager = dynamic(() => import('@/components/TutorialManager'), {
    ssr: false,
    loading: () => null, // TutorialManager should not show loading state
});

import { useFooter } from '@/context/FooterContext';
import { cn } from '@/lib/utils';

// Context for sidebar state
const SidebarContext = createContext<{
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}>({
    isCollapsed: false,
    setIsCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { state: footerState } = useFooter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // [NEW] Lifted State

    // Pages that should be 100% full page without any layout
    const isNoLayout = !pathname ||
        ['/login', '/signup', '/', '/start'].includes(pathname) ||
        pathname.startsWith('/battle');

    // Pages that should have header but NO sidebar
    // const hideSidebar = pathname?.startsWith('/story'); // Reverted based on user feedback
    const hideSidebar = false;

    if (isNoLayout) {
        return <div className="h-screen w-screen overflow-hidden bg-black">{children}</div>;
    }

    return (
        <div
            className="flex h-screen overflow-hidden bg-black"
        >
            {/* 메인 영역 */}
            <div
                className={cn(
                    "flex-1 flex flex-col transition-all duration-300 ease-out relative z-30",
                    !hideSidebar && "md:mr-[240px] mr-0"
                )}
            >
                {/* 상단 바 */}
                <GameTopBar
                    sidebarCollapsed={false}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                />

                {/* 컨텐츠 */}
                <main
                    id="main-content"
                    className={cn(
                        "flex-1 overflow-y-auto overflow-x-hidden relative mt-16 bg-gradient-to-br from-[#050510] via-[#0a0a1a] to-[#050510] scroll-smooth",
                        footerState.visible && "pb-[160px]" // 푸터가 보일 때 하단 여백 추가
                    )}
                >
                    <TutorialManager />
                    <Suspense fallback={<LoadingPlaceholder />}>
                        {children}
                    </Suspense>

                    {/* Dynamic Footer - Only renders when FooterContext.visible is true */}
                    <div className="hidden md:block">
                        <DynamicFooter />
                    </div>
                    {/* Mobile Footer Spacer */}
                    <div className="h-20 md:hidden" />
                </main>

                {/* Mobile Navigation */}
                <MobileNav onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
            </div>

            {/* 사이드바 (우측 고정) - 데스크탑 전용 */}
            {!hideSidebar && (
                <div className="hidden md:block relative z-40">
                    <GameSidebar />
                </div>
            )}
        </div>
    );
}
