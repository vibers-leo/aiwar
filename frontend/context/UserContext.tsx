'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
    updateCoins as firebaseUpdateCoins,
    updateTokens as firebaseUpdateTokens,
    updateExpAndLevel as firebaseUpdateExpAndLevel,
    saveUserProfile,
    checkAndRechargeTokens,
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
import { signOutUser } from '@/lib/firebase-auth';
import { addNotification } from '@/components/NotificationCenter';
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
    // [NEW] Quest System Integration
    quests: Quest[];
    trackMissionEvent: (action: string, amount?: number) => void;
    claimQuest: (questId: string) => Promise<boolean>;
    handleSignOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { user } = useFirebase();
    const { profile, reload: reloadProfile, loading: profileLoading } = useUserProfile();

    const [error, setError] = useState<string | null>(null);
    const [coins, setCoins] = useState(0);
    const [tokens, setTokens] = useState(0);
    const [level, setLevel] = useState(1);
    const [experience, setExperience] = useState(0);
    const [inventory, setInventory] = useState<InventoryCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [starterPackAvailable, setStarterPackAvailable] = useState(false);
    const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
    const [quests, setQuests] = useState<Quest[]>([]); // [NEW] Quest State
    const [isClaimingInSession, setIsClaimingInSession] = useState(false);
    const [mounted, setMounted] = useState(false);

    const isAdmin = user?.email === 'admin@example.com';

    const resetState = useCallback(() => {
        console.log("🧹 [UserContext] Resetting State to Defaults and clearing local storage.");
        setCoins(0);
        setTokens(0);
        setLevel(1);
        setExperience(0);
        setInventory([]);
        setSubscriptions([]);
        setIsClaimingInSession(false);
        setStarterPackAvailable(false);
        setQuests([]); // [NEW] Reset Quests
        setError(null);
        gameStorage.clearAllSessionData();
    }, []);

    const handleSignOut = useCallback(async () => {
        console.log("🚀 [Auth] Initiating Nuclear Sign Out...");

        // 1. Nuke all local data FIRST. This is synchronous.
        gameStorage.clearAllSessionData();

        // 2. Reset React state
        resetState();

        // 3. Then, sign out from Firebase
        await signOutUser();

        // 4. Force a reload to ensure a clean slate, just in case.
        window.location.reload();

        console.log("✅ [Auth] Sign Out complete. Local state nuked.");
    }, [resetState]);


    useEffect(() => {
        setMounted(true);
        console.log('✅ UserProvider Mounted - Version: 2026-01-04-STARTER-PACK-DEBUG-V3');
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (!user) {
            console.log("[Auth] No user detected. Resetting state and stopping loading.");
            resetState();
            setLoading(false);
            return;
        }

        if (user && profileLoading) {
            console.log(`[Auth] User ${user.uid} detected, waiting for profile...`);
            setLoading(true);
            return;
        }

        if (user && profile) {
            console.log(`[Auth] User ${user.uid} and profile loaded. Syncing data...`);
            setLoading(true);

            // [NEW] Load quests using local storage (for now)
            const loadedQuests = loadQuests();
            setQuests(loadedQuests);

            // [NEW] Load inventory and subscriptions with commander logic
            const syncUserData = async () => {
                try {
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

                    if (profile.level === 1 && profile.hasReceivedStarterPack && finalInventory.length === 0) {
                        console.log("[SafetySystem] Rescue: Found claimed flag but 0 cards. Re-distributing...");
                        await claimStarterPack(profile.nickname || '지휘관');
                    }

                    if (!profile.hasReceivedStarterPack && finalInventory.length === 0) {
                        console.log(`[StarterPack] ✅ User ELIGIBLE. (HasRecv: ${profile.hasReceivedStarterPack}, InvLen: ${finalInventory.length})`);
                        setStarterPackAvailable(true);
                    } else {
                        console.log(`[StarterPack] ❌ User NOT Eligible. (HasRecv: ${profile.hasReceivedStarterPack}, InvLen: ${finalInventory.length})`);
                        setStarterPackAvailable(false);
                    }
                } catch (error) {
                    console.error("[Auth] Failed to sync user data:", error);
                    setError("Failed to synchronize your account data. Please try again later.");
                } finally {
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
            await saveUserProfile({ tutorialCompleted: true }, user.uid);
            await reloadProfile();
            console.log("[UserContext] Tutorial status saved to Firebase. State will update.");
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

            const refreshedToken = await checkAndRechargeTokens(user.uid, profile.tokens, profile.lastTokenUpdate, fetchedSubscriptions);
            if (refreshedToken !== profile.tokens) setTokens(refreshedToken);

            const isTutorialCompleted = localStorage.getItem(`tutorial_completed_${user.uid}`);
            if (isTutorialCompleted && !isClaimingInSession && formattedInv.length === 0 && !profile.hasReceivedStarterPack) {
                setStarterPackAvailable(true);
            } else if (profile.hasReceivedStarterPack || formattedInv.length > 0) {
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
        try {
            await firebaseUpdateCoins(amount, user.uid);
            await reloadProfile();
        } catch (err) {
            console.error("Failed to add coins:", err);
        }
    };

    const addTokensByContext = async (amount: number) => {
        if (!mounted || !profile || !user) return;
        try {
            await firebaseUpdateTokens(amount, user.uid);
            await reloadProfile();
        } catch (err) {
            console.error("Failed to add tokens:", err);
        }
    };

    const addExperienceByContext = async (amount: number) => {
        if (!profile || !user) return { level: 1, experience: 0, leveledUp: false };

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

    const claimStarterPack = async (nickname: string): Promise<InventoryCard[]> => {
        if (!mounted || !user) return [];

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
            const isAlreadyClaimed = error.message === 'ALREADY_CLAIMED';
            let message = isAlreadyClaimed ? '이미 보급품을 수령하셨습니다.' : '스타터팩 지급 중 서버 오류가 발생했습니다.';
            if (!isAlreadyClaimed) window.alert(`[보급 오류] ${message}\n(에러 상세: ${error.message || 'Unknown'})`);
            addNotification({ type: isAlreadyClaimed ? 'warning' : 'error', title: isAlreadyClaimed ? '확인 완료' : '오류 발생', message: message, icon: isAlreadyClaimed ? 'ℹ️' : '⚠️' });
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

    // Render Error Screen if Critical Error exists
    if (error) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 text-white font-mono p-4 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h1 className="text-3xl font-black mb-4">SYSTEM CRITICAL FAILURE</h1>
                <p className="text-red-400 mb-8">{error}</p>
                <div className="flex gap-4">
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded font-bold">SYSTEM REBOOT (RELOAD)</button>
                    <button onClick={handleSignOut} className="px-6 py-2 border border-white/20 hover:bg-white/10 rounded">FORCE LOGOUT</button>
                </div>
                <p className="mt-8 text-xs text-gray-500">Error Code: DB_SYNC_STRICT_ENFORCEMENT</p>
            </div>
        );
    }

    return (
        <UserContext.Provider
            value={{
                coins, tokens, level, experience, user, profile, inventory, loading, refreshData,
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
