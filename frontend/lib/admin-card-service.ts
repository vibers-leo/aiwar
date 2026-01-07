import { db, storage, isFirebaseConfigured } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { CardTemplate } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getAuth } from 'firebase/auth';

export interface CardMetadata {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    videoUrl?: string;
    hoverSound?: string;
    hoverVideo?: string;
    updatedAt: any;
    updatedBy?: string;
}

// Helper to ensure Firebase is initialized
function getFirebase() {
    if (!isFirebaseConfigured || !db || !storage) {
        throw new Error("Firebase is not initialized");
    }
    return { db: db as Firestore, storage: storage as FirebaseStorage };
}

/**
 * 카드 메타데이터를 Firestore에서 로드합니다.
 * 커스텀 데이터가 없으면 null을 반환합니다.
 */
export async function loadCardMetadata(cardId: string): Promise<CardMetadata | null> {
    try {
        const { db } = getFirebase();
        const docRef = doc(db, 'card_metadata', cardId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as CardMetadata;
        }
        return null;
    } catch (error) {
        console.error('Error loading card metadata:', error);
        return null; // Fail gracefully
    }
}

/**
 * 카드 메타데이터를 Firestore에 저장합니다.
 * 기존 데이터가 있으면 병합(merge)합니다.
 */
export async function saveCardMetadata(cardId: string, metadata: Partial<CardMetadata>): Promise<void> {
    try {
        const { db } = getFirebase();
        const docRef = doc(db, 'card_metadata', cardId);
        await setDoc(docRef, {
            ...metadata,
            id: cardId,
            updatedAt: serverTimestamp()
        }, { merge: true });
        console.log(`Card metadata saved for ${cardId}`);
    } catch (error) {
        console.error('Error saving card metadata:', error);
        throw error;
    }
}

/**
 * 카드 이미지 또는 영상을 Firebase Storage에 업로드합니다.
 * 경로: storage/cards/{type}/{cardId}_{uuid}.{ext}
 */
export async function uploadCardMedia(
    file: File,
    cardId: string,
    type: 'images' | 'videos' | 'sounds'
): Promise<string> {
    try {
        const { storage } = getFirebase();
        const fileExt = file.name.split('.').pop();
        const fileName = `${cardId}_${uuidv4()}.${fileExt}`;
        const storagePath = `cards/${type}/${fileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);

        // Get download URL
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    } catch (error) {
        console.error(`Error uploading ${type}:`, error);
        throw error;
    }
}

/**
 * 로컬 정적 데이터와 Firestore 동적 데이터를 병합하여 최종 카드 템플릿을 반환합니다.
 */
export async function getMergedCardTemplate(staticTemplate: CardTemplate): Promise<CardTemplate> {
    const dynamicData = await loadCardMetadata(staticTemplate.id);

    if (!dynamicData) {
        return staticTemplate;
    }

    return {
        ...staticTemplate,
        name: dynamicData.name || staticTemplate.name,
        description: dynamicData.description || staticTemplate.description,
        imageUrl: dynamicData.imageUrl || staticTemplate.imageUrl,
        videoUrl: dynamicData.videoUrl || staticTemplate.videoUrl,
        // 호버 사운드/비디오는 CardTemplate 타입 확장이 필요할 수 있음
    };
}
