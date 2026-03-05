
import {
    getDatabase,
    ref,
    set,
    get,
    update,
    remove,
    onValue,
    off,
    push,
    serverTimestamp,
    onDisconnect
} from 'firebase/database';
import app from './firebase';
import { MiniGameMode } from './minigame-system';
import { Card } from './types';

export interface MiniGameRoom {
    id: string;
    mode: MiniGameMode;
    hostId: string;
    hostName: string;
    guestId?: string;
    guestName?: string;
    status: 'waiting' | 'ready' | 'starting' | 'playing' | 'finished';
    hostReady: boolean;
    guestReady: boolean;
    hostCards: Card[];
    guestCards: Card[];
    winner?: string;
    createdAt: number;
    updatedAt: number;
    phase: 'select' | 'ready' | 'clash' | 'result';
}

/**
 * 실시간 미니게임 방 생성
 */
export async function createMiniGameRoom(hostId: string, hostName: string, mode: MiniGameMode): Promise<string> {
    const db = getDatabase(app || undefined);
    const roomsRef = ref(db, 'minigame_rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;

    const newRoom: MiniGameRoom = {
        id: roomId,
        mode,
        hostId,
        hostName,
        status: 'waiting',
        hostReady: false,
        guestReady: false,
        hostCards: [],
        guestCards: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        phase: 'select'
    };

    await set(newRoomRef, newRoom);

    // 연결 끊김 시 방 자동 제거 (대기실 버전)
    // onDisconnect(newRoomRef).remove(); 

    return roomId;
}

/**
 * 실시간 미니게임 방 참가
 */
export async function joinMiniGameRoom(roomId: string, guestId: string, guestName: string): Promise<boolean> {
    const db = getDatabase(app || undefined);
    const roomRef = ref(db, `minigame_rooms/${roomId}`);

    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return false;

    const room = snapshot.val() as MiniGameRoom;
    if (room.guestId && room.guestId !== guestId) return false; // 이미 다른 사람이 있음

    await update(roomRef, {
        guestId,
        guestName,
        status: 'ready'
    });

    return true;
}

/**
 * 방 목록 리스너
 */
export function listenToMiniGameRooms(onUpdate: (rooms: MiniGameRoom[]) => void) {
    const db = getDatabase(app || undefined);
    const roomsRef = ref(db, 'minigame_rooms');

    const unsubscribe = onValue(roomsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const rooms = Object.values(data) as MiniGameRoom[];
            // 최근 순으로 정렬 및 대기/준비 중인 방만 표시
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
export function listenToMiniGameRoom(roomId: string, onUpdate: (room: MiniGameRoom) => void) {
    const db = getDatabase(app || undefined);
    const roomRef = ref(db, `minigame_rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
        if (snapshot.exists()) {
            onUpdate(snapshot.val() as MiniGameRoom);
        }
    });

    return () => off(roomRef);
}

/**
 * 준비 상태 업데이트
 */
export async function toggleReady(roomId: string, playerId: string, isHost: boolean, ready: boolean) {
    const db = getDatabase(app || undefined);
    const roomRef = ref(db, `minigame_rooms/${roomId}`);

    const updates: any = {};
    if (isHost) {
        updates.hostReady = ready;
    } else {
        updates.guestReady = ready;
    }

    await update(roomRef, updates);
}

/**
 * 선택한 카드 제출
 */
export async function submitCards(roomId: string, isHost: boolean, cards: Card[]) {
    const db = getDatabase(app || undefined);
    const roomRef = ref(db, `minigame_rooms/${roomId}`);

    const updates: any = {};
    if (isHost) {
        updates.hostCards = cards;
    } else {
        updates.guestCards = cards;
    }

    await update(roomRef, updates);
}

/**
 * 게임 페이즈 전환 (주로 호스트가 제어)
 */
export async function updatePhase(roomId: string, phase: MiniGameRoom['phase']) {
    const db = getDatabase(app || undefined);
    const roomRef = ref(db, `minigame_rooms/${roomId}`);
    await update(roomRef, { phase, updatedAt: Date.now() });
}

/**
 * 게임 종료 및 정리
 */
export async function finishMiniGame(roomId: string, winnerId: string) {
    const db = getDatabase(app || undefined);
    const roomRef = ref(db, `minigame_rooms/${roomId}`);
    await update(roomRef, {
        status: 'finished',
        winner: winnerId,
        updatedAt: Date.now()
    });

    // 1분 후 방 데이터 삭제 (선택 사항)
    setTimeout(() => {
        remove(roomRef);
    }, 60000);
}
