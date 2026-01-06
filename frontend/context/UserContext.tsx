'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
    updateCoins as firebaseUpdateCoins,
    updateTokens as firebaseUpdateTokens,
    updateExpAndLevel as firebaseUpdateExpAndLevel,
    saveUserProfile,
    claimStarterPackTransaction,
    purchaseCardPackTransaction
} from '@/lib/firebase-db';
import {
    Quest,
    QuestCategory,
    loadQuests,
    saveQuests,
    updateQuestProgress,
    claimQuestReward as processQuestReward
} from '@/lib/quest-system';
import { generateCardByRarity } from '@/lib/card-generation-system';
import { addCardToInventory, loadInventory, distributeStarterPack, InventoryCard } from '@/lib/inventory-system';
import type { Card, Rarity } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';
import { useFirebase } from '@/components/FirebaseProvider';
import { signOutUser, setAuthPersistence } from '@/lib/firebase-auth';
import { addNotification } from '@/components/NotificationCenter';
import { useRouter } from 'next/navigation';
import {
    syncSubscriptionsWithFirebase,
} from '@/lib/faction-subscription-utils';
import { CATEGORY_TOKEN_BONUS } from '@/lib/token-constants';
import { UserSubscription } from '@/lib/faction-subscription';
import { UserProfile, fetchUserSubscriptions } from '@/lib/firebase-db';
import { User } from 'firebase/auth';
import { gameStorage } from '@/lib/game-storage';

interface UserContextType {
    coins: number;
    tokens: number;
    maxTokens: number;
    level: number;
    experience: number;
    loading: boolean;
    inventory: InventoryCard[];
    addCoins: (amount: number) => Promise<void>;
    addTokens: (amount: number) => Promise<void>;
    addExperience: (amount: number) => Promise<{ level: number; experience: number; leveledUp: boolean }>;
    refreshData: () => Promise<void>;
    isAdmin: boolean;
    user: User | null;
    profile: UserProfile | null;
    starterPackAvailable: boolean;
    claimStarterPack: (nickname: string) => Promise<InventoryCard[]>;
    hideStarterPack: () => void;
    consumeTokens: (baseAmount: number, category?: string) => Promise<boolean>;
    subscriptions: UserSubscription[];
    buyCardPack: (cards: Card[], price: number, currencyType: 'coin' | 'token') => Promise<void>;
    completeTutorial: () => void;
    quests: Quest[];
    trackMissionEvent: (action: string, amount?: number) => void;
    claimQuest: (questId: string) => Promise<boolean>;
    handleSignOut: () => Promise<void>;
    // [NEW] Research & Stage Progress
    research: any | null;
    stageProgress: any | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { user } = useFirebase();
    const router = useRouter();
    const { profile, reload: reloadProfile, loading: profileLoading } = useUserProfile();

    const [error, setError] = useState<string | null>(null);
    const [coins, setCoins] = useState(0);
    const [tokens, setTokens] = useState(0);
    const [maxTokens, setMaxTokens] = useState(1000); // [NEW]
    const [level, setLevel] = useState(1);
    const [experience, setExperience] = useState(0);
    const [inventory, setInventory] = useState<InventoryCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [starterPackAvailable, setStarterPackAvailable] = useState(false);
    const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
    const [quests, setQuests] = useState<Quest[]>([]); // [NEW] Quest State
    const [research, setResearch] = useState<any | null>(null); // [NEW] Research State
    const [stageProgress, setStageProgress] = useState<any | null>(null); // [NEW] Stage Progress
    const [isClaimingInSession, setIsClaimingInSession] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showSafeMode, setShowSafeMode] = useState(false); // [NEW] Safe Mode Recovery

    const isAdmin = user?.email === 'admin@example.com';

    const resetState = useCallback(() => {
        console.log("🧹 [UserContext] Resetting State to Defaults and clearing local storage.");
        setCoins(0);
        setTokens(0);
        setMaxTokens(1000);
        setLevel(1);
        setExperience(0);
        setInventory([]);
        setSubscriptions([]);
        setIsClaimingInSession(false);
        setStarterPackAvailable(false);
        setQuests([]); // [NEW] Reset Quests
        setResearch(null); // [NEW] Reset Research
        setStageProgress(null); // [NEW] Reset Stage Progress
        setError(null);
        gameStorage.clearAllSessionData();
    }, []);

    const handleSignOut = useCallback(async () => {
        console.log("🚀 [Auth] Initiating Secure Sign Out...");

        // [Secure Sync] Force save critical data before scorching earth
        if (user?.uid) {
            try {
                console.log("[Auth] Saving final state with timeout...");
                const { saveQuestsToFirebase } = await import('@/lib/quest-system');
                const { saveResearchToFirestore, saveStageProgressToFirestore } = await import('@/lib/firebase-db');

                const syncPromise = Promise.all([
                    saveQuestsToFirebase(user.uid, quests),
                    research ? saveResearchToFirestore(research, user.uid) : Promise.resolve(),
                    stageProgress ? saveStageProgressToFirestore(stageProgress, user.uid) : Promise.resolve()
                ]);

                // Max 1.5s for Context-level sync
                await Promise.race([
                    syncPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('CONTEXT_SYNC_TIMEOUT')), 1500))
                ]);
            } catch (e: any) {
                console.warn("[Auth] Pre-logout sync skipped or timed out:", e.message);
            }
        }

        // Use the shared "Scorched Earth" utility
        const { performSecureLogout } = await import('@/lib/secure-logout');

        await performSecureLogout(user?.uid);

        // The utility handles the redirect, but just in case logic falls through or utility fails silently (unlikely)
        // we can force a backup redirect here if the utility promise resolves (which it shouldn't if it redirects)
    }, [user?.uid, quests, research, stageProgress]);


    useEffect(() => {
        setMounted(true);
        console.log('✅ UserProvider Mounted - Version: 2026-01-04-STARTER-PACK-DEBUG-V3');
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // --- LOGOUT GUARD ---
        const isPendingLogout = typeof window !== 'undefined' && localStorage.getItem('pending_logout') === 'true';
        if (isPendingLogout) {
            console.log("[Auth] Pending logout detected. Suppressing all auth effects.");
            setLoading(false);
            return;
        }

        // --- SESSION ID MISMATCH DETECTION ---
        const lastKnownUid = localStorage.getItem('last_known_uid');

        // Case 1: User is logged out (null).
        // [CRITICAL FIX] We MUST release loading immediately here, regardless of profileLoading.
        // Previously, we waited for profileLoading to clear, but useUserProfile's loading
        // might not change if auth never fires (e.g., network issues).
        if (!user) {
            console.log("[Auth] No user detected. Releasing loading state immediately.");
            setLoading(false);
            // If there was a previous user, ensure their data is nuked.
            if (lastKnownUid) {
                console.log(`[Auth] Cleanup required for previous UID (${lastKnownUid}).`);
                resetState();
                localStorage.removeItem('last_known_uid');
            }
            return;
        }

        // Case 2: User is logged in, but their UID does not match the last known UID.
        if (user && lastKnownUid && user.uid !== lastKnownUid) {
            console.warn(`[Auth] 🚨 CRITICAL: UID mismatch detected! Firebase user (${user.uid}) does not match last session (${lastKnownUid}). Nuking local state NOW.`);
            resetState(); // This is the critical cleanup step.

            // CRITICAL FIX: Update the last_known_uid BEFORE reload to break the loop!
            localStorage.setItem('last_known_uid', user.uid);

            // We force a reload to be absolutely certain the application re-initializes cleanly.
            window.location.reload();
            return;
        }

        // Case 3: User is logged in, profile is still loading.
        // [NEW] Added failsafe timeout - if profile takes too long, release loading anyway
        if (user && profileLoading) {
            console.log(`[Auth] User ${user.uid} session is valid. Waiting for profile...`);
            setLoading(true);

            // [SAFETY] Force release loading after 4 seconds if profile never loads
            const profileWaitTimeout = setTimeout(() => {
                console.warn(`[Auth] ⚠️ Profile loading timed out (4s). Force releasing loading state.`);
                setLoading(false);
            }, 4000);

            // Cleanup on effect re-run or when profileLoading changes
            return () => clearTimeout(profileWaitTimeout);
        }

        // Case 4: User and profile are fully loaded and session is consistent.
        if (user && profile) {
            console.log(`[Auth] User ${user.uid} and profile loaded. Syncing data...`);
            setLoading(true);

            // [Safety] Force release loading state after 5 seconds if sync hangs
            const forceReleaseTimer = setTimeout(() => {
                setLoading(prev => {
                    if (prev) {
                        console.warn("⚠️ [Auth] Sync took too long. Force releasing loading state.");
                        return false;
                    }
                    return prev;
                });
            }, 5000);

            // [NEW] Load inventory and subscriptions with commander logic
            const syncUserData = async () => {
                try {
                    // [NEW] Load quests, research, and stage progress
                    const { loadQuestsFromFirebase, getFreshQuestState, saveQuestsToFirebase } = await import('@/lib/quest-system');
                    const { loadResearchFromFirestore, loadStageProgressFromFirestore } = await import('@/lib/firebase-db');

                    let loadedQuests = await loadQuestsFromFirebase(user.uid);

                    if (!loadedQuests) {
                        console.log("[QuestSystem] No remote quests found. Initialization with FRESH state (Strict Safe Mode).");
                        loadedQuests = getFreshQuestState();
                        await saveQuestsToFirebase(user.uid, loadedQuests);
                    }
                    setQuests(loadedQuests);

                    // Load research data
                    const loadedResearch = await loadResearchFromFirestore(user.uid);
                    if (loadedResearch) {
                        setResearch(loadedResearch);
                    } else {
                        console.log("[Research] No remote research found. Will initialize on first research page visit.");
                    }

                    // Load stage progress
                    const loadedProgress = await loadStageProgressFromFirestore(user.uid);
                    if (loadedProgress) {
                        setStageProgress(loadedProgress);
                    } else {
                        console.log("[StageProgress] No remote progress found. Will initialize on first battle.");
                    }

                    // Sync was successful, so we can now set the last known UID to this user.
                    localStorage.setItem('last_known_uid', user.uid);

                    if (profile.coins < 0) {
                        console.warn(`[Auto-Heal] Negative balance of ${profile.coins} detected. Resetting to 0.`);
                        await firebaseUpdateCoins(Math.abs(profile.coins), user.uid);
                        setCoins(0);
                    } else {
                        setCoins(profile.coins);
                    }

                    setTokens(profile.tokens);
                    setLevel(profile.level);
                    setExperience(profile.exp);

                    const [cards, subs] = await Promise.all([
                        loadInventory(user.uid),
                        fetchUserSubscriptions(user.uid),
                        syncSubscriptionsWithFirebase(user.uid)
                    ]);

                    const formattedCards = cards.map(c => ({
                        ...c,
                        acquiredAt: (c.acquiredAt && 'toDate' in (c.acquiredAt as any)) ? (c.acquiredAt as any).toDate() : new Date(c.acquiredAt as any)
                    })) as InventoryCard[];

                    const { COMMANDERS } = await import('@/data/card-database');
                    const rentalCommanders: Card[] = [];

                    for (const sub of subs) {
                        // [Policy Change] All active subscribers get Commander access (Free included)
                        if (sub.status === 'active') {
                            const cmdTemplate = COMMANDERS.find(c => c.aiFactionId === sub.factionId);
                            if (cmdTemplate) {
                                const alreadyExists = formattedCards.some(c => c.templateId === cmdTemplate.id || c.id === cmdTemplate.id);
                                if (!alreadyExists) {
                                    rentalCommanders.push({
                                        id: `commander-${cmdTemplate.id}`,
                                        instanceId: `commander-${cmdTemplate.id}-${user.uid}`,
                                        templateId: cmdTemplate.id,
                                        ownerId: user.uid,
                                        name: cmdTemplate.name,
                                        rarity: 'commander',
                                        type: 'EFFICIENCY',
                                        level: 1,
                                        experience: 0,
                                        imageUrl: cmdTemplate.imageUrl,
                                        aiFactionId: cmdTemplate.aiFactionId,
                                        description: cmdTemplate.description,
                                        stats: { efficiency: 95, creativity: 95, function: 95, totalPower: 285 },
                                        acquiredAt: new Date(),
                                        isCommanderCard: true,
                                        isLocked: false,
                                        specialty: cmdTemplate.specialty
                                    } as InventoryCard);
                                }
                            }
                        }
                    }

                    const finalInventory = [...formattedCards, ...rentalCommanders] as InventoryCard[];
                    setInventory(finalInventory);
                    setSubscriptions(subs);

                    // DETERMINISTIC STARTER PACK CHECK
                    // Logic: Level 1 + Empty Inventory + Has NOT received flag = Available
                    // We remove the "Rescue" logic (auto-claiming) as it's unpredictable.
                    if (profile.level === 1 && finalInventory.length === 0 && !profile.hasReceivedStarterPack) {
                        console.log(`[StarterPack] ✅ User ELIGIBLE for initial supply.`);
                        setStarterPackAvailable(true);
                    } else {
                        setStarterPackAvailable(false);
                        if (profile.level === 1 && finalInventory.length === 0) {
                            console.warn(`[Sync] ⚠️ User has 0 cards but flag says already claimed. Manual sync recommended.`);
                        }
                    }
                } catch (error) {
                    console.error("[Auth] Failed to sync user data:", error);
                } finally {
                    clearTimeout(forceReleaseTimer); // Clear safety timer
                    setLoading(false);
                    console.log("[Auth] User data sync complete.");
                }
            };

            syncUserData();
        }

    }, [mounted, user, profile, profileLoading, resetState]);

    const checkFeatureUnlocks = (newLevel: number) => {
        if (newLevel === 3) {
            addNotification({ type: 'levelup', title: '연구소 잠금 해제!', message: '이제 연구소에서 AI 기술을 연구하여 카드를 강화할 수 있습니다.', icon: '🧪' });
        }
        if (newLevel === 5) {
            addNotification({ type: 'levelup', title: 'PVP 아레나 잠금 해제!', message: '다른 플레이어와 실력을 겨뤄보세요! 아레나가 개방되었습니다.', icon: '⚔️' });
        }
        if (newLevel === 10) {
            addNotification({ type: 'levelup', title: '랭크전 시작 가능!', message: '진정한 실력자를 가리는 랭크전에 참여하여 명예를 드높이세요!', icon: '🏆' });
        }
        addNotification({ type: 'levelup', title: `레벨 업! Lv.${newLevel}`, message: `축하합니다! 레벨 ${newLevel}이 되었습니다. 더 강력한 카드를 생성할 수 있습니다.`, icon: '🆙' });
    };

    const completeTutorial = useCallback(async () => {
        if (!user?.uid || !profile) return;

        try {
            // [DB-FIRST] Only update Firebase, no localStorage
            await saveUserProfile({ tutorialCompleted: true }, user.uid);
            await reloadProfile();
            console.log("[UserContext] Tutorial status saved to Firebase (DB-First).");
        } catch (error) {
            console.error("Failed to save tutorial completion status:", error);
        }
    }, [user?.uid, profile, reloadProfile]);

    const refreshData = useCallback(async () => {
        if (!mounted || !user || !profile) {
            if (!user) resetState();
            setLoading(false);
            return;
        }

        // [LOGOUT GUARD]
        const isPendingLogout = typeof window !== 'undefined' && localStorage.getItem('pending_logout') === 'true';
        if (isPendingLogout) {
            console.log("[UserContext] refreshData suppressed - Pending logout.");
            return;
        }

        try {
            await reloadProfile();
            const inv = await loadInventory(user.uid);
            const formattedInv = inv.map(c => ({
                ...c,
                acquiredAt: (c.acquiredAt && 'toDate' in (c.acquiredAt as any)) ? (c.acquiredAt as any).toDate() : new Date(c.acquiredAt as any)
            })) as InventoryCard[];
            setInventory(formattedInv);

            const fetchedSubscriptions = await fetchUserSubscriptions(user.uid);
            setSubscriptions(fetchedSubscriptions);

            // [NEW] Passive Token Recharge
            const { processTokenRecharge, initTokenTimestamp } = await import('@/lib/token-system');

            // Initialize timestamp if missing
            if (!profile.lastTokenUpdate) {
                await initTokenTimestamp(user.uid);
                // Temporarily set for this run
                profile.lastTokenUpdate = new Date();
            }

            const rechargedTokens = await processTokenRecharge(profile, user.uid, fetchedSubscriptions);
            if (rechargedTokens !== null) {
                setTokens(rechargedTokens);
                // Update local profile ref to avoid 'flicker' if reloadProfile is slow? 
                // Context state 'tokens' is authority for UI.
            } else {
                setTokens(profile.tokens); // Ensure sync
            }

            // [DB-FIRST] Use only profile.tutorialCompleted from DB
            const isTutorialCompleted = profile.tutorialCompleted === true;

            // Starter Pack eligibility: Level 1, NO received flag, NO cards, and Tutorial MUST be completed.
            if (!isClaimingInSession &&
                formattedInv.length === 0 &&
                !profile.hasReceivedStarterPack &&
                isTutorialCompleted) {
                setStarterPackAvailable(true);
            } else {
                setStarterPackAvailable(false);
            }
            setError(null);
        } catch (err) {
            console.error("WARNING: Failed to refresh user data from DB (Non-fatal)", err);
            setLoading(false);
        }
    }, [mounted, profile, reloadProfile, user?.uid, isClaimingInSession, resetState]);

    const addCoinsByContext = async (amount: number) => {
        if (!mounted || !profile || !user) return;

        // [LOGOUT GUARD]
        if (typeof window !== 'undefined' && localStorage.getItem('pending_logout') === 'true') return;

        try {
            await firebaseUpdateCoins(amount, user.uid);
            await reloadProfile();
        } catch (err) {
            console.error("Failed to add coins:", err);
        }
    };

    const addTokensByContext = async (amount: number) => {
        if (!mounted || !profile || !user) return;

        // [LOGOUT GUARD]
        if (typeof window !== 'undefined' && localStorage.getItem('pending_logout') === 'true') return;

        try {
            await firebaseUpdateTokens(amount, user.uid);
            await reloadProfile();
        } catch (err) {
            console.error("Failed to add tokens:", err);
        }
    };

    const addExperienceByContext = async (amount: number) => {
        if (!profile || !user) return { level: 1, experience: 0, leveledUp: false };

        // [LOGOUT GUARD]
        if (typeof window !== 'undefined' && localStorage.getItem('pending_logout') === 'true') return { level: 1, experience: 0, leveledUp: false };

        let currentExp = experience + amount;
        let currentLevel = level;
        let leveledUp = false;

        while (currentExp >= currentLevel * 100) {
            currentExp -= currentLevel * 100;
            currentLevel++;
            leveledUp = true;
        }

        currentLevel = Math.max(1, currentLevel);
        currentExp = Math.max(0, currentExp);

        try {
            await firebaseUpdateExpAndLevel(currentExp, currentLevel, user.uid);
            await reloadProfile();
            if (leveledUp) checkFeatureUnlocks(currentLevel);
        } catch (err) {
            console.error("Failed to add experience:", err);
        }

        return { level: currentLevel, experience: currentExp, leveledUp };
    };

    const consumeTokens = async (baseAmount: number, category: string = 'COMMON'): Promise<boolean> => {
        if (!user || !profile) return false;

        let finalAmount = baseAmount;
        let isPayback = false;
        let paybackAmount = 0;

        if (category === 'CODING') {
            const bonus = CATEGORY_TOKEN_BONUS.CODING;
            if (Math.random() < bonus.chance) {
                isPayback = true;
                paybackAmount = Math.floor(finalAmount * bonus.refundRatio);
                finalAmount -= paybackAmount;
            }
        }

        if (profile.tokens < finalAmount) return false;

        await firebaseUpdateTokens(-finalAmount, user.uid);
        setTokens(prev => prev - finalAmount);

        if (isPayback) {
            console.log(`⚡️ CODING OPTIMIZATION! Refunded ${paybackAmount} tokens.`);
        }

        return true;
    };

    const hideStarterPack = () => setStarterPackAvailable(false);

    const claimStarterPack = async (nickname: string, silent: boolean = false): Promise<InventoryCard[]> => {
        if (!mounted || !user) return [];

        // [LOGOUT GUARD]
        const isPendingLogout = typeof window !== 'undefined' && localStorage.getItem('pending_logout') === 'true';
        if (isPendingLogout) {
            console.log("[UserContext] claimStarterPack suppressed - Pending logout.");
            return [];
        }

        setStarterPackAvailable(false);
        setIsClaimingInSession(true);

        try {
            const uid = user.uid;
            const { generateCardByRarity: gen } = await import('@/lib/card-generation-system');
            const starterCards = [gen('common', uid), gen('rare', uid), gen('epic', uid), gen('legendary', uid), gen('unique', uid)];
            starterCards[4].name = `지휘관 ${nickname}`;
            starterCards[4].description = "전장에 새롭게 합류한 지휘관의 전용 유닉입니다.";

            await claimStarterPackTransaction(uid, nickname, starterCards);
            await new Promise(resolve => setTimeout(resolve, 500));
            await reloadProfile();
            await refreshData();

            const invCheck = await loadInventory(uid);
            if (invCheck.length > 0) {
                setInventory(invCheck as InventoryCard[]);
            } else {
                const claimedInventory = starterCards.map(c => ({ ...c, acquiredAt: new Date() })) as InventoryCard[];
                setInventory(claimedInventory);
            }

            addNotification({ type: 'reward', title: '스타터팩 지급 완료!', message: `${nickname} 지휘관님, 1000 코인과 카드 5장을 획득했습니다.`, icon: '🎁' });
            return starterCards as InventoryCard[];
        } catch (error: any) {
            console.error("❌ Failed to claim starter pack - DETAILED ERROR:", error);
            const isAlreadyClaimed = error.message === 'ALREADY_CLAIMED' || error.message?.includes('ALREADY_CLAIMED');
            let message = isAlreadyClaimed ? '이미 보급품을 수령하셨습니다.' : '스타터팩 지급 중 서버 오류가 발생했습니다.';

            // SILENCE alerts if it's a background rescue attempt or if permissions are missing (common during logout)
            const isPermissionError = error.message?.includes('permission') || error.code?.includes('permission');

            if (!isAlreadyClaimed && !silent && !isPermissionError) {
                window.alert(`[보급 오류] ${message}\n(에러 상세: ${error.message || 'Unknown'})`);
            }

            addNotification({
                type: isAlreadyClaimed ? 'warning' : 'error',
                title: isAlreadyClaimed ? '확인 완료' : '보급 처리 중',
                message: isAlreadyClaimed ? message : (silent ? '데이터 동기화 재시도 중...' : message),
                icon: isAlreadyClaimed ? 'ℹ️' : '⚠️'
            });
            return [];
        }
    };

    // [NEW] Quest Event Bus
    const trackMissionEvent = useCallback((action: string, amount: number = 1) => {
        setQuests(prevQuests => {
            // Determine category based on action roughly (logic is inside updateQuestProgress too)
            // Ideally updateQuestProgress should handle category filtering or we pass 'general' if unknown.
            // For simplicity, we check all relevant categories or rely on updateQuestProgress to ignore mismatches.

            let updated = [...prevQuests];
            const categories: QuestCategory[] = ['battle', 'card', 'fusion', 'general'];

            categories.forEach(cat => {
                updated = updateQuestProgress(updated, cat, action, amount);
            });

            // If changes detected, save
            if (JSON.stringify(updated) !== JSON.stringify(prevQuests)) {
                saveQuests(updated);

                // Optional: Check for newly completed quests to notify
                const newlyCompleted = updated.find(q => q.completed && !prevQuests.find(pq => pq.id === q.id)?.completed);
                if (newlyCompleted) {
                    addNotification({
                        title: "MISSION COMPLETE!",
                        message: newlyCompleted.title,
                        type: "achievement",
                        icon: "🏆"
                    });
                }
            }
            return updated;
        });
    }, []);

    // [NEW] Claim Quest Reward
    const claimQuest = useCallback(async (questId: string): Promise<boolean> => {
        const quest = quests.find(q => q.id === questId);
        if (!quest || !quest.completed || quest.claimed) return false;

        const { rewards, updatedQuest } = processQuestReward(quest);

        if (rewards.coins > 0) await addCoinsByContext(rewards.coins);
        if (rewards.experience > 0) await addExperienceByContext(rewards.experience);
        // Card rewards would ideally call addCardToInventory logic here if card templates provided

        // Update state
        const newQuests = quests.map(q => q.id === questId ? updatedQuest : q);
        setQuests(newQuests);
        saveQuests(newQuests);

        return true;
    }, [quests, addCoinsByContext, addExperienceByContext]);

    // [NEW] Global Safe Mode Timeout
    useEffect(() => {
        if (!mounted || !loading) {
            setShowSafeMode(false);
            return;
        }

        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.error("🚨 [CRITICAL] Application stuck in loading state for >5s. Activating Safe Mode Overlay.");
                setShowSafeMode(true);
            }
        }, 5000);

        return () => clearTimeout(safetyTimer);
    }, [mounted, loading]);

    // Render Safe Mode / Error Screen
    if (error || showSafeMode) {
        return (
            <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black text-white font-mono p-6 text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_70%)] animate-pulse" />

                <div className="relative z-10 max-w-lg w-full">
                    <div className="text-red-500 text-7xl mb-6 animate-bounce">⚠️</div>
                    <h1 className="text-3xl font-black mb-2 orbitron tracking-tighter">
                        {error ? "SYSTEM CRITICAL FAILURE" : "INITIALIZATION HANG DETECTED"}
                    </h1>
                    <div className="h-1 w-20 bg-red-500 mx-auto mb-6" />

                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        {error || "시스템이 데이터를 동기화하는 도중 응답이 없습니다. 네트워크 상태를 확인하거나 아래 버튼을 눌러 초기화를 시도하세요."}
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-8 py-4 bg-red-600 hover:bg-red-700 text-black font-black italic rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                        >
                            FORCE SYSTEM REBOOT
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-3 border border-white/20 hover:bg-white/10 hover:border-white/40 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all"
                            >
                                SCORCHED EARTH LOGOUT
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.href = '/';
                                }}
                                className="px-4 py-3 border border-yellow-500/20 text-yellow-500/60 hover:bg-yellow-500/10 hover:text-yellow-500 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all"
                            >
                                CLEAR LOCAL DATA & RESTART
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 space-y-1">
                        <p className="text-[10px] text-gray-600 font-mono">NODE_STATUS: STUCK_OR_OFFLINE</p>
                        <p className="text-[10px] text-gray-600 font-mono">ERROR_CODE: {error ? "DB_SYNC_STRICT_ENFORCEMENT" : "AUTH_INIT_TIMEOUT"}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <UserContext.Provider
            value={{
                coins, tokens, maxTokens, level, experience, user, profile, inventory, loading, refreshData,
                addCoins: addCoinsByContext, addTokens: addTokensByContext, addExperience: addExperienceByContext,
                isAdmin, starterPackAvailable, claimStarterPack, hideStarterPack, consumeTokens, subscriptions,
                buyCardPack: async (cards, price, currencyType) => {
                    if (!user) return;
                    await purchaseCardPackTransaction(user.uid, cards, price, currencyType);
                    await refreshData();
                },
                completeTutorial, // [NEW]
                quests,            // [NEW]
                trackMissionEvent, // [NEW]
                claimQuest,        // [NEW]
                handleSignOut,
                research,          // [NEW]
                stageProgress,     // [NEW]
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
