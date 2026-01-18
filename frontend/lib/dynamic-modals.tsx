'use client';

/**
 * 🚀 Dynamic Modal Imports (Bundle Size Optimization)
 * Load modals on-demand instead of including them in the initial bundle
 * 
 * Usage:
 * const CardDetailModal = useDynamicModal('CardDetailModal');
 * or use the pre-configured lazy components below
 */

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';

// Loading placeholder for modals
const ModalLoading = () => (
    <div className= "fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" >
    <div className="flex flex-col items-center gap-4" >
        <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-white/60 text-sm font-mono" > LOADING...</span>
                </div>
                </div>
);

// ================= Pre-configured Lazy Modal Components =================

/**
 * Card Detail Modal - Shows detailed card information
 * ~15KB bundle savings by lazy loading
 */
export const LazyCardDetailModal = dynamic(
    () => import('@/components/CardDetailModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Gacha Reveal Modal - Card pack opening animation
 * ~20KB bundle savings (heavy animations)
 */
export const LazyGachaRevealModal = dynamic(
    () => import('@/components/GachaRevealModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Settings Modal - User settings
 */
export const LazySettingsModal = dynamic(
    () => import('@/components/SettingsModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Faction Selection Modal - Choose AI faction
 */
export const LazyFactionSelectionModal = dynamic(
    () => import('@/components/FactionSelectionModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Faction Lore Modal - Faction background story
 */
export const LazyFactionLoreModal = dynamic(
    () => import('@/components/FactionLoreModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Commander Profile Modal - Detailed commander view with radar chart
 * ~25KB bundle savings (includes chart library)
 */
export const LazyCommanderProfileModal = dynamic(
    () => import('@/components/CommanderProfileModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Friends Modal - Social features
 */
export const LazyFriendsModal = dynamic(
    () => import('@/components/FriendsModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Realtime Matching Modal - PVP matchmaking
 */
export const LazyRealtimeMatchingModal = dynamic(
    () => import('@/components/RealtimeMatchingModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Level Up Modal - Level up celebration
 */
export const LazyLevelUpModal = dynamic(
    () => import('@/components/LevelUpModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Card Reward Modal - Battle rewards display
 */
export const LazyCardRewardModal = dynamic(
    () => import('@/components/CardRewardModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Starter Pack Opening Modal - Starter pack reveal animation
 */
export const LazyStarterPackOpeningModal = dynamic(
    () => import('@/components/StarterPackOpeningModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Support Form Modal - User support
 */
export const LazySupportFormModal = dynamic(
    () => import('@/components/SupportFormModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Tier Select Modal - Rank selection
 */
export const LazyTierSelectModal = dynamic(
    () => import('@/components/TierSelectModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Season 1 Ending Modal - Story ending cinematic
 * ~30KB bundle savings (includes video/animation)
 */
export const LazySeason1EndingModal = dynamic(
    () => import('@/components/Season1EndingModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

/**
 * Faction Subscription Modal - Subscription management
 */
export const LazyFactionSubscriptionModal = dynamic(
    () => import('@/components/FactionSubscriptionModal'),
    {
        ssr: false,
        loading: () => <ModalLoading />
    }
);

// ================= Utility Hook for Dynamic Modals =================

/**
 * Hook to get a dynamically loaded modal component
 * 
 * @example
 * const MyModal = useDynamicModal('MyCustomModal');
 * return <MyModal isOpen={open} onClose={() => setOpen(false)} />;
 */
export function createDynamicModal<P extends object>(
    importFn: () => Promise<{ default: ComponentType<P> }>
) {
    return dynamic(importFn, {
        ssr: false,
        loading: () => <ModalLoading />,
    });
}

// ================= Preload Function =================

/**
 * Preload a modal on hover/focus for faster perceived loading
 * Use on buttons that trigger modals
 * 
 * @example
 * <button onMouseEnter={() => preloadModal('CardDetailModal')}>View Card</button>
 */
export function preloadModal(modalName: keyof typeof modalImports): void {
    modalImports[modalName]?.().catch(() => {
        // Ignore preload errors
    });
}

const modalImports = {
    CardDetailModal: () => import('@/components/CardDetailModal'),
    GachaRevealModal: () => import('@/components/GachaRevealModal'),
    SettingsModal: () => import('@/components/SettingsModal'),
    FactionSelectionModal: () => import('@/components/FactionSelectionModal'),
    FactionLoreModal: () => import('@/components/FactionLoreModal'),
    CommanderProfileModal: () => import('@/components/CommanderProfileModal'),
    FriendsModal: () => import('@/components/FriendsModal'),
    RealtimeMatchingModal: () => import('@/components/RealtimeMatchingModal'),
    LevelUpModal: () => import('@/components/LevelUpModal'),
    CardRewardModal: () => import('@/components/CardRewardModal'),
    StarterPackOpeningModal: () => import('@/components/StarterPackOpeningModal'),
    SupportFormModal: () => import('@/components/SupportFormModal'),
    TierSelectModal: () => import('@/components/TierSelectModal'),
    Season1EndingModal: () => import('@/components/Season1EndingModal'),
    FactionSubscriptionModal: () => import('@/components/FactionSubscriptionModal'),
} as const;

export default {
    LazyCardDetailModal,
    LazyGachaRevealModal,
    LazySettingsModal,
    LazyFactionSelectionModal,
    LazyFactionLoreModal,
    LazyCommanderProfileModal,
    LazyFriendsModal,
    LazyRealtimeMatchingModal,
    LazyLevelUpModal,
    LazyCardRewardModal,
    LazyStarterPackOpeningModal,
    LazySupportFormModal,
    LazyTierSelectModal,
    LazySeason1EndingModal,
    LazyFactionSubscriptionModal,
    preloadModal,
    createDynamicModal,
};
