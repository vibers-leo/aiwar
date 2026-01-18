'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
    updateCoins as firebaseUpdateCoins,
    updateTokens as firebaseUpdateTokens,
    updateExpAndLevel as firebaseUpdateExpAndLevel,
    saveUserProfile,
    loadUserProfile,
    claimStarterPackTransaction,
    purchaseCardPackTransaction,
    checkAndRechargeTokens
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
import { addCardToInventory, loadInventory, InventoryCard } from '@/lib/inventory-system';
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
import { updateGameState } from '@/lib/game-state';
import { isFirebaseConfigured, db } from '@/lib/firebase';
import { serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import SubscriptionWarningModal from '@/components/SubscriptionWarningModal';

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
    // [NEW] Main Deck
    mainDeck: InventoryCard[];
    updateMainDeck: (deck: InventoryCard[]) => Promise<void>;
    // [NEW] Refresh inventory (for slot changes)
    refreshInventory: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useFirebase();
    const router = useRouter();
    const { profile, reload: reloadProfile, loading: profileLoading } = useUserProfile();

    const [error, setError] = useState<string | null>(null);
    const [coins, setCoins] = useState(0);
    const [tokens, setTokens] = useState(0); // [Fix] Initialize with 0 to prevent "fake money" flicker
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
    const [mainDeck, setMainDeckState] = useState<InventoryCard[]>([]); // [NEW] Main Deck State
    const [isClaimingInSession, setIsClaimingInSession] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showSafeMode, setShowSafeMode] = useState(false); // [NEW] Safe Mode Recovery
    const [isLoggingOut, setIsLoggingOut] = useState(false); // [NEW] Logout UX Overlay
    const [showSubscriptionWarning, setShowSubscriptionWarning] = useState(false); // [NEW] Subscription Warning Modal
    const isRefreshing = useRef(false);

    const isAdmin = user?.email === 'juuuno@naver.com';

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
        setMainDeckState([]); // [NEW] Reset Main Deck
        setError(null);
        gameStorage.clearAllSessionData();
    }, []);

    const handleSignOut = useCallback(async () => {
        // [NEW] Check for active subscriptions
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

        if (activeSubscriptions.length > 0 && !showSubscriptionWarning) {
            // Show warning modal if there are active subscriptions
            setShowSubscriptionWarning(true);
            return;
        }

        console.log("🚀 [Auth] Initiating Fast Sign Out...");
        setIsLoggingOut(true); // Show overlay
        setShowSubscriptionWarning(false); // Hide warning modal

        // [OPTIMIZED] Quick essential sync with SHORT timeout (800ms max)
        if (user?.uid) {
            try {
                console.log("[Auth] Quick sync before logout...");
                const { saveQuestsToFirebase } = await import('@/lib/quest-system');

                // Only save quests (most critical) with very short timeout
                await Promise.race([
                    saveQuestsToFirebase(user.uid, quests),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('QUICK_SYNC_TIMEOUT')), 800))
                ]);
                console.log("[Auth] Quick sync done");
            } catch (e: any) {
                // Non-critical - proceed with logout
                console.warn("[Auth] Quick sync skipped:", e.message);
            }
        }

        // Use optimized logout utility (skips duplicate sync)
        const { performSecureLogout } = await import('@/lib/secure-logout');
        await performSecureLogout(user?.uid, true); // skipDataSync = true

    }, [user?.uid, quests, subscriptions, showSubscriptionWarning]);


    const initialSyncDone = useRef(false);

    useEffect(() => {
        setMounted(true);
        console.log('✅ UserProvider Mounted - Version: 2026-01-10-AVATAR-SYNC-FIX');
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (authLoading) return;

        // --- LOGOUT GUARD ---
        const isPendingLogout = typeof window !== 'undefined' && localStorage.getItem('pending_logout') === 'true';
        if (isPendingLogout) {
            setLoading(false);
            return;
        }

        // --- SESSION ID MISMATCH DETECTION ---
        const lastKnownUid = localStorage.getItem('last_known_uid');

        if (!user) {
            setLoading(false);
            if (lastKnownUid) {
                resetState();
                localStorage.removeItem('last_known_uid');
            }
            initialSyncDone.current = false;
            return;
        }

        if (user && lastKnownUid && user.uid !== lastKnownUid) {
            resetState();
            localStorage.setItem('last_known_uid', user.uid);
            window.location.reload();
            return;
        }

        // --- PROFILE LOADING ---
        if (user && profileLoading && !initialSyncDone.current) {
            setLoading(true);
            return;
        }

        // --- DATA SYNC & STAT UPDATES ---
        if (user && profile) {
            // Update stats whenever profile changes (reactive)
            if (profile.coins < 0) {
                setCoins(0);
            } else {
                setCoins(profile.coins);
            }
            setTokens(profile.tokens);
            setLevel(profile.level);
            setExperience(profile.exp);

            // ONLY do full sync once per user session
            if (initialSyncDone.current) {
                return;
            }

            setLoading(true);
            const forceReleaseTimer = setTimeout(() => {
                setLoading(false);
            }, 12000);

            const syncUserData = async () => {
                try {
                    const { loadQuestsFromFirebase, getFreshQuestState, saveQuestsToFirebase } = await import('@/lib/quest-system');
                    const { loadResearchFromFirestore, loadStageProgressFromFirestore } = await import('@/lib/firebase-db');

                    console.log(`[Sync] 📥 Initial Full Sync for ${user.uid}...`);

                    // Parallel load for performance
                    const [loadedQuests, loadedResearch, loadedProgress, cards, subs] = await Promise.all([
                        loadQuestsFromFirebase(user.uid),
                        loadResearchFromFirestore(user.uid),
                        loadStageProgressFromFirestore(user.uid),
                        loadInventory(user.uid),
                        fetchUserSubscriptions(user.uid),
                        syncSubscriptionsWithFirebase(user.uid) // This also returns a promise, but its result isn't directly used here
                    ]);

                    const formattedCards = cards.map(c => ({
                        ...c,
                        acquiredAt: (c.acquiredAt && 'toDate' in (c.acquiredAt as any)) ? (c.acquiredAt as any).toDate() : new Date(c.acquiredAt as any)
                    })) as InventoryCard[];

                    const { COMMANDERS } = await import('@/data/card-database');
                    const { getGenerationSlots } = await import('@/lib/generation-utils');
                    const rentalCommanders: InventoryCard[] = [];

                    // [Policy Change] Commander cards are ONLY granted when faction is in a GENERATION SLOT
                    // Not just subscribed - must be actively placed in a slot
                    // Maximum 5 cards (5 slots)
                    const generationSlots = getGenerationSlots(user.uid);
                    const slottedFactionIds = generationSlots
                        .filter(slot => slot.factionId)
                        .map(slot => slot.factionId!);

                    for (const factionId of slottedFactionIds) {
                        // Verify subscription is still active
                        const sub = subs.find(s => s.factionId === factionId && s.status === 'active');
                        if (!sub) continue;

                        const cmdTemplate = COMMANDERS.find(c => c.aiFactionId === factionId);
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
                                    isRentalCard: true, // [NEW] Mark as rental for filtering
                                    isLocked: true, // [NEW] Locked to prevent accidental use in fusion
                                    specialty: cmdTemplate.specialty
                                });
                            }
                        }
                    }

                    // [MIGRATION] Clean up stale commander cards from old subscription-based rule
                    // Only keep commander cards for factions that are currently in a generation slot
                    const { removeCardFromInventory } = await import('@/lib/inventory-system');
                    const staleCommanderCards = formattedCards.filter(card => {
                        // Check if this is a commander/rental card
                        const isCommanderType = card.isCommanderCard || card.isRentalCard || card.rarity === 'commander';
                        if (!isCommanderType) return false;

                        // Check if the faction is still in a slot
                        const cardFactionId = card.aiFactionId ||
                            COMMANDERS.find(c => c.id === card.templateId || c.id === card.id)?.aiFactionId;

                        if (!cardFactionId) return false;

                        // If faction is not in a slot, this card is stale and should be removed
                        return !slottedFactionIds.includes(cardFactionId);
                    });

                    if (staleCommanderCards.length > 0) {
                        console.log(`[Migration] Cleaning up ${staleCommanderCards.length} stale commander cards...`);
                        for (const staleCard of staleCommanderCards) {
                            try {
                                await removeCardFromInventory(staleCard.instanceId, user.uid);
                                console.log(`[Migration] ✅ Removed stale commander: ${staleCard.name} (${staleCard.instanceId})`);
                            } catch (err) {
                                console.error(`[Migration] ❌ Failed to remove: ${staleCard.name}`, err);
                            }
                        }
                    }

                    // Filter out stale cards from the display list
                    const cleanedFormattedCards = formattedCards.filter(card => {
                        const staleIds = staleCommanderCards.map(s => s.instanceId);
                        return !staleIds.includes(card.instanceId);
                    });

                    const finalInventory = [...cleanedFormattedCards, ...rentalCommanders] as InventoryCard[];
                    setInventory(finalInventory);
                    setSubscriptions(subs);

                    // DETERMINISTIC STARTER PACK CHECK [Jung-Gong-Beop]
                    // We verify against the SERVER directly to avoid cache discrepancies across devices.
                    const { checkStarterPackStatus } = await import('@/lib/firebase-db');
                    const hasReceivedOnServer = await checkStarterPackStatus(user.uid);

                    // Logic: Level 1 + Empty Inventory + Has NOT received (Server Truth) = Available
                    if (profile.level === 1 && finalInventory.length === 0 && !hasReceivedOnServer) {
                        console.log(`[StarterPack] ✅ User ELIGIBLE for initial supply (Server Verified).`);
                        setStarterPackAvailable(true);
                    } else {
                        setStarterPackAvailable(false);
                        if (profile.level === 1 && finalInventory.length === 0 && hasReceivedOnServer) {
                            console.warn(`[Sync] ⚠️ User has 0 cards but Server flag says claimed. Manual sync recommended.`);
                        }
                    }

                    // [SELF-HEALING] Avatar Sync
                    // If user has a commander card but no custom avatar (or default), sync it.
                    const commanderCard = finalInventory.find(c => c.rarity === 'unique' || c.isCommanderCard);
                    const isDefaultAvatar = !profile.avatarUrl || profile.avatarUrl.includes('default') || profile.avatarUrl.includes('emoji');

                    if (commanderCard && isDefaultAvatar && commanderCard.imageUrl) {
                        console.log(`[SelfHealing] Syncing missing avatar from Commander Card: ${commanderCard.name}`);

                        // Optimistic Update
                        if (profile) profile.avatarUrl = commanderCard.imageUrl;

                        // Background Persist
                        saveUserProfile({ avatarUrl: commanderCard.imageUrl }, user.uid).catch(e =>
                            console.warn("[SelfHealing] Failed to save avatar:", e)
                        );
                    }

                    // [NEW] Load Main Deck
                    const { getUserMainDeck } = await import('@/lib/user-profile-utils');
                    const deck = await getUserMainDeck(user.uid);
                    setMainDeckState(deck);
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

    }, [mounted, user, authLoading, profile, profileLoading, resetState]);

    // [NEW] Presence System: Update lastActive every 5 minutes
    useEffect(() => {
        if (!user || !db) return;

        const updatePresence = async () => {
            if (!db) return; // redundant but safe for TS
            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    lastActive: serverTimestamp()
                });
                console.log(`[Presence] 📡 Last active updated for ${user.uid}`);
            } catch (error) {
                console.warn("[Presence] Failed to update presence:", error);
            }
        };

        // Update immediately on mount/auth
        updatePresence();

        // Then every 5 minutes
        const interval = setInterval(updatePresence, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user]);

    // [NEW] Token Auto-Sync (Every 1 Minute)
    useEffect(() => {
        if (!user || !mounted || !profile) return;

        const syncTokens = async () => {
            try {
                // Check and recharge
                const newTokens = await checkAndRechargeTokens(
                    user.uid,
                    tokens, // current state
                    profile.lastTokenUpdate, // timestamp from profile
                    subscriptions
                );

                // If tokens changed, it means a recharge happened (DB updated)
                // We must reflect this and update the timestamp to prevent loops
                if (newTokens !== tokens) {
                    console.log(`[TokenSync] 💎 Recharge detected: ${tokens} -> ${newTokens}`);
                    setTokens(newTokens);
                    // Reload profile to get the new 'lastTokenUpdate' timestamp from DB
                    // This prevents the next check from using the old timestamp
                    await reloadProfile();
                }
            } catch (error) {
                console.warn("[TokenSync] Check failed:", error);
            }
        };

        const tokenInterval = setInterval(syncTokens, 60 * 1000); // Check every minute
        return () => clearInterval(tokenInterval);
    }, [user, mounted, tokens, profile, subscriptions, reloadProfile]);

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
        if (!isFirebaseConfigured || !db) return;

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
        if (!mounted || !user || isRefreshing.current) return;
        if (!isFirebaseConfigured || !db) {
            console.warn("[UserContext] refreshData skipped - Firebase not configured or db not initialized.");
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
            isRefreshing.current = true;
            console.log("[UserContext] 🔄 Full data refresh triggered...");
            const freshProfile = await loadUserProfile(user.uid);
            const inv = await loadInventory(user.uid);
            console.log(`[UserContext] 📦 Inventory loaded: ${inv.length} cards`);

            const formattedInv: InventoryCard[] = inv.map(c => ({
                ...c,
                acquiredAt: (c.acquiredAt && (c.acquiredAt as any).toDate)
                    ? (c.acquiredAt as any).toDate()
                    : (c.acquiredAt instanceof Date ? c.acquiredAt : new Date(c.acquiredAt as any))
            }));

            setInventory(formattedInv);

            const fetchedSubscriptions = await fetchUserSubscriptions(user.uid);
            setSubscriptions(fetchedSubscriptions);

            // [MIGRATION] Firestore -> LocalStorage Sync for Factions
            if (fetchedSubscriptions.length > 0) {
                const subKey = `factionSubscriptions_${user.uid}`;
                localStorage.setItem(subKey, JSON.stringify(fetchedSubscriptions));
            }

            // [NEW] Refresh Main Deck
            const { getUserMainDeck } = await import('@/lib/user-profile-utils');
            const deck = await getUserMainDeck(user.uid);
            setMainDeckState(deck);

            // [QUEST] Sync Quests
            const { loadQuestsFromFirebase, getFreshQuestState, saveQuestsToFirebase } = await import('@/lib/quest-system');
            const { loadResearchFromFirestore, loadStageProgressFromFirestore } = await import('@/lib/firebase-db');

            let loadedQuests = await loadQuestsFromFirebase(user.uid);
            if (!loadedQuests) {
                console.log("[UserContext] No quests in DB, creating fresh state...");
                loadedQuests = getFreshQuestState();
                await saveQuestsToFirebase(user.uid, loadedQuests);
            }
            setQuests(loadedQuests);
            saveQuests(loadedQuests); // Local cache

            // [RESEARCH] Sync Research
            const loadedResearch = await loadResearchFromFirestore(user.uid);
            if (loadedResearch) setResearch(loadedResearch);

            // [PROGRESS] Sync Stage Progress
            const loadedProgress = await loadStageProgressFromFirestore(user.uid);
            if (loadedProgress) setStageProgress(loadedProgress);

            // [SYNC] Global Stats
            if (freshProfile) {
                // [NEW] Token Auto-Refill Logic
                let finalTokens = freshProfile.tokens;
                try {
                    finalTokens = await checkAndRechargeTokens(
                        user.uid,
                        freshProfile.tokens,
                        freshProfile.lastTokenUpdate,
                        fetchedSubscriptions
                    );
                } catch (err) {
                    console.error("[UserContext] Token recharge failed:", err);
                }

                setCoins(freshProfile.coins);
                setTokens(finalTokens);
                setLevel(freshProfile.level);
                setExperience(freshProfile.exp);

                // [Fix] Ensure compatibility with legacy state
                updateGameState({
                    coins: freshProfile.coins,
                    tokens: freshProfile.tokens,
                    level: freshProfile.level,
                    experience: freshProfile.exp,
                    inventory: formattedInv
                }, user.uid);
            }

            // [STARTER PACK] Auto-check
            // If user has NO cards and hasn't received pack, show modal
            const isTutorialCompleted = localStorage.getItem(`tutorial_completed_${user.uid}`) === 'true' || freshProfile?.tutorialCompleted === true;

            // [Jung-Gong-Beop] Server Verification for Refresh
            const { checkStarterPackStatus } = await import('@/lib/firebase-db');
            const hasReceivedOnServer = await checkStarterPackStatus(user.uid);

            if (!isClaimingInSession &&
                formattedInv.length === 0 &&
                !hasReceivedOnServer &&
                isTutorialCompleted) {
                setStarterPackAvailable(true);
            } else {
                setStarterPackAvailable(false);
            }
            setError(null);
        } catch (err) {
            console.error("WARNING: Failed to refresh user data from DB (Non-fatal)", err);
        } finally {
            isRefreshing.current = false;
            setLoading(false);
        }
    }, [mounted, user?.uid, isClaimingInSession, resetState]);

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
        if (!isFirebaseConfigured || !db) {
            console.error("[UserContext] cannot claim starter pack: Firebase not configured.");
            return [];
        }

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

            // [FIX] Optimistic UI update to prevent "0 coins" flicker
            // The transaction gives 1000 coins, so update immediately before async profile reload
            setCoins(1000);
            setTokens(prev => Math.max(prev, 1000)); // Ensure tokens also stay at initial value

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
            if (loading && user) {
                console.error("🚨 [CRITICAL] Application stuck in loading state for >15s. Activating Safe Mode Overlay.");
                setShowSafeMode(true);
            }
        }, 15000);

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

    const updateMainDeck = useCallback(async (deck: InventoryCard[]) => {
        if (!user?.uid) return;
        try {
            const { saveUserMainDeck } = await import('@/lib/user-profile-utils');
            await saveUserMainDeck(user.uid, deck);
            setMainDeckState(deck);
        } catch (error) {
            console.error('Failed to update main deck:', error);
        }
    }, [user?.uid]);

    // [NEW] Refresh inventory (especially for slot-based commander rentals)
    const refreshInventory = useCallback(async () => {
        if (!user?.uid) return;
        try {
            const { loadInventory } = await import('@/lib/inventory-system');
            const { fetchUserSubscriptions } = await import('@/lib/firebase-db');
            const { getGenerationSlots } = await import('@/lib/generation-utils');
            const { COMMANDERS } = await import('@/data/card-database');

            const cards = await loadInventory(user.uid);
            const subs = await fetchUserSubscriptions(user.uid);
            const generationSlots = getGenerationSlots(user.uid);

            const formattedCards = cards.map(c => ({
                ...c,
                acquiredAt: (c.acquiredAt && 'toDate' in (c.acquiredAt as any))
                    ? (c.acquiredAt as any).toDate()
                    : new Date(c.acquiredAt as any)
            })) as InventoryCard[];

            // Get rental commanders from SLOTTED factions only
            const slottedFactionIds = generationSlots
                .filter(slot => slot.factionId)
                .map(slot => slot.factionId!);

            const rentalCommanders: InventoryCard[] = [];
            for (const factionId of slottedFactionIds) {
                const sub = subs.find(s => s.factionId === factionId && s.status === 'active');
                if (!sub) continue;

                const cmdTemplate = COMMANDERS.find(c => c.aiFactionId === factionId);
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
                            isRentalCard: true,
                            isLocked: true,
                            specialty: cmdTemplate.specialty
                        });
                    }
                }
            }

            const finalInventory = [...formattedCards, ...rentalCommanders] as InventoryCard[];
            setInventory(finalInventory);
            console.log(`[RefreshInventory] Updated with ${rentalCommanders.length} rental commanders`);
        } catch (error) {
            console.error('Failed to refresh inventory:', error);
        }
    }, [user?.uid]);

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
                mainDeck,          // [NEW]
                updateMainDeck,    // [NEW]
                refreshInventory   // [NEW] For slot-based commander rentals
            }}
        >
            {/* Subscription Warning Modal */}
            <SubscriptionWarningModal
                isOpen={showSubscriptionWarning}
                subscriptions={subscriptions}
                onConfirmLogout={() => {
                    setShowSubscriptionWarning(false);
                    // Call handleSignOut again, but this time it will skip the warning
                    handleSignOut();
                }}
                onCancel={() => setShowSubscriptionWarning(false)}
            />

            {isLoggingOut && (
                <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl pointer-events-auto">
                    {/* Top Left Effect - Similar to Login */}
                    <div className="absolute top-8 left-8 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" />
                        <span className="text-[10px] text-cyan-500 font-bold orbitron tracking-[0.3em] uppercase">Security Protocol Active</span>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-2 border-cyan-500/20 rounded-full animate-spin border-t-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black orbitron tracking-tighter text-white italic">
                                SECURING COMMAND DATA
                            </h2>
                            <div className="flex items-center justify-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-[11px] text-gray-400 font-mono uppercase tracking-widest">
                                    지휘관님의 정보를 안전하게 저장 중입니다...
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[9px] text-white/20 font-mono tracking-[0.5em] uppercase">
                        System Shutdown in Progress
                    </div>
                </div>
            )}
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
