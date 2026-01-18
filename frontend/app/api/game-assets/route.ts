'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

// GET: 게임 에셋 데이터 조회
export async function GET() {
    try {
        // 먼저 캐시된 game-data 확인
        if (db) {
            const cachedRef = doc(db, 'game-data', 'assets');
            const cachedDoc = await getDoc(cachedRef);

            if (cachedDoc.exists()) {
                return NextResponse.json({
                    success: true,
                    source: 'cache',
                    data: cachedDoc.data()
                });
            }
        }

        // 캐시가 없으면 직접 조회
        if (!db) {
            return NextResponse.json({
                success: false,
                error: 'Database not initialized'
            }, { status: 500 });
        }

        // Factions 로드
        const factionsRef = collection(db, 'factions');
        const factionsSnapshot = await getDocs(factionsRef);

        const factions: any[] = [];
        factionsSnapshot.forEach(doc => {
            const data = doc.data();
            factions.push({
                id: doc.id,
                name: data.name,
                name_ko: data.name_ko,
                description: data.description,
                description_ko: data.description_ko,
                category: data.category,
                imageUrl: data.imageUrl,
                commanderName: data.commanderName,
                commanderName_ko: data.commanderName_ko,
                commanderImageUrl: data.commanderImageUrl,
                factionIconUrl: data.factionIconUrl,
                hoverVideoUrl: data.hoverVideoUrl,
                hoverSoundUrl: data.hoverSoundUrl,
                isActive: data.isActive,
            });
        });

        // Cards 로드
        const cardsRef = collection(db, 'cards');
        const cardsSnapshot = await getDocs(cardsRef);

        const cards: any[] = [];
        cardsSnapshot.forEach(doc => {
            const data = doc.data();
            cards.push({
                id: doc.id,
                templateId: data.templateId,
                name: data.name,
                name_ko: data.name_ko,
                description: data.description,
                description_ko: data.description_ko,
                category: data.category,
                factionId: data.factionId,
                rarity: data.rarity,
                cardType: data.cardType,
                imageUrl: data.imageUrl,
                hoverVideoUrl: data.hoverVideoUrl,
                hoverSoundUrl: data.hoverSoundUrl,
                isActive: data.isActive,
            });
        });

        return NextResponse.json({
            success: true,
            source: 'live',
            data: {
                version: '1.0',
                fetchedAt: new Date().toISOString(),
                factions,
                cards
            }
        });

    } catch (error) {
        console.error('Failed to fetch game assets:', error);
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
