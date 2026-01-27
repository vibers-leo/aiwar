// Firebase 데이터베이스 유틸리티
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    getDocFromServer, // [NEW] Explicit server fetch
    query,
    where,
    serverTimestamp,
    increment,
    DocumentData,
    addDoc,
    orderBy,
    collectionGroup,
    limit,
    runTransaction,
    writeBatch,
    documentId
} from 'firebase/firestore';
import { createUniqueCardFromApplication } from './mythic-card-factory';
import app, { db, isFirebaseConfigured } from './firebase';
import { getAuth } from 'firebase/auth'; // [FIX] Added import
import { getUserId } from './firebase-auth';
// ... imports ...


// ... UserProfile interface ...

/**
 * [Jung-Gong-Beop] 스타터팩 수령 여부 서버 직접 확인
 * 캐시를 우회하여 확실한 상태를 가져옵니다.
 */
export async function checkStarterPackStatus(uid: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;
    try {
        const userRef = doc(db, 'users', uid, 'profile', 'data');
        const docSnap = await getDocFromServer(userRef); // Force server fetch
        if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            return !!data.hasReceivedStarterPack;
        }
        return false;
    } catch (error) {
        console.warn("[DB] Failed to check starter pack status from server, falling back to cache logic:", error);
        // Fallback to cache if server reachability fails
        return false;
    }
}
import { CATEGORY_TOKEN_BONUS, FACTION_CATEGORY_MAP, TIER_MULTIPLIER } from './token-constants';
import {
    TierConfig,
    TIER_CONFIGS,
    SubscriptionTier
} from './faction-subscription';
import { Card } from './types';

/**
 * Firestore는 undefined 값을 허용하지 않으므로 객체에서 제거하거나 null로 변환합니다.
 * FieldValue(serverTimestamp, increment 등)는 원본을 유지해야 합니다.
 */
export function cleanDataForFirestore(data: any): any {
    if (data === undefined) return null;
    if (data === null || typeof data !== 'object') return data;
    if (data instanceof Date) return data;

    // [CRITICAL] Firebase FieldValue detection (supports production mangled names like 'n', 'o', etc.)
    const constructorName = data.constructor?.name;
    if (
        (data._methodName && typeof data._methodName === 'string') ||
        (constructorName && (
            constructorName === 'FieldValue' ||
            constructorName === 'n' ||
            constructorName === 'o' ||
            constructorName.includes('FieldValue')
        ))
    ) {
        return data;
    }

    const cleaned: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value === undefined) continue;
            cleaned[key] = cleanDataForFirestore(value);
        }
    }
    return cleaned;
}


// ==================== 사용자 프로필 ====================

export interface UserProfile {
    uid?: string; // Added for Ranking
    nickname?: string;
    email?: string; // Added
    displayName?: string; // Added
    photoURL?: string; // Added
    coins: number;
    tokens: number;
    level: number;
    exp: number;
    avatarUrl?: string; // commander avatar
    hasReceivedStarterPack?: boolean;
    tutorialCompleted?: boolean;
    createdAt?: any;
    lastLogin?: any;
    lastTokenUpdate?: any; // [NEW] 토큰 자동 충전 기준 시간
    rating?: number; // PVP Rating
    wins?: number; // PVP Wins
    losses?: number; // PVP Losses
    rank?: number; // Ranking
    lastLogoutAt?: any; // Added for Secure Logout Sync
    // [NEW] Commander Profile
    commander?: {
        name: string;
        level: number;
        exp: number;
        avatarUrl?: string;
        title?: string; // 칭호
        stats?: {
            insight: number;
            efficiency: number;
            negotiation: number;
            leadership: number;
            mastery: number;
            fortune: number;
        };
    };
    research?: any; // [NEW] Full Research State (CommanderResearch)
}

const BASE_MAX_TOKENS = 1000;
const BASE_RECHARGE_RATE = 100;

/**
 * 카드팩 구매 트랜잭션 (재화 차감 + 카드 지급)
 */
export async function purchaseCardPackTransaction(
    userId: string,
    cards: Card[],
    price: number,
    currencyType: 'coin' | 'token'
): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase NOT_CONFIGURED');

    const userRef = doc(db, 'users', userId, 'profile', 'data');
    console.log(`[Transaction] Purchasing Pack for ${userId}. Price: ${price}, Currency: ${currencyType}`);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error('USER_NOT_FOUND');

            const userData = userDoc.data() as UserProfile;
            const currentBalance = currencyType === 'coin' ? userData.coins : userData.tokens;

            if (currentBalance < price) throw new Error('INSUFFICIENT_FUNDS');

            // 1. 재화 차감
            transaction.update(userRef, {
                [currencyType === 'coin' ? 'coins' : 'tokens']: increment(-price)
            });

            // 2. 카드 지급
            for (const card of cards) {
                const instanceId = `${card.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const cardRef = doc(db!, 'users', userId, 'inventory', instanceId);
                const cleanedCard = cleanDataForFirestore({
                    ...card,
                    instanceId,
                    acquiredAt: serverTimestamp()
                });
                transaction.set(cardRef, cleanedCard);
            }
        });
        console.log(`✅ 트랜잭션 성공: ${cards.length}매 지급, -${price} ${currencyType}`);
    } catch (error) {
        console.error('❌ 트랜잭션 실패:', error);
        throw error;
    }
}

/**
 * 스타터팩 수령 트랜잭션 (코인 지급 + 닉네임 설정 + 카드 지급)
 */
export async function claimStarterPackTransaction(
    userId: string,
    nickname: string,
    cards: Card[],
    coinReward: number = 1000
): Promise<void> {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase NOT_CONFIGURED');

    const userRef = doc(db, 'users', userId, 'profile', 'data');
    console.log(`[Transaction] Claiming Starter Pack for ${userId}. Reward: ${coinReward}`);

    try {
        await runTransaction(db, async (transaction) => {
            // 0. [CRITICAL] 닉네임 중복 체크 (Atomic)
            const nicknameRef = doc(db!, 'nicknames', nickname.toLowerCase());
            const nicknameDoc = await transaction.get(nicknameRef);

            if (nicknameDoc.exists()) {
                const ownerUid = nicknameDoc.data()?.uid;
                if (ownerUid !== userId) {
                    console.error(`[Transaction] Nickname ${nickname} is already taken by ${ownerUid}`);
                    throw new Error('ALREADY_CLAIMED_NICKNAME');
                }
            }

            const userDoc = await transaction.get(userRef);
            const exists = userDoc.exists();
            const userData = exists ? userDoc.data() as UserProfile : null;

            if (userData?.hasReceivedStarterPack) {
                const isBrokenState = (userData.coins || 0) === 0 && (userData.level || 1) <= 1;
                if (!isBrokenState) {
                    console.warn(`[Transaction] User ${userId} already claimed starter pack.`);
                    throw new Error('ALREADY_CLAIMED');
                }
            }

            // 1. 프로필 업데이트
            const commanderCard = cards.length > 4 ? cards[4] : null;
            const initialAvatarUrl = commanderCard?.imageUrl || '/assets/cards/commander_default.png';

            const profileUpdate: any = {
                userId,
                nickname,
                hasReceivedStarterPack: true,
                lastLogin: serverTimestamp(),
                tutorialCompleted: true,
                avatarUrl: initialAvatarUrl
            };

            // 닉네임 선점 문서 생성/업데이트
            transaction.set(nicknameRef, {
                uid: userId,
                name: nickname,
                updatedAt: serverTimestamp()
            });

            if (exists) {
                profileUpdate.coins = increment(coinReward);
                if (userData?.tokens === undefined) profileUpdate.tokens = 1000;
                if (userData?.level === undefined) profileUpdate.level = 1;
                if (userData?.exp === undefined) profileUpdate.exp = 0;

                transaction.set(userRef, profileUpdate, { merge: true });
            } else {
                transaction.set(userRef, {
                    ...profileUpdate,
                    coins: coinReward,
                    tokens: 1000,
                    level: 1,
                    exp: 0,
                    createdAt: serverTimestamp()
                });
            }

            // 2. 카드 지급
            for (const card of cards) {
                const instanceId = `${card.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const cardRef = doc(db!, 'users', userId, 'inventory', instanceId);
                const cleanedCard = cleanDataForFirestore({
                    ...card,
                    instanceId,
                    acquiredAt: serverTimestamp()
                });
                transaction.set(cardRef, cleanedCard);
            }
        });
        console.log(`✅ 스타터팩 트랜잭션 성공: ${nickname}, ${cards.length}매 지급`);
    } catch (error: any) {
        console.error('❌ 스타터팩 트랜잭션 실패:', error);
        // [Rescue] 닉네임만 중복인 경우 명확한 에러 전달
        if (error.message === 'ALREADY_CLAIMED_NICKNAME') {
            throw new Error('NICKNAME_DUPLICATED');
        }
        throw error;
    }
}

/**
 * 활성 구독 목록을 기반으로 보너스 계산
 */
function calculateTokenBonuses(subscriptions: { factionId: string; tier: SubscriptionTier }[]) {
    let bonusRecharge = 0;
    let bonusMaxCap = 0;
    let bonusSpeedMinutes = 0; // 감소할 분 (기본 60분 간격)

    subscriptions.forEach(sub => {
        const categoryKey = FACTION_CATEGORY_MAP[sub.factionId];
        if (!categoryKey) return;

        const bonusConfig = CATEGORY_TOKEN_BONUS[categoryKey];
        const multiplier = TIER_MULTIPLIER[sub.tier] || 1;

        if (bonusConfig.type === 'recharge_amount') {
            bonusRecharge += (bonusConfig.baseValue || 0) * multiplier;
        } else if (bonusConfig.type === 'max_capacity') {
            bonusMaxCap += (bonusConfig.baseValue || 0) * multiplier;
        } else if (bonusConfig.type === 'recharge_speed') {
            bonusSpeedMinutes += (bonusConfig.baseValue || 0) * multiplier;
        }
    });

    return { bonusRecharge, bonusMaxCap, bonusSpeedMinutes };
}

/**
 * 군단 구독 처리 (생성 또는 갱신)
 */
export async function subscribeToFaction(userId: string, factionId: string, tier: import('./faction-subscription').SubscriptionTier): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return false;
    try {
        const subscriptionsRef = collection(db, 'users', userId, 'subscriptions');

        // 1. 기존 동일 팩션 구독 확인 (활성 상태인 것)
        const q = query(subscriptionsRef, where('factionId', '==', factionId), where('status', '==', 'active'));
        const snapshot = await getDocs(q);

        const now = serverTimestamp(); // Use serverTimestamp for Firestore
        // For local calculation of nextPaymentDate, we might need a JS Date object, 
        // but for now let's just save the start date.
        // Subscription logic usually requires Cloud Functions for recurring payments.
        // Here we just implement the "Purchase" part.

        // Calculate next payment date (e.g., 30 days later) - Approximate for client display
        const nextPayment = new Date();
        nextPayment.setDate(nextPayment.getDate() + 30);

        if (!snapshot.empty) {
            // 이미 구독 중 -> 업데이트 (Tier 변경)
            const docId = snapshot.docs[0].id;
            await updateDoc(doc(subscriptionsRef, docId), {
                tier: tier,
                startDate: now, // Reset start date on tier change? Or keep original? Let's reset for MVP.
                nextPaymentDate: nextPayment,
                autoRenew: true
            });
        } else {
            // 신규 구독
            await addDoc(subscriptionsRef, {
                factionId,
                tier,
                status: 'active',
                startDate: now,
                nextPaymentDate: nextPayment,
                autoRenew: true
            });
        }

        return true;
    } catch (error) {
        console.error('Subscription error:', error);
        return false;
    }
}

/**
 * 유저의 활성 구독 목록 조회
 */
export async function fetchUserSubscriptions(userId: string): Promise<any[]> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not ready for subscriptions');
        return [];
    }
    try {
        const subscriptionsRef = collection(db, 'users', userId, 'subscriptions');
        const q = query(subscriptionsRef, where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
    }
}

/**
 * 토큰 자동 충전 체크 및 업데이트
 * @param subscriptions - [{ factionId: 'chatgpt', tier: 'pro' }, ...]
 */
export async function checkAndRechargeTokens(
    userId: string,
    currentTokens: number,
    lastUpdate: any,
    subscriptions: { factionId: string; tier: SubscriptionTier }[] = [],
    level: number = 1
): Promise<number> {
    if (!lastUpdate) {
        // 첫 실행 시 현재 시간 기록 - 프로필 데이터 하위 문서에 기록해야 함
        const userRef = doc(db!, 'users', userId, 'profile', 'data');
        await updateDoc(userRef, { lastTokenUpdate: serverTimestamp() });
        return currentTokens;
    }

    const { bonusRecharge, bonusMaxCap, bonusSpeedMinutes } = calculateTokenBonuses(subscriptions);

    // 기본 60분 - 보너스 단축 (최소 10분 간격은 유지)
    const rechargeIntervalMinutes = Math.max(10, 60 - bonusSpeedMinutes);

    // 최종 충전량 (시간당 기본 100 + 보너스)
    // 간격이 줄어들면, '1회 충전당 지급량'을 조절하거나, '시간당 총량'을 유지하거나 선택해야 함.
    // 여기서는 '시간당 총량' 개념보다 '충전 주기'가 빨라지는 것으로 기획됨 (이미지 카테고리).
    // => 단순히 (경과시간 / 주기) * (기본양 + 보너스양) 으로 계산.

    const rechargeAmountPerCycle = BASE_RECHARGE_RATE + bonusRecharge;
    // [Jung-Gong-Beop] Max Cap Formula: Base (1000) + (Level - 1) * 100 + bonusMaxCap
    const maxTokens = BASE_MAX_TOKENS + ((level - 1) * 100) + bonusMaxCap;

    const now = new Date();
    const lastDate = lastUpdate.toDate ? lastUpdate.toDate() : new Date(lastUpdate);
    const diffMs = now.getTime() - lastDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // 충전 주기(Interval) 횟수 계산
    const cycles = Math.floor(diffMinutes / rechargeIntervalMinutes);

    if (cycles >= 1) {
        // 실제 충전량
        const totalRecharge = cycles * rechargeAmountPerCycle;

        let newTokens = currentTokens + totalRecharge;

        // 최대 보유량 체크
        if (newTokens > maxTokens) {
            // 이미 초과 상태면 유지, 아니면 max로
            if (currentTokens < maxTokens) {
                newTokens = maxTokens;
            } else {
                return currentTokens;
            }
        }

        const userRef = doc(db!, 'users', userId, 'profile', 'data');
        // lastTokenUpdate를 '이번에 충전된 주기만큼' 앞으로 당김 (정확한 주기 유지)
        const cyclesMs = cycles * rechargeIntervalMinutes * 60 * 1000;
        const newLastUpdate = new Date(lastDate.getTime() + cyclesMs);

        await updateDoc(userRef, {
            tokens: newTokens,
            lastTokenUpdate: newLastUpdate
        });

        console.log(`🔋 토큰 충전: +${newTokens - currentTokens} (주기: ${cycles}회, 간격: ${rechargeIntervalMinutes}분)`);
        return newTokens;
    }

    return currentTokens;
}

/**
 * 사용자 프로필 저장
 */
export async function saveUserProfile(profile: Partial<UserProfile>, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다. localStorage를 사용하세요.');
        return;
    }

    try {
        const userId = uid || await getUserId();
        const userRef = doc(db, 'users', userId, 'profile', 'data');
        // [Jung-Gong-Beop] Root document for efficient sorting/filtering (Leaderboard)
        const rootUserRef = doc(db, 'users', userId);

        const cleanedProfile = cleanDataForFirestore(profile);

        const updates = {
            ...cleanedProfile,
            lastLogin: serverTimestamp()
        };

        // 1. Update Profile Subcollection (Detailed Data)
        await setDoc(userRef, updates, { merge: true });

        // 2. Sync Key Stats to Root Document (For Leaderboard Query)
        // [Jung-Gong-Beop] Wrap in try-catch so permission errors on root doc don't fail the whole save
        try {
            const rootUpdates: any = { lastLogin: serverTimestamp(), userId };
            if (profile.nickname) rootUpdates.nickname = profile.nickname;
            if (profile.avatarUrl) rootUpdates.avatarUrl = profile.avatarUrl;
            if (profile.rating !== undefined) rootUpdates.rating = profile.rating;
            if (profile.level !== undefined) rootUpdates.level = profile.level;
            if (profile.wins !== undefined) rootUpdates.wins = profile.wins;
            if (profile.losses !== undefined) rootUpdates.losses = profile.losses;
            if (profile.rank !== undefined) rootUpdates.rank = profile.rank;

            rootUpdates.updatedAt = serverTimestamp();

            // Ensure we don't wipe out existing root data
            await setDoc(rootUserRef, rootUpdates, { merge: true });
            console.log('✅ Firebase 프로필 저장 성공 (Synced to Root):', profile);
        } catch (syncError: any) {
            console.warn('⚠️ Leaderboard sync failed (Root doc permission?):', syncError.message);
            // Do NOT throw here, as the main profile update (Step 1) succeeded.
        }
    } catch (error) {
        console.error('❌ 프로필 저장 실패:', error);
        throw error;
    }
}

/**
 * 리더보드 가져오기 (Top N)
 */
export async function fetchLeaderboard(limitCount: number = 10): Promise<UserProfile[]> {
    if (!isFirebaseConfigured || !db) return [];
    try {
        // Query root 'users' collection where we synced the stats
        const usersRef = collection(db, 'users');
        // Filter out users with no rating (optional, but good practice)
        // Note: 'rating' field must exist. 
        const q = query(
            usersRef,
            orderBy('rating', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        })) as UserProfile[];
    } catch (error: any) {
        if (error?.message?.includes('FAILED_PRECONDITION') || error?.message?.includes('index required')) {
            console.warn("⚠️ Leaderboard index is not yet built. Please create it in the Firebase Console.");
            return [];
        }
        console.error("❌ Failed to fetch leaderboard:", error);
        return [];
    }
}


/**
 * 사용자 프로필 로드
 */
export async function loadUserProfile(uid?: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다. localStorage를 사용하세요.');
        return null;
    }

    try {
        const userId = uid || await getUserId();
        const userRef = doc(db, 'users', userId, 'profile', 'data');
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ Firebase 프로필 로드 성공:', data);
            }
            return data;
        }

        // [SAFETY FIX] 프로필이 없다고 해서 무조건 기본값을 덮어쓰면 안됨 (네트워크 오류 등).
        // 기존 유저(가입한지 5분이 지난)인데 프로필이 없다? -> DB 오류일 가능성 높음.
        // 신규 유저(가입한지 5분 이내)라면 기본값 생성 허용.
        const auth = getAuth(app!);
        const currentUser = auth.currentUser;
        const isNewUser = currentUser?.metadata.creationTime
            ? (Date.now() - new Date(currentUser.metadata.creationTime).getTime() < 5 * 60 * 1000)
            : true; // 메타데이터 없으면 신규로 간주 (보수적 접근)

        if (!isNewUser) {
            console.warn(`[DB] 🚨 기존 유저(${userId})의 프로필을 찾을 수 없습니다. 데이터 유실 가능성 확인 필요.`);
            // 여기서 throw를 하면 앱이 멈추므로, 일단은 "빈 프로필"을 리턴하되, 저장은 하지 않음으로써
            // 실수로 0원을 DB에 쓰는 것을 방지합니다.
            // 하지만 리턴하면 UI는 0원으로 보일 것임.
            // 차라리 에러를 던져서 "재시도"를 유도하는게 낫습니다.
            throw new Error('PROFILE_NOT_FOUND_FOR_EXISTING_USER');
        }

        // 프로필이 없으면 기본값 생성 (신규 유저인 경우만)
        const defaultProfile: UserProfile = {
            coins: 0,
            tokens: 1000,
            level: 1,
            exp: 0,
            hasReceivedStarterPack: false,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        };

        // [Fix] merge: true를 사용하여 초기화 시 기존 필드 유실 방지
        await setDoc(userRef, defaultProfile, { merge: true });
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ 기본 프로필 생성(신규 유저):', defaultProfile);
        }
        return defaultProfile;
    } catch (error) {
        console.error('❌ 프로필 로드 실패:', error);
        // 에러를 무시하고 null을 리턴하면 "없는 유저"로 취급되어 0원으로 초기화될 위험이 있음.
        // 상위 호출자에게 에러를 전파해야 함.
        throw error;
    }
}


/**
 * 닉네임 중복 체크
 */
/**
 * 닉네임 중복 체크 (엄격 모드: nicknames 컬렉션 조회)
 */
export async function checkNicknameUnique(nickname: string, currentUid?: string): Promise<boolean> {
    if (!isFirebaseConfigured || !db) return true;

    try {
        const nicknameRef = doc(db, 'nicknames', nickname.toLowerCase());
        const docSnap = await getDoc(nicknameRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // 본인이 이미 선점한 경우라면 중복이 아님
            if (data.uid === currentUid) return true;
            return false;
        }

        return true;
    } catch (error: any) {
        console.error('❌ 닉네임 중복 체크 실패:', error);

        // [Permissions] 명확한 권한 오류는 상위로 전파하여 "중복" 메시지와 구분함
        if (error?.code === 'permission-denied') {
            throw new Error('PERMISSION_DENIED');
        }

        return false; // 그 외 오류는 보수적으로 "중복임"을 반환
    }
}

/**
 * 닉네임 업데이트 (원자적 업데이트)
 */
export async function updateNickname(nickname: string, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
        const userId = uid || await getUserId();
        const nicknameRef = doc(db, 'nicknames', nickname.toLowerCase());
        const userRef = doc(db, 'users', userId, 'profile', 'data');

        await runTransaction(db, async (transaction) => {
            const nickDoc = await transaction.get(nicknameRef);
            if (nickDoc.exists() && nickDoc.data().uid !== userId) {
                throw new Error('DUPLICATE_NICKNAME');
            }

            // 1. 닉네임 인덱스 업데이트
            transaction.set(nicknameRef, {
                uid: userId,
                name: nickname,
                updatedAt: serverTimestamp()
            });

            // 2. 유저 프로필 업데이트
            transaction.update(userRef, {
                nickname,
                lastLogin: serverTimestamp()
            });
        });

        localStorage.setItem('nickname', nickname);
        console.log('✅ 닉네임 업데이트 성공:', nickname);
    } catch (error: any) {
        console.error('❌ 닉네임 업데이트 실패:', error);
        if (error.message === 'DUPLICATE_NICKNAME') {
            throw new Error('이미 사용 중인 닉네임입니다.');
        }
        throw error;
    }
}

/**
 * 레거시 닉네임 마이그레이션 (중복 정리)
 * @description 모든 유저를 스캔하여 nicknames 컬렉션을 채우고, 중복된 경우 가입일이 늦은 유저에게 변경 유도 플래그를 설정합니다.
 */
export async function migrateExistingNicknames(): Promise<{ fixed: number; duplicates: number }> {
    if (!isFirebaseConfigured || !db) return { fixed: 0, duplicates: 0 };

    console.log('🚀 [Migration] Starting nickname cleanup...');
    let fixed = 0;
    let duplicates = 0;

    try {
        // 1. 모든 유저 정보 가져오기
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const allUsers: any[] = [];

        for (const userDoc of snapshot.docs) {
            const profileRef = doc(db, 'users', userDoc.id, 'profile', 'data');
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
                const data = profileSnap.data();
                if (data.nickname) {
                    allUsers.push({
                        uid: userDoc.id,
                        nickname: data.nickname,
                        createdAt: data.createdAt?.toDate?.() || new Date(0)
                    });
                }
            }
        }

        // 2. 닉네임별로 그룹화 및 정렬 (가입일 순)
        const nicknameGroups: Record<string, any[]> = {};
        allUsers.forEach(u => {
            const key = u.nickname.toLowerCase();
            if (!nicknameGroups[key]) nicknameGroups[key] = [];
            nicknameGroups[key].push(u);
        });

        const batch = writeBatch(db);

        for (const [key, users] of Object.entries(nicknameGroups)) {
            // 가입일 기준 오름차순 (가장 먼저 가입한 유저가 0번 인덱스)
            users.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            const winner = users[0];
            const losers = users.slice(1);

            // Winner: nicknames 컬렉션에 정식 등록
            const nickRef = doc(db, 'nicknames', key);
            batch.set(nickRef, {
                uid: winner.uid,
                name: winner.nickname,
                updatedAt: serverTimestamp()
            });
            fixed++;

            // Losers: 닉네임 변경 필요 플래그 설정
            for (const loser of losers) {
                const loserProfileRef = doc(db, 'users', loser.uid, 'profile', 'data');
                batch.update(loserProfileRef, {
                    needsNicknameChange: true,
                    oldNickname: loser.nickname,
                    nickname: `${loser.nickname}#${loser.uid.slice(0, 4)}` // 임시 변경
                });
                duplicates++;
                console.warn(`[Migration] Duplicate found: ${loser.nickname} (User: ${loser.uid}). Priority given to ${winner.uid}`);
            }
        }

        await batch.commit();
        console.log(`✅ [Migration] Completed. Fixed: ${fixed}, Duplicates: ${duplicates}`);
        return { fixed, duplicates };
    } catch (error) {
        console.error('❌ [Migration] Failed:', error);
        throw error;
    }
}
/**
 * 코인 업데이트 (증감)
 * @description Uses a transaction to safely update coins, preventing negative balances.
 */
export async function updateCoins(amount: number, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not configured. Skipping coin update.');
        return;
    }

    const userId = uid || await getUserId();
    if (!userId) {
        console.error('User ID not found for coin update.');
        return;
    }

    const userRef = doc(db, 'users', userId, 'profile', 'data');

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error(`User profile ${userId} not found.`);
            }

            const currentCoins = userDoc.data().coins || 0;
            const newCoins = currentCoins + amount;

            // [Defensive Check] Prevent balance from going negative
            if (newCoins < 0) {
                throw new Error('Operation failed: Insufficient coins.');
            }

            transaction.update(userRef, { coins: newCoins });
        });

        console.log(`[Transaction] Coin update successful for ${userId}: ${amount > 0 ? '+' : ''}${amount}`);
    } catch (error) {
        console.error('Coin update transaction failed:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

/**
 * 토큰 업데이트 (증감)
 * @description Uses a transaction to safely update tokens, preventing negative balances.
 */
export async function updateTokens(amount: number, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not configured. Skipping token update.');
        return;
    }

    const userId = uid || await getUserId();
    if (!userId) {
        console.error('User ID not found for token update.');
        return;
    }

    const userRef = doc(db, 'users', userId, 'profile', 'data');

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error(`User profile ${userId} not found.`);
            }

            const currentTokens = userDoc.data().tokens || 0;
            const newTokens = currentTokens + amount;

            // [Defensive Check] Prevent balance from going negative
            if (newTokens < 0) {
                throw new Error('Operation failed: Insufficient tokens.');
            }

            transaction.update(userRef, { tokens: newTokens });
        });

        console.log(`[Transaction] Token update successful for ${userId}: ${amount > 0 ? '+' : ''}${amount}`);
    } catch (error) {
        console.error('Token update transaction failed:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

/**
 * 경험치 및 레벨 업데이트
 */
export async function updateExpAndLevel(exp: number, level: number, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return;
    }

    try {
        const userId = uid || await getUserId();
        const userRef = doc(db, 'users', userId, 'profile', 'data');
        // [Jung-Gong-Beop] Root document for Leaderboard sync
        const rootRef = doc(db, 'users', userId);

        await updateDoc(userRef, {
            exp,
            level
        });

        // Sync level to root doc (fire and forget acceptable, but cleaner to await or catch)
        await setDoc(rootRef, { level, updatedAt: serverTimestamp() }, { merge: true })
            .catch(err => console.warn(`[Sync] Failed to sync level to root:`, err));

        console.log(`✅ 경험치/레벨 업데이트: Lv.${level}, ${exp} XP (Synced to Root)`);
    } catch (error) {
        console.error('❌ 경험치/레벨 업데이트 실패:', error);
        throw error;
    }
}

// ==================== 인벤토리 ====================

export interface InventoryCard {
    id: string;
    name: string;
    power: number;
    rarity: string;
    acquiredAt?: any;
    imageUrl?: string;
    templateId?: string;
    isCommanderCard?: boolean;
    description?: string;
    specialty?: string;
    aiFactionId?: string;
    type?: string;
    level?: number;
    experience?: number;
    stats?: any;
    instanceId?: string;
    ownerId?: string;
    isLocked?: boolean;
}

/**
 * 인벤토리에 카드 추가
 */
export async function addCardToInventory(card: InventoryCard): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return;
    }

    try {
        const userId = await getUserId();
        const cardRef = doc(db, 'users', userId, 'inventory', card.id);

        await setDoc(cardRef, {
            ...card,
            acquiredAt: serverTimestamp()
        });

        console.log('✅ 카드 추가:', card.name);
    } catch (error) {
        console.error('❌ 카드 추가 실패:', error);
        throw error;
    }
}

/**
 * 인벤토리 로드
 */
export async function loadInventory(): Promise<InventoryCard[]> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return [];
    }

    try {
        const userId = await getUserId();
        const inventoryRef = collection(db, 'users', userId, 'inventory');
        const querySnapshot = await getDocs(inventoryRef);

        const cards = querySnapshot.docs.map(doc => doc.data() as InventoryCard);
        console.log(`✅ 인벤토리 로드: ${cards.length}개 카드`);
        return cards;
    } catch (error) {
        console.error('❌ 인벤토리 로드 실패:', error);
        return [];
    }
}

// ==================== 팩션 ====================

export interface FactionData {
    unlocked: string[];
    slots: any[];
    synergy?: any;
}

/**
 * 팩션 데이터 저장
 */
export async function saveFactionData(data: FactionData): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return;
    }

    try {
        const userId = await getUserId();
        const factionRef = doc(db, 'users', userId, 'factions', 'data');

        await setDoc(factionRef, data, { merge: true });
        console.log('✅ 팩션 데이터 저장');
    } catch (error) {
        console.error('❌ 팩션 데이터 저장 실패:', error);
        throw error;
    }
}

/**
 * 팩션 데이터 로드
 */
export async function loadFactionData(): Promise<FactionData | null> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return null;
    }

    try {
        const userId = await getUserId();
        const factionRef = doc(db, 'users', userId, 'factions', 'data');
        const docSnap = await getDoc(factionRef);

        if (docSnap.exists()) {
            console.log('✅ 팩션 데이터 로드');
            return docSnap.data() as FactionData;
        }

        return {
            unlocked: [],
            slots: []
        };
    } catch (error) {
        console.error('❌ 팩션 데이터 로드 실패:', error);
        return null;
    }
}

// ==================== 구독 ====================

/**
 * 군단 구독 데이터 저장
 */
export async function saveSubscriptions(subscriptions: any[]): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return;
    }

    try {
        const userId = await getUserId();
        const subRef = doc(db, 'users', userId, 'factions', 'subscriptions');

        await setDoc(subRef, {
            data: subscriptions,
            updatedAt: serverTimestamp()
        });
        console.log('✅ 구독 데이터 Firebase 저장 성공');
    } catch (error) {
        console.error('❌ 구독 데이터 저장 실패:', error);
        throw error;
    }
}

/**
 * 군단 구독 데이터 로드
 */
export async function loadSubscriptions(): Promise<any[] | null> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return null;
    }

    try {
        const userId = await getUserId();
        const subRef = doc(db, 'users', userId, 'factions', 'subscriptions');
        const docSnap = await getDoc(subRef);

        if (docSnap.exists()) {
            console.log('✅ 구독 데이터 Firebase 로드 성공');
            return docSnap.data().data || [];
        }

        return null;
    } catch (error) {
        console.error('❌ 구독 데이터 로드 실패:', error);
        return null;
    }
}

// ==================== 미션 ====================

export interface MissionData {
    date: string;
    missions: any[];
    lastReset?: any;
}

/**
 * 미션 데이터 저장
 */
export async function saveMissionData(data: MissionData): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return;
    }

    try {
        const userId = await getUserId();
        const missionRef = doc(db, 'users', userId, 'missions', 'daily');

        await setDoc(missionRef, {
            ...data,
            lastReset: serverTimestamp()
        }, { merge: true });

        console.log('✅ 미션 데이터 저장');
    } catch (error) {
        console.error('❌ 미션 데이터 저장 실패:', error);
        throw error;
    }
}

/**
 * 미션 데이터 로드
 */
export async function loadMissionData(): Promise<MissionData | null> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return null;
    }

    try {
        const userId = await getUserId();
        const missionRef = doc(db, 'users', userId, 'missions', 'daily');
        const docSnap = await getDoc(missionRef);

        if (docSnap.exists()) {
            console.log('✅ 미션 데이터 로드');
            return docSnap.data() as MissionData;
        }

        return {
            date: '',
            missions: []
        };
    } catch (error) {
        console.error('❌ 미션 데이터 로드 실패:', error);
        return null;
    }
}

// ==================== 업적 ====================

export interface AchievementData {
    id: string;
    completed: boolean;
    claimed: boolean;
    progress: number;
    completedAt?: any;
}

/**
 * 업적 데이터 저장
 */
export async function saveAchievement(achievement: AchievementData): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return;
    }

    try {
        const userId = await getUserId();
        const achievementRef = doc(db, 'users', userId, 'achievements', achievement.id);

        await setDoc(achievementRef, {
            ...achievement,
            completedAt: achievement.completed ? serverTimestamp() : null
        }, { merge: true });

        console.log('✅ 업적 저장:', achievement.id);
    } catch (error) {
        console.error('❌ 업적 저장 실패:', error);
        throw error;
    }
}

/**
 * 모든 업적 로드
 */
export async function loadAchievements(): Promise<AchievementData[]> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase가 설정되지 않았습니다.');
        return [];
    }

    try {
        const userId = await getUserId();
        const achievementsRef = collection(db, 'users', userId, 'achievements');
        const querySnapshot = await getDocs(achievementsRef);

        const achievements = querySnapshot.docs.map(doc => doc.data() as AchievementData);
        console.log(`✅ 업적 로드: ${achievements.length}개`);
        return achievements;
    } catch (error) {
        console.error('❌ 업적 로드 실패:', error);
        return [];
    }
}
// ==================== 고객 지원 (Support) ====================

export interface SupportTicket {
    id?: string;
    userId: string;
    userNickname?: string;
    type: 'error' | 'idea';
    title: string;
    description: string;
    status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'closed';
    createdAt: any;
    updatedAt?: any;
    adminReply?: string;
    adminResponse?: {
        message: string;
        respondedAt: any;
        respondedBy: string;
    };
}

/**
 * 티켓 생성 (오류 제보 / 아이디어)
 */
/**
 * 티켓 생성 (오류 제보 / 아이디어)
 */
export async function createSupportTicket(data: { title: string, description: string, type: 'error' | 'idea' }): Promise<string> {
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured');
    }

    try {
        let userId = 'anonymous';
        let nickname = 'Guest';

        const { getCurrentUser } = await import('./firebase-auth');
        const currentUser = getCurrentUser();

        if (currentUser) {
            userId = currentUser.uid;
            const userProfile = await loadUserProfile(userId);
            if (userProfile?.nickname) nickname = userProfile.nickname;
        }

        // [Jung-Gong-Beop] Use root collection 'support_tickets' for easier admin querying without Collection Group Index
        const ticketsRef = collection(db, 'support_tickets');

        const docRef = await addDoc(ticketsRef, cleanDataForFirestore({
            ...data,
            userId: userId,
            userNickname: nickname,
            status: 'open',
            createdAt: serverTimestamp()
        }));

        console.log('✅ 티켓 생성 성공 (Root Collection):', data.title);
        return docRef.id;
    } catch (error) {
        console.error('❌ 티켓 생성 실패:', error);
        throw error;
    }
}

/**
 * 티켓 목록 로드 (관리자용)
 */
export async function loadSupportTickets(status?: string): Promise<SupportTicket[]> {
    if (!isFirebaseConfigured || !db) {
        return [];
    }

    try {
        // [Jung-Gong-Beop] Fetch from root 'support_tickets' collection
        const ticketsRef = collection(db, 'support_tickets');

        // Simple query, no index needed for basic sort if collection is small, 
        // but 'orderBy' still might need composite index if filtered.
        // For 'support_tickets', a simple index on createdAt matches standard usage.
        let q = query(ticketsRef, orderBy('createdAt', 'desc'));

        if (status) {
            q = query(ticketsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
    } catch (error) {
        console.error('❌ 티켓 로드 실패:', error);
        return [];
    }
}

/**
 * 티켓 상태 업데이트 (관리자용)
 */
export async function updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'rejected', reply?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
        // [Fix] Try to find the ticket in the legacy top-level collection first
        let ticketRef = doc(db, 'support_tickets', ticketId);
        let docSnap = await getDoc(ticketRef);

        // If not found, search in all user 'support' subcollections
        if (!docSnap.exists()) {
            console.log(`[Admin] Ticket ${ticketId} not in legacy collection. Searching subcollections...`);
            const q = query(collectionGroup(db, 'support'), where(documentId(), '==', ticketId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                ticketRef = snapshot.docs[0].ref;
            } else {
                throw new Error('Ticket not found in any collection');
            }
        }

        const updateData: any = { status, updatedAt: serverTimestamp() };
        if (reply) {
            updateData.adminReply = reply;
        }

        await updateDoc(ticketRef, updateData);
        console.log('✅ 티켓 상태 업데이트 성공:', ticketId, status);
    } catch (error) {
        console.error('❌ 티켓 업데이트 실패:', error);
        throw error;
    }
}

// ==================== 유니크 신청 (Unique Requests) ====================

export interface UniqueRequest {
    id: string;
    userId: string;
    userNickname: string;
    name: string;
    description: string;
    imageUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    adminComment?: string;
    materialCardIds?: string[]; // Optional: if we want to track what cards were consumed
}

/**
 * 유니크 신청 생성
 */
export async function createUniqueRequest(data: { name: string, description: string, imageUrl: string, userNickname: string }): Promise<string> {
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured');
    }

    try {
        const userId = await getUserId();
        // [Fix] Redirect to user-owned subcollection to bypass top-level permission issues
        const requestsRef = collection(db, 'users', userId, 'unique_requests');

        const docRef = await addDoc(requestsRef, cleanDataForFirestore({
            ...data,
            userId,
            status: 'pending',
            createdAt: serverTimestamp()
        }));

        console.log('✅ 유니크 신청 생성:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ 유니크 신청 실패:', error);
        throw error;
    }
}

/**
 * 유니크 신청 목록 로드 (관리자용)
 */
export async function loadUniqueRequests(status?: string): Promise<UniqueRequest[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
        // [Fix] Use collectionGroup to fetch unique requests from all users
        const requestsRef = collectionGroup(db, 'unique_requests');
        let q = query(requestsRef, orderBy('createdAt', 'desc'));

        if (status) {
            q = query(requestsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UniqueRequest));
    } catch (error) {
        console.error('❌ 유니크 신청 로드 실패:', error);
        return [];
    }
}

/**
 * 유니크 신청 상태 업데이트 (관리자용)
 */
export async function updateUniqueRequestStatus(requestId: string, status: 'pending' | 'approved' | 'rejected', comment?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
        // [Fix] Try to find the request in the legacy top-level collection first
        let requestRef = doc(db, 'unique_requests', requestId);
        let docSnap = await getDoc(requestRef); // Need to use getDoc

        if (!docSnap.exists()) {
            console.log(`[Admin] Request ${requestId} not in legacy collection. Searching subcollections...`);
            const q = query(collectionGroup(db, 'unique_requests'), where(documentId(), '==', requestId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                requestRef = snapshot.docs[0].ref;
            } else {
                throw new Error('Unique request not found in any collection');
            }
        }

        const updateData: any = { status, updatedAt: serverTimestamp() };
        if (comment) {
            updateData.adminComment = comment;
        }

        await updateDoc(requestRef, updateData);
        console.log('✅ 유니크 신청 업데이트 성공:', requestId, status);

        // [NEW] 만약 승인(approved)되었다면, 실제 카드를 생성하여 유저에게 지급
        if (status === 'approved') {
            const success = await createUniqueCardFromApplication(requestId);
            if (!success) {
                console.error('⚠️ 카드 생성에 실패했습니다. 수동 지급이 필요할 수 있습니다.');
                // 실패했다고 신청 상태를 다시 돌리지는 않음 (관리자가 알아야 함)
                if (comment) {
                    await updateDoc(requestRef, { adminComment: comment + " (시스템 오류: 카드 자동 지급 실패)" });
                }
            }
        }
    } catch (error) {
        console.error('❌ 유니크 신청 업데이트 실패:', error);
        throw error;
    }
}
/**
 * 리더보드 데이터 로드 (실제 DB 연동)
 * [FIX] 모든 유저 표시 (기본 레이팅 1000 포함)
 * [FIX] 단순 rating 정렬로 변경 (인덱스 불필요)
 */
export async function getLeaderboardData(limitCount = 100): Promise<UserProfile[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
        const usersRef = collection(db, 'users');

        // [FIX] 기존에는 rating 필드가 있는 유저만 가져왔으나(orderBy),
        // 초기 유저나 마이그레이션이 안 된 유저는 rating 필드가 없을 수 있음.
        // 따라서 일단 가져와서 메모리에서 정렬함.
        const q = query(
            usersRef,
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        console.log(`[Leaderboard] Fetched ${snapshot.size} raw documents (Unsorted)`);

        let users = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            let userProfile = {
                uid: docSnapshot.id,
                nickname: data.nickname, // Try root doc first
                level: data.level || 1,
                avatarUrl: data.avatarUrl,
                rating: data.rating !== undefined ? data.rating : 1000, // Default to 1000
                rank: data.rank,
                wins: data.wins || 0,
                losses: data.losses || 0,
            } as UserProfile;

            // [Fallback] If nickname missing in root, fetch from subcollection
            if (!userProfile.nickname) {
                try {
                    const subProfileRef = doc(db!, 'users', docSnapshot.id, 'profile', 'data');
                    const subSnap = await getDoc(subProfileRef);

                    if (subSnap.exists()) {
                        const subData = subSnap.data();
                        userProfile.nickname = subData.nickname;
                        userProfile.level = subData.level !== undefined ? subData.level : userProfile.level;
                        userProfile.avatarUrl = subData.avatarUrl || userProfile.avatarUrl;
                        // Subprofile might have stats too?
                        if (subData.rating !== undefined) userProfile.rating = subData.rating;

                        // [Self-Healing] Sync found data to root for next time
                        if (userProfile.nickname) {
                            const rootRef = doc(db!, 'users', docSnapshot.id);
                            setDoc(rootRef, {
                                nickname: userProfile.nickname,
                                level: userProfile.level,
                                avatarUrl: userProfile.avatarUrl || '',
                                rating: userProfile.rating,
                                updatedAt: serverTimestamp()
                            }, { merge: true });
                        }
                    }
                } catch (err) {
                    console.error(`[Leaderboard] Failed to fetch subprofile for ${docSnapshot.id}`, err);
                }
            }

            // 닉네임이 없어도 표시 (프론트엔드에서 Player_XXXX 처리)
            return userProfile;
        }));

        // null 제거 (혹시 모를 오류 대비)
        const validUsers = users.filter((u): u is UserProfile => u !== null);

        // [Memory Sort] Rating 내림차순 정렬
        validUsers.sort((a, b) => (b.rating || 1000) - (a.rating || 1000));

        // [Rank Assignment] 순위 부여
        validUsers.forEach((u, index) => {
            u.rank = index + 1;
        });

        console.log(`[Leaderboard] Processed ${validUsers.length} valid rankings`);
        return validUsers;

    } catch (error) {
        console.error('❌ 리더보드 로드 실패:', error);
        return [];
    }
}

/**
 * 개별 유저 프로필 가져오기
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        return {
            uid: userSnap.id,
            ...userSnap.data()
        } as UserProfile;
    } catch (error) {
        console.error('❌ 유저 프로필 로드 실패:', error);
        return null;
    }
}

// ==================== 스토리 진행도 (Story Progress) ====================

export interface StoryProgressData {
    chapterId: string;
    completedStages: string[];
    unlockedStages: string[];
    updatedAt: any;
}

/**
 * 스토리 진행도 저장 (DB)
 */
export async function saveStoryProgress(
    userId: string,
    chapterId: string,
    completedStages: string[],
    unlockedStages: string[]
): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
        const progressRef = doc(db, 'users', userId, 'progress', 'story');

        await setDoc(progressRef, {
            [chapterId]: {
                completedStages,
                unlockedStages,
                updatedAt: serverTimestamp()
            }
        }, { merge: true });

        console.log(`✅ Story progress saved for ${chapterId}`);
    } catch (error) {
        console.error('❌ Failed to save story progress:', error);
    }
}

/**
 * 스토리 진행도 로드 (DB)
 */
export async function loadStoryProgressFromDB(userId: string): Promise<Record<string, { completedStages: string[], unlockedStages: string[] }> | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
        const progressRef = doc(db, 'users', userId, 'progress', 'story');
        const snapshot = await getDoc(progressRef);

        if (snapshot.exists()) {
            return snapshot.data() as Record<string, { completedStages: string[], unlockedStages: string[] }>;
        }
        return null;
    } catch (error) {
        console.error('❌ Failed to load story progress:', error);
        return null;
    }
}

// ==================== 계정 데이터 관리 (Account Management) ====================

/**
 * 컬렉션 내 모든 문서 삭제 (Helper)
 */
async function deleteSubcollection(userId: string, ...pathSegments: string[]) {
    if (!isFirebaseConfigured || !db) return;

    try {
        const colRef = collection(db, 'users', userId, ...pathSegments);
        const snapshot = await getDocs(colRef);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`🗑️ Deleted subcollection: ${pathSegments.join('/')} (${snapshot.size} docs)`);
    } catch (e) {
        console.error(`❌ Failed to delete subcollection ${pathSegments.join('/')}:`, e);
    }
}

/**
 * 계정 데이터 완전 초기화 (Hard Reset)
 */
export async function resetAccountData(userId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
        console.log(`🚨 Starting Hard Reset for user: ${userId}`);

        // 1. Reset Profile to Default
        const userRef = doc(db, 'users', userId, 'profile', 'data');
        console.log(`[Reset] Resetting coins to 0 for ${userId}`);
        console.log(`[Reset] Resetting tokens to 100 for ${userId}`);
        const defaultProfile = {
            coins: 0,
            tokens: 100,
            level: 1,
            exp: 0,
            hasReceivedStarterPack: false,
            // lastLogin update excluded to avoid confusion, but updatedAt is good
            updatedAt: serverTimestamp()
        };

        await setDoc(userRef, defaultProfile, { merge: true });

        // 2. Delete All Subcollections
        await deleteSubcollection(userId, 'inventory');
        await deleteSubcollection(userId, 'progress', 'story'); // Story progress: users/{uid}/progress/story (collection?) No, 'progress' is col, 'story' is doc.
        // Wait, schema is: users/{uid}/progress/story (doc) containing map.
        // So we need to delete the 'story' doc in 'progress' collection.
        // My helper does "delete all docs in collection".
        // users/{uid}/progress is a collection. 'story' is a doc.
        // So deleteSubcollection(userId, 'progress') will delete 'story' doc. Correct.
        await deleteSubcollection(userId, 'progress');

        await deleteSubcollection(userId, 'factions'); // factions/data, factions/subscriptions (docs in 'factions' collection)

        await deleteSubcollection(userId, 'subscriptions'); // Just in case
        await deleteSubcollection(userId, 'achievements');
        await deleteSubcollection(userId, 'missions');

        console.log('✅ Account Data Reset Complete.');
    } catch (error) {
        console.error('❌ Reset Account Data Failed:', error);
        throw error;
    }
}

// ==================== 연구소 시스템 (Research System) ====================

import type { CommanderResearch } from './research-system';

/**
 * 연구 데이터 저장
 */
export async function saveResearchToFirestore(research: CommanderResearch, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not configured. Skipping research save.');
        return;
    }

    try {
        const userId = uid || await getUserId();
        const researchRef = doc(db, 'users', userId, 'data', 'research');

        const cleanedResearch = cleanDataForFirestore({
            ...research,
            updatedAt: serverTimestamp()
        });

        await setDoc(researchRef, cleanedResearch, { merge: true });
        console.log('✅ Research data saved to Firestore');
    } catch (error) {
        console.error('❌ Failed to save research:', error);
        throw error;
    }
}

/**
 * 연구 데이터 로드
 */
export async function loadResearchFromFirestore(uid?: string): Promise<CommanderResearch | null> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not configured.');
        return null;
    }

    try {
        const userId = uid || await getUserId();
        const researchRef = doc(db, 'users', userId, 'data', 'research');
        const docSnap = await getDoc(researchRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as CommanderResearch;
            console.log('✅ Research data loaded from Firestore');
            return data;
        }

        return null;
    } catch (error) {
        console.error('❌ Failed to load research:', error);
        return null;
    }
}

// ==================== 스토리 모드 진행도 (Stage Progress) ====================

export interface StageProgress {
    clearedStages: string[];
    stageDetails: {
        [stageId: string]: {
            stars: number;
            bestScore: number;
            completedAt: any;
        };
    };
    currentStage: string;
}

/**
 * 스토리 진행도 저장
 */
export async function saveStageProgressToFirestore(progress: StageProgress, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not configured. Skipping stage progress save.');
        return;
    }

    try {
        const userId = uid || await getUserId();
        const progressRef = doc(db, 'users', userId, 'data', 'stageProgress');

        const cleanedProgress = cleanDataForFirestore({
            ...progress,
            updatedAt: serverTimestamp()
        });

        await setDoc(progressRef, cleanedProgress, { merge: true });
        console.log('✅ Stage progress saved to Firestore');
    } catch (error) {
        console.error('❌ Failed to save stage progress:', error);
        throw error;
    }
}

/**
 * 스토리 진행도 로드
 */
export async function loadStageProgressFromFirestore(uid?: string): Promise<StageProgress | null> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not configured.');
        return null;
    }

    try {
        const userId = uid || await getUserId();
        const progressRef = doc(db, 'users', userId, 'data', 'stageProgress');
        const docSnap = await getDoc(progressRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as StageProgress;
            console.log('✅ Stage progress loaded from Firestore');
            return data;
        }

        return null;
    } catch (error) {
        console.error('❌ Failed to load stage progress:', error);
        return null;
    }
}

// ==================== 지원 티켓 시스템 (Support Tickets) ====================


/**
 * 사용자의 지원 티켓 목록 조회
 */
export async function getUserSupportTickets(uid?: string): Promise<SupportTicket[]> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not configured.');
        return [];
    }

    try {
        const userId = uid || await getUserId();
        // [Jung-Gong-Beop] Query root collection filtering by userId
        const ticketsRef = collection(db, 'support_tickets');
        const q = query(ticketsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const tickets: SupportTicket[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SupportTicket));

        console.log(`✅ Loaded ${tickets.length} support tickets (Root)`);
        return tickets;
    } catch (error) {
        console.error('❌ Failed to load support tickets:', error);
        return [];
    }
}

/**
 * 지원 티켓 상태 업데이트 (관리자용)
 */
export async function updateSupportTicketStatus(
    userId: string,
    ticketId: string,
    status: SupportTicket['status'],
    adminResponse?: { message: string; respondedBy: string }
): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured');
    }

    try {
        const ticketRef = doc(db, 'users', userId, 'support', ticketId);

        const updateData: any = {
            status,
            updatedAt: serverTimestamp()
        };

        if (adminResponse) {
            updateData.adminResponse = {
                ...adminResponse,
                respondedAt: serverTimestamp()
            };
        }

        await updateDoc(ticketRef, updateData);
        console.log('✅ Support ticket updated');
    } catch (error) {
        console.error('❌ Failed to update support ticket:', error);
        throw error;
    }
}

// ==================== 덱 구성 (Deck Configuration) ====================

export interface DeckConfig {
    id?: string;
    name: string;
    cardInstanceIds: string[];
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
}

/**
 * 덱 저장
 */
export async function saveDeckToFirestore(deck: DeckConfig, uid?: string): Promise<string> {
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured');
    }

    try {
        const userId = uid || await getUserId();
        const decksRef = collection(db, 'users', userId, 'decks');

        const deckData = cleanDataForFirestore({
            ...deck,
            updatedAt: serverTimestamp(),
            createdAt: deck.createdAt || serverTimestamp()
        });

        if (deck.id) {
            // Update existing
            const deckRef = doc(db, 'users', userId, 'decks', deck.id);
            await setDoc(deckRef, deckData, { merge: true });
            console.log('✅ Deck updated');
            return deck.id;
        } else {
            // Create new
            const docRef = await addDoc(decksRef, deckData);
            console.log('✅ Deck created');
            return docRef.id;
        }
    } catch (error) {
        console.error('❌ Failed to save deck:', error);
        throw error;
    }
}

/**
 * 사용자의 모든 덱 로드
 */
export async function loadDecksFromFirestore(uid?: string): Promise<DeckConfig[]> {
    if (!isFirebaseConfigured || !db) {
        console.warn('Firebase not configured.');
        return [];
    }

    try {
        const userId = uid || await getUserId();
        const decksRef = collection(db, 'users', userId, 'decks');
        const querySnapshot = await getDocs(decksRef);

        const decks: DeckConfig[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as DeckConfig));

        console.log(`✅ Loaded ${decks.length} decks`);
        return decks;
    } catch (error) {
        console.error('❌ Failed to load decks:', error);
        return [];
    }
}

/**
 * 덱 삭제
 */
export async function deleteDeckFromFirestore(deckId: string, uid?: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured');
    }

    try {
        const userId = uid || await getUserId();
        const deckRef = doc(db, 'users', userId, 'decks', deckId);
        await updateDoc(deckRef, { isActive: false, updatedAt: serverTimestamp() });
        console.log('✅ Deck deactivated');
    } catch (error) {
        console.error('❌ Failed to delete deck:', error);
        throw error;
    }
}

// ==================== 관리자 기능 (Admin Functions) ====================

/**
 * 모든 유저의 튜토리얼/스타터팩 상태 조회 (관리자용)
 */
export async function getAllUsersWithStatus(): Promise<Array<{
    uid: string;
    nickname: string;
    email?: string;
    level: number;
    coins: number;
    tokens: number;
    tutorialCompleted: boolean;
    hasReceivedStarterPack: boolean;
    createdAt: any;
    lastLogin: any;
    inventoryCount?: number;
}>> {
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured');
    }

    try {
        // Query all user profiles
        const usersSnapshot = await getDocs(collectionGroup(db, 'profile'));

        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            const uid = doc.ref.parent.parent?.id || 'unknown';

            return {
                uid,
                nickname: data.nickname || 'Unknown',
                email: data.email,
                level: data.level || 1,
                coins: data.coins || 0,
                tokens: data.tokens || 0,
                tutorialCompleted: data.tutorialCompleted === true,
                hasReceivedStarterPack: data.hasReceivedStarterPack === true,
                createdAt: data.createdAt,
                lastLogin: data.lastLogin,
                inventoryCount: 0 // Will be populated separately if needed
            };
        });

        console.log(`✅ Loaded ${users.length} users for admin view`);
        return users;
    } catch (error) {
        console.error('❌ Failed to load users:', error);
        throw error;
    }
}

/**
 * 특정 유저의 스타터팩 수령 상태 강제 업데이트 (관리자용 마이그레이션)
 */
export async function migrateUserStarterPackStatus(uid: string, hasReceived: boolean): Promise<void> {
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured');
    }

    try {
        await saveUserProfile({ hasReceivedStarterPack: hasReceived }, uid);
        console.log(`✅ Migrated starter pack status for user ${uid}: ${hasReceived}`);
    } catch (error) {
        console.error(`❌ Failed to migrate user ${uid}:`, error);
        throw error;
    }
}
