import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';
import {
    getDatabase,
    ref,
    set,
    get,
    update,
    remove,
    onValue,
    off,
    push
} from 'firebase/database';
import app, { db } from './firebase';
import { ClashCard, ClashPlayer, ClashRoom, CARD_NAMES, RARITY_POWER, ClashCardType, ClashRarity } from './card-clash-types';

/**
 * 신규 플레이어 초기화 (10장 랜덤 카드 지급)
 */
export async function initializeClashPlayer(userId: string, username: string): Promise<ClashPlayer> {
    if (!db) throw new Error('Firestore not initialized');

    const playerRef = doc(db, 'clash_players', userId);
    const playerSnap = await getDoc(playerRef);

    if (playerSnap.exists()) {
        return playerSnap.data() as ClashPlayer;
    }

    // 신규 플레이어: 10장 랜덤 카드 생성
    const initialCards = generateRandomCards(10);

    const newPlayer: ClashPlayer = {
        userId,
        username,
        cards: initialCards,
        totalGames: 0,
        wins: 0,
        losses: 0
    };

    await setDoc(playerRef, newPlayer);
    return newPlayer;
}

/**
 * 랜덤 카드 생성
 */
export function generateRandomCards(count: number): ClashCard[] {
    const cards: ClashCard[] = [];
    const types: ClashCardType[] = ['rock', 'paper', 'scissors'];
    const rarities: ClashRarity[] = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'legendary'];

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        const namePool = CARD_NAMES[type];
        const name = namePool[Math.floor(Math.random() * namePool.length)];

        cards.push({
            id: `clash-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${name}`,
            type,
            rarity,
            power: RARITY_POWER[rarity] + Math.floor(Math.random() * 50)
        });
    }

    return cards;
}

/**
 * 플레이어 정보 가져오기
 */
export async function getClashPlayer(userId: string): Promise<ClashPlayer | null> {
    if (!db) return null;
    const playerRef = doc(db, 'clash_players', userId);
    const playerSnap = await getDoc(playerRef);
    return playerSnap.exists() ? playerSnap.data() as ClashPlayer : null;
}

/**
 * 방 생성 (Realtime DB)
 */
export async function createClashRoom(
    hostId: string,
    hostName: string,
    mode: ClashRoom['mode'] = 'sudden-death'
): Promise<string> {
    console.log(`[CardClash] Creating room... Host: ${hostName}, Mode: ${mode}`);

    try {
        const rtdb = getDatabase(app || undefined);
        // console.log(`[CardClash] RTDB URL: ${rtdb.app.options.databaseURL}`);

        const roomsRef = ref(rtdb, 'clash_rooms');
        const newRoomRef = push(roomsRef);
        const roomId = newRoomRef.key!;

        const newRoom: ClashRoom = {
            id: roomId,
            mode,
            hostId,
            hostName,
            status: 'waiting',
            hostBet: [],
            guestBet: [],
            hostSelected: [],
            guestSelected: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        console.log(`[CardClash] Saving room data. ID: ${roomId}`);

        // DB 저장에 5초 타임아웃 설정
        await Promise.race([
            set(newRoomRef, newRoom),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DB_WRITE_TIMEOUT: 방 생성 시간이 초과되었습니다. 네트워크 상태나 DB 설정을 확인해주세요.')), 5000))
        ]);

        console.log(`[CardClash] Room created successfully.`);

        // 연결 끊김 시 자동 방 삭제
        const { onDisconnect } = await import('firebase/database');
        onDisconnect(newRoomRef).remove();

        // 5분 후 자동 삭제 (타임아웃)
        setTimeout(() => {
            get(newRoomRef).then(snapshot => {
                if (snapshot.exists() && snapshot.val().status === 'waiting') {
                    remove(newRoomRef);
                }
            });
        }, 5 * 60 * 1000);

        return roomId;
    } catch (error) {
        console.error("Failed to create clash room:", error);
        throw error;
    }
}

/**
 * 방 참가
 */
export async function joinClashRoom(roomId: string, guestId: string, guestName: string): Promise<boolean> {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);

    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return false;

    const room = snapshot.val() as ClashRoom;
    if (room.guestId) return false;

    await update(roomRef, {
        guestId,
        guestName,
        status: 'betting',
        updatedAt: Date.now()
    });

    return true;
}

/**
 * 방 목록 리스너
 */
export function listenToClashRooms(onUpdate: (rooms: ClashRoom[]) => void) {
    const rtdb = getDatabase(app || undefined);
    const roomsRef = ref(rtdb, 'clash_rooms');

    const unsubscribe = onValue(roomsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const rooms = Object.values(data) as ClashRoom[];
            onUpdate(rooms.filter(r => r.status !== 'finished').sort((a, b) => b.createdAt - a.createdAt));
        } else {
            onUpdate([]);
        }
    });

    return () => off(roomsRef);
}

/**
 * 특정 방 리스너
 */
export function listenToClashRoom(roomId: string, onUpdate: (room: ClashRoom) => void) {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
        if (snapshot.exists()) {
            onUpdate(snapshot.val() as ClashRoom);
        }
    });

    return () => off(roomRef);
}

/**
 * 베팅 제출
 */
export async function submitBet(roomId: string, isHost: boolean, betCards: ClashCard[]) {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);

    const updates: any = {
        updatedAt: Date.now()
    };

    if (isHost) {
        updates.hostBet = betCards;
    } else {
        updates.guestBet = betCards;
    }

    await update(roomRef, updates);

    // 양측 베팅 완료 시 selecting으로 전환
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
        const room = snapshot.val() as ClashRoom;
        if (room.hostBet.length > 0 && room.guestBet.length > 0) {
            await update(roomRef, { status: 'selecting' });
        }
    }
}

/**
 * 카드 선택 제출
 */
export async function submitSelection(roomId: string, isHost: boolean, selectedCards: ClashCard[]) {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);

    const updates: any = {
        updatedAt: Date.now()
    };

    if (isHost) {
        updates.hostSelected = selectedCards;
    } else {
        updates.guestSelected = selectedCards;
    }

    await update(roomRef, updates);

    // 양측 선택 완료 시 revealing으로 전환
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
        const room = snapshot.val() as ClashRoom;
        if (room.hostSelected.length > 0 && room.guestSelected.length > 0) {
            await update(roomRef, { status: 'revealing' });
        }
    }
}

/**
 * 게임 결과 처리 (Firestore Transaction)
 */
export async function processClashResult(
    roomId: string,
    winnerId: string,
    loserId: string,
    winnerGains: ClashCard[],
    loserLosses: ClashCard[]
): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    await runTransaction(db, async (transaction) => {
        const winnerRef = doc(db!, 'clash_players', winnerId);
        const loserRef = doc(db!, 'clash_players', loserId);

        const winnerSnap = await transaction.get(winnerRef);
        const loserSnap = await transaction.get(loserRef);

        if (!winnerSnap.exists() || !loserSnap.exists()) {
            throw new Error('Player not found');
        }

        const winner = winnerSnap.data() as ClashPlayer;
        const loser = loserSnap.data() as ClashPlayer;

        // 승자: 카드 추가 + 승리 기록
        transaction.update(winnerRef, {
            cards: [...winner.cards, ...winnerGains],
            wins: winner.wins + 1,
            totalGames: winner.totalGames + 1
        });

        // 패자: 카드 제거 + 패배 기록
        const remainingCards = loser.cards.filter(
            card => !loserLosses.find(lc => lc.id === card.id)
        );

        transaction.update(loserRef, {
            cards: remainingCards,
            losses: loser.losses + 1,
            totalGames: loser.totalGames + 1
        });
    });

    // Realtime DB 방 상태 업데이트
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);
    await update(roomRef, {
        status: 'finished',
        winner: winnerId,
        updatedAt: Date.now()
    });
}

/**
 * 방 삭제
 */
export async function deleteClashRoom(roomId: string) {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);
    const chatRef = ref(rtdb, `clash_chats/${roomId}`);

    await remove(roomRef);
    await remove(chatRef); // 채팅 내역도 함께 삭제
}

/**
 * 하트비트 전송 (연결 유지)
 */
export async function sendHeartbeat(roomId: string, isHost: boolean) {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);

    const updates: any = {
        updatedAt: Date.now()
    };

    if (isHost) {
        updates.hostConnected = true;
        updates.hostLastHeartbeat = Date.now();
    } else {
        updates.guestConnected = true;
        updates.guestLastHeartbeat = Date.now();
    }

    await update(roomRef, updates);
}

/**
 * 연결 끊김 감지
 */
export function checkConnection(lastHeartbeat?: number): boolean {
    if (!lastHeartbeat) return false;
    const now = Date.now();
    return (now - lastHeartbeat) < 15000; // 15초 이내
}

/**
 * 실시간 상태 알림 (타이핑 인디케이터 등)
 */
export async function updatePlayerStatus(
    roomId: string,
    isHost: boolean,
    status: 'betting' | 'selecting' | 'ready' | 'idle'
) {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);

    const field = isHost ? 'hostStatus' : 'guestStatus';
    await update(roomRef, {
        [field]: status,
        updatedAt: Date.now()
    });
}

/**
 * 연결 끊김으로 인한 자동 패배 처리
 */
export async function processDisconnectDefeat(
    roomId: string,
    disconnectedPlayerId: string,
    connectedPlayerId: string,
    disconnectedPlayerBet: ClashCard[],
    connectedPlayerBet: ClashCard[]
): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    // 연결된 플레이어가 승리, 연결 끊긴 플레이어가 패배
    await runTransaction(db, async (transaction) => {
        const winnerRef = doc(db!, 'clash_players', connectedPlayerId);
        const loserRef = doc(db!, 'clash_players', disconnectedPlayerId);

        const winnerSnap = await transaction.get(winnerRef);
        const loserSnap = await transaction.get(loserRef);

        if (!winnerSnap.exists() || !loserSnap.exists()) {
            throw new Error('Player not found');
        }

        const winner = winnerSnap.data() as ClashPlayer;
        const loser = loserSnap.data() as ClashPlayer;

        // 승자: 상대방 베팅 카드 획득 + 승리 기록
        transaction.update(winnerRef, {
            cards: [...winner.cards, ...disconnectedPlayerBet],
            wins: winner.wins + 1,
            totalGames: winner.totalGames + 1
        });

        // 패자: 베팅 카드 소실 + 패배 기록
        const remainingCards = loser.cards.filter(
            card => !disconnectedPlayerBet.find(bc => bc.id === card.id)
        );

        transaction.update(loserRef, {
            cards: remainingCards,
            losses: loser.losses + 1,
            totalGames: loser.totalGames + 1
        });
    });

    // Realtime DB 방 상태 업데이트
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);
    await update(roomRef, {
        status: 'finished',
        winner: connectedPlayerId,
        disconnectDefeat: true, // 연결 끊김으로 인한 패배 표시
        updatedAt: Date.now()
    });
}


/**
 * 재대결 요청
 */
export async function requestRematch(roomId: string, requesterId: string): Promise<void> {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);

    await update(roomRef, {
        rematchRequestedBy: requesterId,
        rematchAccepted: false,
        updatedAt: Date.now()
    });
}

/**
 * 재대결 수락 및 새 방 생성
 */
export async function acceptRematch(
    oldRoomId: string,
    hostId: string,
    hostName: string,
    guestId: string,
    guestName: string,
    mode: ClashRoom['mode']
): Promise<string> {
    const rtdb = getDatabase(app || undefined);

    // 기존 방에 수락 표시
    const oldRoomRef = ref(rtdb, `clash_rooms/${oldRoomId}`);
    await update(oldRoomRef, {
        rematchAccepted: true,
        updatedAt: Date.now()
    });

    // 새 방 생성
    const roomsRef = ref(rtdb, 'clash_rooms');
    const newRoomRef = push(roomsRef);
    const newRoomId = newRoomRef.key!;

    const newRoom: ClashRoom = {
        id: newRoomId,
        mode,
        hostId,
        hostName,
        guestId,
        guestName,
        status: 'betting',
        hostBet: [],
        guestBet: [],
        hostSelected: [],
        guestSelected: [],
        hostConnected: true,
        guestConnected: true,
        hostLastHeartbeat: Date.now(),
        guestLastHeartbeat: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    await set(newRoomRef, newRoom);

    // 연결 끊김 시 자동 방 삭제
    const { onDisconnect } = await import('firebase/database');
    onDisconnect(newRoomRef).remove();

    // 기존 방 삭제 (1초 후)
    setTimeout(() => {
        remove(oldRoomRef);
    }, 1000);

    return newRoomId;
}

/**
 * 재대결 요청 취소
 */
export async function cancelRematch(roomId: string): Promise<void> {
    const rtdb = getDatabase(app || undefined);
    const roomRef = ref(rtdb, `clash_rooms/${roomId}`);

    await update(roomRef, {
        rematchRequestedBy: null,
        rematchAccepted: false,
        updatedAt: Date.now()
    });
}

/**
 * 욕설 필터링
 */
export function filterProfanity(message: string): { filtered: string; hasProfanity: boolean } {
    const { PROFANITY_WORDS } = require('./card-clash-types');
    let filtered = message;
    let hasProfanity = false;

    PROFANITY_WORDS.forEach((word: string) => {
        const regex = new RegExp(word, 'gi');
        if (regex.test(filtered)) {
            hasProfanity = true;
            filtered = filtered.replace(regex, '*'.repeat(word.length));
        }
    });

    return { filtered, hasProfanity };
}

/**
 * 채팅 메시지 전송
 */
export async function sendChatMessage(
    roomId: string,
    senderId: string,
    senderName: string,
    message: string
): Promise<void> {
    const rtdb = getDatabase(app || undefined);
    const chatRef = ref(rtdb, `clash_chats/${roomId}`);
    const newMessageRef = push(chatRef);

    const { filtered, hasProfanity } = filterProfanity(message);

    const chatMessage = {
        id: newMessageRef.key!,
        senderId,
        senderName,
        message: filtered,
        timestamp: Date.now(),
        filtered: hasProfanity
    };

    await set(newMessageRef, chatMessage);
}

/**
 * 채팅 메시지 리스너
 */
export function listenToChatMessages(
    roomId: string,
    onUpdate: (messages: any[]) => void
) {
    const rtdb = getDatabase(app || undefined);
    const chatRef = ref(rtdb, `clash_chats/${roomId}`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const messages = Object.values(data).sort((a: any, b: any) => a.timestamp - b.timestamp);
            onUpdate(messages);
        } else {
            onUpdate([]);
        }
    });

    return () => off(chatRef);
}

/**
 * 채팅 삭제 (방 종료 시)
 */
export async function deleteChatMessages(roomId: string): Promise<void> {
    const rtdb = getDatabase(app || undefined);
    const chatRef = ref(rtdb, `clash_chats/${roomId}`);
    await remove(chatRef);
}
