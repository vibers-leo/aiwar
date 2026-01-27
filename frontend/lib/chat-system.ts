import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    addDoc,
    serverTimestamp,
    orderBy,
    onSnapshot,
    limit,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatMessage {
    id?: string;
    senderId: string;
    text: string;
    timestamp: any;
}

export interface ChatRoom {
    id: string;
    participants: string[];
    lastMessage?: string;
    lastTimestamp?: any;
    unreadCount?: Record<string, number>;
}

/**
 * Get or create a chat room between two users
 */
export async function getOrCreateChatRoom(user1Id: string, user2Id: string): Promise<string> {
    if (!db) throw new Error("Database not initialized");

    // Sort IDs to ensure stable room ID for the same pair
    const sortedIds = [user1Id, user2Id].sort();
    const roomId = `direct_${sortedIds[0]}_${sortedIds[1]}`;

    const roomRef = doc(db, 'chatRooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
        await setDoc(roomRef, {
            id: roomId,
            participants: sortedIds,
            createdAt: serverTimestamp(),
            lastMessage: '',
            lastTimestamp: serverTimestamp()
        });
    }

    return roomId;
}

/**
 * Send a message to a chat room
 */
export async function sendMessage(roomId: string, senderId: string, text: string) {
    if (!db) return { success: false };

    try {
        const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
        await addDoc(messagesRef, {
            senderId,
            text,
            timestamp: serverTimestamp()
        });

        // Update room's last message
        const roomRef = doc(db, 'chatRooms', roomId);
        await updateDoc(roomRef, {
            lastMessage: text,
            lastTimestamp: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false };
    }
}

/**
 * Subscribe to messages in a room
 */
export function subscribeToMessages(roomId: string, callback: (messages: ChatMessage[]) => void) {
    if (!db) return () => { };

    const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ChatMessage[];
        callback(messages);
    });
}

/**
 * List all chat rooms for a user
 */
export function subscribeToUserChatRooms(userId: string, callback: (rooms: ChatRoom[]) => void) {
    if (!db) return () => { };

    const roomsRef = collection(db, 'chatRooms');
    const q = query(roomsRef, where('participants', 'array-contains', userId), orderBy('lastTimestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const rooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ChatRoom[];
        callback(rooms);
    });
}
