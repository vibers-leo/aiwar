'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import UnifiedTutorialModal from '@/components/UnifiedTutorialModal';
import NicknameModal from '@/components/NicknameModal';
import UnitReceiptModal from '@/components/UnitReceiptModal'; // Import Receipt Modal
import StarterPackOpeningModal from '@/components/StarterPackOpeningModal'; // Import Opening Modal
import FactionTutorialModal from '@/components/FactionTutorialModal'; // Import Faction Tutorial Modal
import { useFooter } from '@/context/FooterContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateNickname, claimStarterPackTransaction } from '@/lib/firebase-db';
import { useFirebase } from '@/components/FirebaseProvider';
import { InventoryCard } from '@/lib/inventory-system'; // Import Inventory types
import { Card as CardType } from '@/lib/types'; // Import Card Type
import { useUser } from '@/context/UserContext';
import { gameStorage } from '@/lib/game-storage';

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
    const [isProcessing, setIsProcessing] = useState(false); // [NEW] Loading state
    const { showFooter, hideFooter } = useFooter();

    // [FIX] Prevent duplicate onboarding triggers
    const onboardingTriggeredRef = useRef(false);

    useEffect(() => {
        // Only trigger on Main Lobby - other pages control their own footer
        if (pathname !== '/main') {
            return;
        }

        if (!user) {
            // Reset trigger flag when user logs out
            onboardingTriggeredRef.current = false;
            return;
        }

        // Wait for profile AND global context (inventory) to load
        // This prevents the "Inventory Check" from running on empty default state
        if (profileLoading || contextLoading) return;

        // [FIX] Prevent duplicate triggers when profile/inventory updates
        if (onboardingTriggeredRef.current) {
            return;
        }

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
            console.log("[TutorialManager] 🔍 Checking onboarding status (DB-First)...");
            console.log("[TutorialManager] Profile Data:", {
                uid: user.uid,
                nickname: profile?.nickname || 'NONE',
                level: profile?.level,
                tutorialCompleted: profile?.tutorialCompleted,
                hasReceivedStarterPack: profile?.hasReceivedStarterPack
            });
            console.log("[TutorialManager] Context State:", {
                inventoryCount: inventory?.length || 0,
                profileLoading,
                contextLoading
            });

            // [NEW] Explicit Verification Log for User
            const authProvider = user.providerData?.[0]?.providerId || 'password';
            console.log(`[TutorialManager] 🛡️ Unified Auth Verification:`, {
                uid: user.uid,
                authType: authProvider === 'google.com' ? 'GOOGLE' : 'EMAIL/ID',
                sourceOfTruth: 'Firebase Firestore',
                nicknameInDB: profile?.nickname || 'MISSING',
                tutorialInDB: profile?.tutorialCompleted ? 'DONE' : 'PENDING',
                starterPackInDB: profile?.hasReceivedStarterPack ? 'CLAIMED' : 'AVAILABLE'
            });

            // [NEW] Gating existing users more aggressively
            const isTutorialCompleted = profile?.tutorialCompleted === true;
            const hasClaimedStarter = profile?.hasReceivedStarterPack === true;
            const hasInventory = inventory && inventory.length > 0;

            if (isTutorialCompleted || hasClaimedStarter || hasInventory) {
                console.log("[TutorialManager] ✅ Onboarding bypassed. User is existing or already in sync.");
                // Auto-sync if flags are missing but state is mature
                if (!isTutorialCompleted && (hasClaimedStarter || hasInventory)) {
                    console.log("[TutorialManager] 🛠️ Self-Healing: Syncing tutorialCompleted flag.");
                    completeTutorial();
                }
                return;
            }

            // 1. Check if nickname is missing
            const hasNickname = profile?.nickname && profile.nickname !== '';

            if (!hasNickname) {
                console.log("[TutorialManager] 🚩 Nickname missing. Triggering NicknameModal.");
                onboardingTriggeredRef.current = true; // Mark as triggered
                setShowNicknameModal(true);
                hideFooter();
                return;
            }

            console.log("[TutorialManager] 🚩 Tutorial not completed. Triggering WelcomeTutorialModal.");
            onboardingTriggeredRef.current = true; // Mark as triggered
            setShowTutorialModal(true);
            hideFooter();
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
     * [ATOMIC TRANSACTION] Uses claimStarterPackTransaction for reliability
     */
    const handleTutorialClose = async () => {
        // [Safety] Prevent simultaneous claims
        if (isProcessing) return;
        setIsProcessing(true);

        // [ATOMIC TRANSACTION] Distribute Starter Pack with all-or-nothing guarantee
        try {
            console.log("[TutorialManager] 🎁 Starting Atomic Starter Pack Transaction...");

            if (!user?.uid) {
                console.error("[TutorialManager] ❌ No user UID found!");
                finalizeTutorial();
                return;
            }

            if (!profile?.nickname) {
                console.error("[TutorialManager] ❌ No nickname found!");
                finalizeTutorial();
                return;
            }

            // Generate cards first (same logic as before)
            const { generateCardByRarity } = await import('@/lib/card-generation-system');
            const commonCard = generateCardByRarity('common', user.uid);
            const rareCard = generateCardByRarity('rare', user.uid);
            const epicCard = generateCardByRarity('epic', user.uid);
            const legendaryCard = generateCardByRarity('legendary', user.uid);
            const uniqueCard = generateCardByRarity('unique', user.uid);

            // Customize Unique Card with Nickname
            uniqueCard.name = `지휘관 ${profile.nickname}`; // [Fixed] Unified with UserContext
            uniqueCard.description = "전장에 새롭게 합류한 지휘관의 전용 유닉입니다."; // [Fixed] typo

            const starterPack = [
                commonCard,
                rareCard,
                epicCard,
                legendaryCard,
                uniqueCard
            ];

            // [ATOMIC TRANSACTION] This ensures cards + coins + flag are set together
            await claimStarterPackTransaction(
                user.uid,
                profile.nickname,
                starterPack,
                1000 // Coin reward
            );

            console.log("[TutorialManager] ✅ Starter Pack Transaction Complete!");

            // Prepare cards for UI display
            const inventoryCards = starterPack.map(card => ({
                ...card,
                instanceId: '', // UI display only
                acquiredAt: new Date()
            } as InventoryCard));

            setStarterCards(inventoryCards as unknown as CardType[]);

            // [Fix] Immediately refresh inventory so user context is in sync
            console.log("[TutorialManager] 🔄 Refreshing data after transaction...");
            await refreshData();

            // ONLY NOW hide the tutorial modal
            setShowTutorialModal(false);

            // Show the Opening Ceremony
            setShowOpeningModal(true);

        } catch (e: any) {
            console.error("[TutorialManager] ❌ CRITICAL ERROR in handleTutorialClose:", e);

            if (e.message === 'ALREADY_CLAIMED') {
                console.log("[TutorialManager] ⚠️ Starter pack already claimed. Proceeding to finalize.");
                await refreshData();
                setShowTutorialModal(false);
                finalizeTutorial();
            } else {
                // [CRITICAL FIX] DO NOT finalizeTutorial() on unknown errors!
                // This allows the user to refresh the page and try again, 
                // rather than being permanently locked out by the local storage flag.
                console.error("[TutorialManager] ❌ Starter Pack Transaction Failed. User remains in tutorial state for retry.");
                alert(`스타터팩 지급 중 오류가 발생했습니다: ${e.message}\n페이지를 새로고침 한 후 다시 시도해 주세요.`);

                // Still hide the modal to avoid covering the whole screen, 
                // but finalizeTutorial() is NOT called, so onboarding_completed remains false.
                setShowTutorialModal(false);
            }
        } finally {
            setIsProcessing(false);
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
