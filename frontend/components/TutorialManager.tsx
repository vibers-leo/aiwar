'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import UnifiedTutorialModal from '@/components/UnifiedTutorialModal';
import NicknameModal from '@/components/NicknameModal';
import UnitReceiptModal from '@/components/UnitReceiptModal'; // Import Receipt Modal
import StarterPackOpeningModal from '@/components/StarterPackOpeningModal'; // Import Opening Modal
import FactionTutorialModal from '@/components/FactionTutorialModal'; // Import Faction Tutorial Modal
import { useFooter } from '@/context/FooterContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateNickname } from '@/lib/firebase-db';
import { useFirebase } from '@/components/FirebaseProvider';
import { distributeStarterPack, InventoryCard } from '@/lib/inventory-system'; // Import Starter Pack logic
import { Card as CardType } from '@/lib/types'; // Import Card Type
import { useUser } from '@/context/UserContext';

export default function TutorialManager() {
    const pathname = usePathname();
    const { user } = useFirebase();
    const { profile, reload: reloadProfile, loading: profileLoading } = useUserProfile();
    const { refreshData, completeTutorial, inventory, loading: contextLoading } = useUser();
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [showTutorialModal, setShowTutorialModal] = useState(false);

    // New Flow States
    const [showOpeningModal, setShowOpeningModal] = useState(false); // The Crate UI
    const [showStarterPackModal, setShowStarterPackModal] = useState(false); // The Cards UI (UnitReceipt)
    const [showFactionTutorial, setShowFactionTutorial] = useState(false); // New Faction Tutorial

    const [starterCards, setStarterCards] = useState<CardType[]>([]); // Rewards
    const { showFooter, hideFooter } = useFooter();

    useEffect(() => {
        // Only trigger on Main Lobby - other pages control their own footer
        if (pathname !== '/main') {
            return;
        }

        if (!user) return;

        // Wait for profile AND global context (inventory) to load
        // This prevents the "Inventory Check" from running on empty default state
        if (profileLoading || contextLoading) return;

        // [LOGOUT GUARD / SELF-HEAL]
        // If we have a user but the flag is stuck, attempt to consume it once.
        const isPendingLogout = typeof window !== 'undefined' && localStorage.getItem('pending_logout') === 'true';
        if (isPendingLogout) {
            if (user) {
                console.warn("[TutorialManager] Stuck logout flag detected while user is logged in. Attempting self-heal.");
                const consumed = gameStorage.checkAndConsumePendingLogout();
                if (!consumed) return; // Still blocked
                // If consumed, we continue to checkOnboarding()
            } else {
                console.log("[TutorialManager] Onboarding check suppressed - Pending logout.");
                return;
            }
        }

        const checkOnboarding = async () => {
            // [DB-FIRST POLICY] Check tutorial completion from DB first
            console.log("[TutorialManager] Checking onboarding status (DB-First)...", {
                uid: user.uid,
                nickname: profile?.nickname,
                hasNickname: !!(profile?.nickname && profile.nickname !== ''),
                tutorialCompletedDB: profile?.tutorialCompleted,
                hasReceivedStarterPackDB: profile?.hasReceivedStarterPack,
                inventoryCount: inventory?.length || 0
            });

            // 1. Check if nickname is missing
            const hasNickname = profile?.nickname && profile.nickname !== '';

            if (!hasNickname) {
                console.log("[TutorialManager] Nickname missing. Triggering NicknameModal.");
                setShowNicknameModal(true);
                hideFooter();
                return;
            }

            // [DB-FIRST] Use profile.tutorialCompleted as primary source
            const isTutorialCompleted = profile?.tutorialCompleted === true;

            console.log("[TutorialManager] Tutorial Check (DB-First):", {
                uid: user.uid,
                tutorialCompleted: isTutorialCompleted,
                hasStarterPack: profile?.hasReceivedStarterPack
            });

            if (!isTutorialCompleted) {
                // [CRITICAL FIX] If user already has cards (Starter Pack claimed), do NOT show tutorial again.
                // This covers the "Refresh after Claim" edge case.
                if (inventory && inventory.length > 0) {
                    console.log("[TutorialManager] Inventory detected! User has starter pack. Auto-completing tutorial.");
                    completeTutorial(); // Updates DB
                    return;
                }

                console.log("[TutorialManager] Tutorial not completed. Triggering WelcomeTutorialModal.");
                setShowTutorialModal(true);
                hideFooter();
            } else {
                console.log("[TutorialManager] Tutorial already completed (DB).");
            }
        };

        checkOnboarding();
    }, [pathname, profile, user, profileLoading, contextLoading, hideFooter, inventory, completeTutorial]);

    const handleNicknameComplete = async (nickname: string) => {
        try {
            await updateNickname(nickname, user?.uid);
            // Wait a bit for Firebase to sync
            await new Promise(resolve => setTimeout(resolve, 500));
            await reloadProfile();
            setShowNicknameModal(false);

            // Immediately start tutorial after nickname
            setShowTutorialModal(true);
        } catch (error) {
            console.error("Failed to update nickname:", error);
        }
    };

    /**
     * Phase 1: Tutorial Close -> Distribute Pack & Show Crate
     */
    const handleTutorialClose = async () => {
        setShowTutorialModal(false);

        // Distribute Starter Pack Logic
        try {
            console.log("[TutorialManager] Distributing Starter Pack...");
            // Pass nickname for Custom Commander Card
            const rewards = await distributeStarterPack(user?.uid, profile?.nickname);
            if (rewards.length > 0) {
                setStarterCards(rewards as unknown as CardType[]);

                // [Fix] Immediately refresh inventory so user context is in sync
                await refreshData();

                // Instead of showing Receipt immediately, show the Opening Ceremony first
                setShowOpeningModal(true);
            } else {
                // Fallback if distribution fails (should rarely happen)
                finalizeTutorial();
            }
        } catch (e: any) {
            if (e.message === 'ALREADY_CLAIMED' || e.code === 'ALREADY_CLAIMED') {
                console.log("[Tutorial] Starter pack already claimed. Skipping receipt.");
                // Ensure context is synced
                await refreshData();
                finalizeTutorial();
            } else {
                console.error("[Tutorial] Claim failed:", e);
                finalizeTutorial();
            }
        }
    };

    /**
     * Phase 2: Crate Opened -> Show Cards
     */
    const handlePackOpened = () => {
        setShowOpeningModal(false);
        setShowStarterPackModal(true); // Now show the UnitReceiptModal
    };

    /**
     * Phase 3: Receipt Closed -> Start Faction Tutorial
     */
    const handleReceiptClose = () => {
        setShowStarterPackModal(false);
        // Start the Faction/Generation Tutorial
        setShowFactionTutorial(true);
    };

    /**
     * Phase 4: Faction Tutorial Closed -> Finalize All
     */
    const handleFactionTutorialClose = () => {
        setShowFactionTutorial(false);
        finalizeTutorial();
        // [Hard Refresh] To ensure all context states and subscriptions are fully finalized
        window.location.href = '/main';
    };

    const finalizeTutorial = () => {
        // [DB-FIRST] Use context's completeTutorial which updates Firebase
        completeTutorial();
        showFooter();
    };

    if (showNicknameModal) {
        return <NicknameModal onComplete={handleNicknameComplete} />;
    }

    if (showTutorialModal) {
        return <UnifiedTutorialModal onClose={handleTutorialClose} onClaim={handleTutorialClose} />;
    }

    // New: Opening Ceremony Modal
    if (showOpeningModal) {
        return <StarterPackOpeningModal onOpen={handlePackOpened} />;
    }

    if (showStarterPackModal) {
        return <UnitReceiptModal isOpen={true} onClose={handleReceiptClose} units={starterCards} />;
    }

    if (showFactionTutorial) {
        return <FactionTutorialModal onClose={handleFactionTutorialClose} />;
    }

    return null;
}
