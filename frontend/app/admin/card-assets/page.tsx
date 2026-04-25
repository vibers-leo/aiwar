'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Search, Upload, Save, Play, Volume2, Image as ImageIcon,
    Video, Music, Edit3, Trash2, Plus, RefreshCw, Eye, EyeOff, Check, X,
    ChevronDown, ChevronUp, Filter, Grid, List, Loader2, Users, Layers,
    FileText, Link as LinkIcon, AlertTriangle, Download
} from 'lucide-react';
import Link from 'next/link';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';

// ================= 타입 정의 =================

interface AssetItem {
    id: string;
    name: string;
    name_ko: string;
    description: string;
    description_ko: string;
    imageUrl: string;
    hoverVideoUrl?: string;
    hoverSoundUrl?: string;
    category: string;
    isActive: boolean;
    updatedAt: Date | any;
    createdAt?: Date | any;
}

interface FactionData extends AssetItem {
    type: 'faction';
    commanderName: string;
    commanderName_ko: string;
    commanderImageUrl: string;
    factionIconUrl: string;
}

interface CardData extends AssetItem {
    type: 'card';
    templateId: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    cardType: 'efficiency' | 'creativity' | 'function';
    factionId: string;
}

// ================= 기본 데이터 =================

const DEFAULT_FACTIONS: FactionData[] = [
    // Super AI
    { id: 'gemini', type: 'faction', name: 'Gemini', name_ko: '제미나이', description: 'Google DeepMind\'s flagship AI', description_ko: '구글 딥마인드의 플래그십 AI', category: 'super', imageUrl: '/assets/factions/gemini.png', commanderName: 'Demis Hassabis', commanderName_ko: '데미스 하사비스', commanderImageUrl: '/assets/cards/cmdr-gemini.png', factionIconUrl: '/assets/factions/gemini.png', isActive: true, updatedAt: new Date() },
    { id: 'chatgpt', type: 'faction', name: 'ChatGPT', name_ko: '챗GPT', description: 'OpenAI\'s conversational AI', description_ko: 'OpenAI의 대화형 AI', category: 'super', imageUrl: '/assets/factions/chatgpt.png', commanderName: 'Sam Altman', commanderName_ko: '샘 알트만', commanderImageUrl: '/assets/cards/cmdr-chatgpt.png', factionIconUrl: '/assets/factions/chatgpt.png', isActive: true, updatedAt: new Date() },
    { id: 'claude', type: 'faction', name: 'Claude', name_ko: '클로드', description: 'Anthropic\'s helpful AI assistant', description_ko: 'Anthropic의 도움이 되는 AI', category: 'super', imageUrl: '/assets/factions/claude.png', commanderName: 'Dario Amodei', commanderName_ko: '다리오 아모데이', commanderImageUrl: '/assets/cards/cmdr-claude.png', factionIconUrl: '/assets/factions/claude.png', isActive: true, updatedAt: new Date() },
    { id: 'grok', type: 'faction', name: 'Grok', name_ko: '그록', description: 'xAI\'s witty AI with real-time knowledge', description_ko: 'xAI의 재치있는 실시간 AI', category: 'super', imageUrl: '/assets/factions/grok.png', commanderName: 'Elon Musk', commanderName_ko: '일론 머스크', commanderImageUrl: '/assets/cards/cmdr-grok.png', factionIconUrl: '/assets/factions/grok.png', isActive: true, updatedAt: new Date() },
    // Image AI
    { id: 'midjourney', type: 'faction', name: 'Midjourney', name_ko: '미드저니', description: 'Artistic image generation AI', description_ko: '예술적 이미지 생성 AI', category: 'image', imageUrl: '/assets/factions/midjourney.png', commanderName: 'David Holz', commanderName_ko: '데이비드 홀츠', commanderImageUrl: '/assets/cards/cmdr-midjourney.png', factionIconUrl: '/assets/factions/midjourney.png', isActive: true, updatedAt: new Date() },
    { id: 'dalle', type: 'faction', name: 'DALL-E', name_ko: '달리', description: 'OpenAI\'s image generation model', description_ko: 'OpenAI의 이미지 생성 모델', category: 'image', imageUrl: '/assets/factions/dalle.png', commanderName: 'Aditya Ramesh', commanderName_ko: '아디티아 라메쉬', commanderImageUrl: '/assets/cards/cmdr-dalle.png', factionIconUrl: '/assets/factions/dalle.png', isActive: true, updatedAt: new Date() },
    { id: 'stable-diffusion', type: 'faction', name: 'Stable Diffusion', name_ko: '스테이블 디퓨전', description: 'Open source image generation', description_ko: '오픈소스 이미지 생성', category: 'image', imageUrl: '/assets/factions/stable-diffusion.png', commanderName: 'Emad Mostaque', commanderName_ko: '에마드 모스타크', commanderImageUrl: '/assets/cards/cmdr-stable-diffusion.png', factionIconUrl: '/assets/factions/stable-diffusion.png', isActive: true, updatedAt: new Date() },
    { id: 'flux', type: 'faction', name: 'Flux', name_ko: '플럭스', description: 'Next-gen image synthesis', description_ko: '차세대 이미지 합성', category: 'image', imageUrl: '/assets/factions/flux.png', commanderName: 'Black Forest Labs', commanderName_ko: '블랙 포레스트 랩', commanderImageUrl: '/assets/cards/cmdr-flux.png', factionIconUrl: '/assets/factions/flux.png', isActive: true, updatedAt: new Date() },
    // Video AI
    { id: 'sora', type: 'faction', name: 'Sora', name_ko: '소라', description: 'OpenAI\'s text-to-video model', description_ko: 'OpenAI의 텍스트-투-비디오', category: 'video', imageUrl: '/assets/factions/sora.png', commanderName: 'Mira Murati', commanderName_ko: '미라 무라티', commanderImageUrl: '/assets/cards/cmdr-sora.png', factionIconUrl: '/assets/factions/sora.png', isActive: true, updatedAt: new Date() },
    { id: 'runway', type: 'faction', name: 'Runway', name_ko: '런웨이', description: 'Creative video AI tools', description_ko: '크리에이티브 비디오 AI', category: 'video', imageUrl: '/assets/factions/runway.png', commanderName: 'Cristóbal Valenzuela', commanderName_ko: '크리스토발 발렌수엘라', commanderImageUrl: '/assets/cards/cmdr-runway.png', factionIconUrl: '/assets/factions/runway.png', isActive: true, updatedAt: new Date() },
    { id: 'kling', type: 'faction', name: 'Kling', name_ko: '클링', description: 'Kuaishou\'s video generation AI', description_ko: '콰이쇼우의 비디오 생성', category: 'video', imageUrl: '/assets/factions/kling.png', commanderName: 'Kuaishou Team', commanderName_ko: '콰이쇼우 팀', commanderImageUrl: '/assets/cards/cmdr-kling.png', factionIconUrl: '/assets/factions/kling.png', isActive: true, updatedAt: new Date() },
    { id: 'pika', type: 'faction', name: 'Pika', name_ko: '피카', description: 'AI video editing and generation', description_ko: 'AI 비디오 편집 및 생성', category: 'video', imageUrl: '/assets/factions/pika.png', commanderName: 'Demi Guo', commanderName_ko: '데미 궈', commanderImageUrl: '/assets/cards/cmdr-pika.png', factionIconUrl: '/assets/factions/pika.png', isActive: true, updatedAt: new Date() },
    // Audio AI
    { id: 'suno', type: 'faction', name: 'Suno', name_ko: '수노', description: 'AI music generation', description_ko: 'AI 음악 생성', category: 'audio', imageUrl: '/assets/factions/suno.png', commanderName: 'Mikey Shulman', commanderName_ko: '마이키 슐만', commanderImageUrl: '/assets/cards/cmdr-suno.png', factionIconUrl: '/assets/factions/suno.png', isActive: true, updatedAt: new Date() },
    { id: 'udio', type: 'faction', name: 'Udio', name_ko: '유디오', description: 'AI-powered music creation', description_ko: 'AI 기반 음악 창작', category: 'audio', imageUrl: '/assets/factions/udio.png', commanderName: 'Udio Team', commanderName_ko: '유디오 팀', commanderImageUrl: '/assets/cards/cmdr-udio.png', factionIconUrl: '/assets/factions/udio.png', isActive: true, updatedAt: new Date() },
    { id: 'elevenlabs', type: 'faction', name: 'ElevenLabs', name_ko: '일레븐랩스', description: 'Voice synthesis AI', description_ko: '음성 합성 AI', category: 'audio', imageUrl: '/assets/factions/elevenlabs.png', commanderName: 'Mati Staniszewski', commanderName_ko: '마티 스타니스제프스키', commanderImageUrl: '/assets/cards/cmdr-elevenlabs.png', factionIconUrl: '/assets/factions/elevenlabs.png', isActive: true, updatedAt: new Date() },
    { id: 'musicgen', type: 'faction', name: 'MusicGen', name_ko: '뮤직젠', description: 'Meta\'s music generation model', description_ko: '메타의 음악 생성 모델', category: 'audio', imageUrl: '/assets/factions/musicgen.png', commanderName: 'Meta AI', commanderName_ko: '메타 AI', commanderImageUrl: '/assets/cards/cmdr-musicgen.png', factionIconUrl: '/assets/factions/musicgen.png', isActive: true, updatedAt: new Date() },
    // Coding AI
    { id: 'cursor', type: 'faction', name: 'Cursor', name_ko: '커서', description: 'AI-first code editor', description_ko: 'AI 우선 코드 에디터', category: 'coding', imageUrl: '/assets/factions/cursor.png', commanderName: 'Michael Truell', commanderName_ko: '마이클 트루엘', commanderImageUrl: '/assets/cards/cmdr-cursor.png', factionIconUrl: '/assets/factions/cursor.png', isActive: true, updatedAt: new Date() },
    { id: 'copilot', type: 'faction', name: 'GitHub Copilot', name_ko: '코파일럿', description: 'AI pair programmer', description_ko: 'AI 페어 프로그래머', category: 'coding', imageUrl: '/assets/factions/copilot.png', commanderName: 'Thomas Dohmke', commanderName_ko: '토마스 돔케', commanderImageUrl: '/assets/cards/cmdr-copilot.png', factionIconUrl: '/assets/factions/copilot.png', isActive: true, updatedAt: new Date() },
    { id: 'replit', type: 'faction', name: 'Replit', name_ko: '레플릿', description: 'Online IDE with AI', description_ko: 'AI가 탑재된 온라인 IDE', category: 'coding', imageUrl: '/assets/factions/replit.png', commanderName: 'Amjad Masad', commanderName_ko: '암자드 마사드', commanderImageUrl: '/assets/cards/cmdr-replit.png', factionIconUrl: '/assets/factions/replit.png', isActive: true, updatedAt: new Date() },
    { id: 'codeium', type: 'faction', name: 'Codeium', name_ko: '코디움', description: 'Free AI code completion', description_ko: '무료 AI 코드 자동완성', category: 'coding', imageUrl: '/assets/factions/codeium.png', commanderName: 'Varun Mohan', commanderName_ko: '바룬 모한', commanderImageUrl: '/assets/cards/cmdr-codeium.png', factionIconUrl: '/assets/factions/codeium.png', isActive: true, updatedAt: new Date() },
];

const DEFAULT_CARDS: CardData[] = [
    // Super AI Cards
    { id: 'card-gemini', type: 'card', templateId: 'gemini', name: 'Gemini Unit', name_ko: '제미나이 유닛', description: 'Standard Gemini combat unit', description_ko: '표준 제미나이 전투 유닛', category: 'super', factionId: 'gemini', rarity: 'legendary', cardType: 'creativity', imageUrl: '/assets/cards/gemini-character.png', isActive: true, updatedAt: new Date() },
    { id: 'card-chatgpt', type: 'card', templateId: 'chatgpt', name: 'ChatGPT Unit', name_ko: '챗GPT 유닛', description: 'Standard ChatGPT combat unit', description_ko: '표준 챗GPT 전투 유닛', category: 'super', factionId: 'chatgpt', rarity: 'legendary', cardType: 'efficiency', imageUrl: '/assets/cards/chatgpt-character.png', isActive: true, updatedAt: new Date() },
    { id: 'card-claude', type: 'card', templateId: 'claude', name: 'Claude Unit', name_ko: '클로드 유닛', description: 'Standard Claude combat unit', description_ko: '표준 클로드 전투 유닛', category: 'super', factionId: 'claude', rarity: 'legendary', cardType: 'function', imageUrl: '/assets/cards/claude-character.png', isActive: true, updatedAt: new Date() },
    { id: 'card-grok', type: 'card', templateId: 'grok', name: 'Grok Unit', name_ko: '그록 유닛', description: 'Standard Grok combat unit', description_ko: '표준 그록 전투 유닛', category: 'super', factionId: 'grok', rarity: 'legendary', cardType: 'creativity', imageUrl: '/assets/cards/grok-character.png', isActive: true, updatedAt: new Date() },
    // Image AI Cards
    { id: 'card-midjourney', type: 'card', templateId: 'midjourney', name: 'Midjourney Unit', name_ko: '미드저니 유닛', description: 'Standard Midjourney combat unit', description_ko: '표준 미드저니 전투 유닛', category: 'image', factionId: 'midjourney', rarity: 'epic', cardType: 'creativity', imageUrl: '/assets/cards/midjourney-character.png', isActive: true, updatedAt: new Date() },
    { id: 'card-dalle', type: 'card', templateId: 'dalle', name: 'DALL-E Unit', name_ko: '달리 유닛', description: 'Standard DALL-E combat unit', description_ko: '표준 달리 전투 유닛', category: 'image', factionId: 'dalle', rarity: 'epic', cardType: 'creativity', imageUrl: '/assets/cards/dalle-character.png', isActive: true, updatedAt: new Date() },
    { id: 'card-stable-diffusion', type: 'card', templateId: 'stable-diffusion', name: 'SD Unit', name_ko: 'SD 유닛', description: 'Standard SD combat unit', description_ko: '표준 SD 전투 유닛', category: 'image', factionId: 'stable-diffusion', rarity: 'rare', cardType: 'efficiency', imageUrl: '/assets/cards/stable-diffusion-character.png', isActive: true, updatedAt: new Date() },
    { id: 'card-flux', type: 'card', templateId: 'flux', name: 'Flux Unit', name_ko: '플럭스 유닛', description: 'Standard Flux combat unit', description_ko: '표준 플럭스 전투 유닛', category: 'image', factionId: 'flux', rarity: 'rare', cardType: 'function', imageUrl: '/assets/cards/flux-character.png', isActive: true, updatedAt: new Date() },
];

const CATEGORIES = [
    { id: 'all', name: '전체', icon: '🎴' },
    { id: 'super', name: 'Super AI', icon: '⭐' },
    { id: 'image', name: 'Image AI', icon: '🖼️' },
    { id: 'video', name: 'Video AI', icon: '🎬' },
    { id: 'audio', name: 'Audio AI', icon: '🎵' },
    { id: 'coding', name: 'Coding AI', icon: '💻' },
];

const RARITIES = [
    { id: 'common', name: 'Common', color: 'text-gray-400 bg-gray-800' },
    { id: 'rare', name: 'Rare', color: 'text-blue-400 bg-blue-900/50' },
    { id: 'epic', name: 'Epic', color: 'text-purple-400 bg-purple-900/50' },
    { id: 'legendary', name: 'Legendary', color: 'text-amber-400 bg-amber-900/50' },
    { id: 'mythic', name: 'Mythic', color: 'text-pink-400 bg-pink-900/50' },
];

const CARD_TYPES = [
    { id: 'efficiency', name: '효율', icon: '🪨', color: 'text-amber-400' },
    { id: 'creativity', name: '창의', icon: '📄', color: 'text-emerald-400' },
    { id: 'function', name: '기능', icon: '✂️', color: 'text-blue-400' },
];

// ================= Firebase 업로드 함수 =================

async function uploadToFirebaseStorage(file: File, path: string): Promise<string> {
    if (!storage) throw new Error('Firebase Storage not initialized');

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
}

async function saveToFirestore(collection_name: string, id: string, data: any) {
    if (!db) throw new Error('Firestore not initialized');

    const docRef = doc(db, collection_name, id);
    await setDoc(docRef, { ...data, updatedAt: new Date() }, { merge: true });
}

// ================= 메인 컴포넌트 =================

export default function AdminCardAssetsPage() {
    const [activeTab, setActiveTab] = useState<'factions' | 'cards'>('factions');
    const [factions, setFactions] = useState<FactionData[]>([]);
    const [cards, setCards] = useState<CardData[]>([]);
    const [selectedItem, setSelectedItem] = useState<FactionData | CardData | null>(null);
    const [editingItem, setEditingItem] = useState<FactionData | CardData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    // 새로운 상태들
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FactionData | CardData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newItemData, setNewItemData] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);

    // ================= Firebase 데이터 로드 (Optimized with Promise.all) =================
    const loadDataFromFirebase = useCallback(async () => {
        setIsLoading(true);
        try {
            if (!db) {
                console.log('Firestore not available, using default data');
                setFactions(DEFAULT_FACTIONS);
                setCards(DEFAULT_CARDS);
                setIsLoading(false);
                return;
            }

            // 🚀 병렬로 Factions와 Cards 동시 로드 (Promise.all 패턴)
            const [factionsSnapshot, cardsSnapshot] = await Promise.all([
                getDocs(collection(db, 'factions')),
                getDocs(collection(db, 'cards'))
            ]);

            // Factions 처리
            if (factionsSnapshot.empty) {
                console.log('No factions in Firebase, initializing with defaults...');
                setFactions(DEFAULT_FACTIONS);
                const batch = writeBatch(db!);
                DEFAULT_FACTIONS.forEach(faction => {
                    const docRef = doc(db!, 'factions', faction.id);
                    batch.set(docRef, { ...faction, createdAt: new Date(), updatedAt: new Date() });
                });
                await batch.commit();
            } else {
                const loadedFactions: FactionData[] = [];
                factionsSnapshot.forEach(docSnapshot => {
                    const data = docSnapshot.data();
                    loadedFactions.push({
                        ...data,
                        id: docSnapshot.id,
                        updatedAt: data.updatedAt?.toDate?.() || new Date(),
                        createdAt: data.createdAt?.toDate?.() || new Date(),
                    } as FactionData);
                });
                setFactions(loadedFactions.sort((a, b) => a.name.localeCompare(b.name)));
            }

            // Cards 처리
            if (cardsSnapshot.empty) {
                console.log('No cards in Firebase, initializing with defaults...');
                setCards(DEFAULT_CARDS);
                const batch = writeBatch(db!);
                DEFAULT_CARDS.forEach(card => {
                    const docRef = doc(db!, 'cards', card.id);
                    batch.set(docRef, { ...card, createdAt: new Date(), updatedAt: new Date() });
                });
                await batch.commit();
            } else {
                const loadedCards: CardData[] = [];
                cardsSnapshot.forEach(docSnapshot => {
                    const data = docSnapshot.data();
                    loadedCards.push({
                        ...data,
                        id: docSnapshot.id,
                        updatedAt: data.updatedAt?.toDate?.() || new Date(),
                        createdAt: data.createdAt?.toDate?.() || new Date(),
                    } as CardData);
                });
                setCards(loadedCards.sort((a, b) => a.name.localeCompare(b.name)));
            }

            console.log('Data loaded from Firebase successfully (parallel fetch)');
        } catch (error) {
            console.error('Failed to load from Firebase:', error);
            setFactions(DEFAULT_FACTIONS);
            setCards(DEFAULT_CARDS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadDataFromFirebase();
    }, [loadDataFromFirebase]);

    // 현재 탭에 따른 아이템 목록
    const currentItems = activeTab === 'factions' ? factions : cards;

    // 필터링된 목록
    const filteredItems = currentItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name_ko.includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // ================= 파일 업로드 핸들러 =================
    const handleFileUpload = async (file: File, field: string) => {
        if (!editingItem) return;

        try {
            setUploadProgress(prev => ({ ...prev, [field]: 10 }));

            // 파일 경로 생성
            const ext = file.name.split('.').pop();
            const path = `${activeTab}/${editingItem.id}/${field}.${ext}`;

            setUploadProgress(prev => ({ ...prev, [field]: 50 }));

            // Firebase Storage 업로드
            const downloadUrl = await uploadToFirebaseStorage(file, path);

            setUploadProgress(prev => ({ ...prev, [field]: 100 }));

            // 상태 업데이트
            setEditingItem(prev => prev ? { ...prev, [field]: downloadUrl } as any : null);

            setTimeout(() => {
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[field];
                    return newProgress;
                });
            }, 1000);

        } catch (error) {
            console.error('Upload failed:', error);
            alert('업로드 실패: ' + (error as Error).message);
            setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[field];
                return newProgress;
            });
        }
    };

    // ================= 저장 핸들러 =================
    const handleSave = async () => {
        if (!editingItem) return;

        setIsSaving(true);

        try {
            // Firestore에 저장
            await saveToFirestore(activeTab, editingItem.id, editingItem);

            // 로컬 상태 업데이트
            if (activeTab === 'factions') {
                setFactions(prev => prev.map(f => f.id === editingItem.id ? editingItem as FactionData : f));
            } else {
                setCards(prev => prev.map(c => c.id === editingItem.id ? editingItem as CardData : c));
            }

            setSelectedItem(editingItem);
            setIsEditing(false);
            alert('저장 완료!');

        } catch (error) {
            console.error('Save failed:', error);
            alert('저장 실패: ' + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    // ================= 새 아이템 추가 =================
    const initializeNewItem = () => {
        const newId = `${activeTab === 'factions' ? 'faction' : 'card'}-${Date.now()}`;

        if (activeTab === 'factions') {
            setNewItemData({
                id: newId,
                type: 'faction',
                name: '',
                name_ko: '',
                description: '',
                description_ko: '',
                category: 'super',
                imageUrl: '',
                commanderName: '',
                commanderName_ko: '',
                commanderImageUrl: '',
                factionIconUrl: '',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as FactionData);
        } else {
            setNewItemData({
                id: newId,
                type: 'card',
                templateId: newId,
                name: '',
                name_ko: '',
                description: '',
                description_ko: '',
                category: 'super',
                factionId: factions[0]?.id || '',
                rarity: 'common',
                cardType: 'efficiency',
                imageUrl: '',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as CardData);
        }
        setShowAddModal(true);
    };

    const handleAddItem = async () => {
        if (!newItemData || !newItemData.name || !newItemData.name_ko) {
            alert('이름을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            await saveToFirestore(activeTab, newItemData.id, newItemData);

            if (activeTab === 'factions') {
                setFactions(prev => [...prev, newItemData as FactionData]);
            } else {
                setCards(prev => [...prev, newItemData as CardData]);
            }

            setShowAddModal(false);
            setNewItemData(null);
            alert('추가 완료!');
        } catch (error) {
            console.error('Add failed:', error);
            alert('추가 실패: ' + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    // ================= 삭제 핸들러 =================
    const handleDeleteClick = (item: FactionData | CardData) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete || !db) return;

        setIsDeleting(true);
        try {
            // Firestore에서 삭제
            await deleteDoc(doc(db, activeTab, itemToDelete.id));

            // 로컬 상태 업데이트
            if (activeTab === 'factions') {
                setFactions(prev => prev.filter(f => f.id !== itemToDelete.id));
            } else {
                setCards(prev => prev.filter(c => c.id !== itemToDelete.id));
            }

            // 선택된 아이템이 삭제된 경우 초기화
            if (selectedItem?.id === itemToDelete.id) {
                setSelectedItem(null);
                setEditingItem(null);
                setIsEditing(false);
            }

            setShowDeleteModal(false);
            setItemToDelete(null);
            alert('삭제 완료!');
        } catch (error) {
            console.error('Delete failed:', error);
            alert('삭제 실패: ' + (error as Error).message);
        } finally {
            setIsDeleting(false);
        }
    };

    // ================= 게임 데이터 내보내기 (JSON API) =================
    const exportGameData = async () => {
        setIsExporting(true);
        try {
            const gameData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                factions: factions.map(f => ({
                    id: f.id,
                    name: f.name,
                    name_ko: f.name_ko,
                    description: f.description,
                    description_ko: f.description_ko,
                    category: f.category,
                    imageUrl: f.imageUrl,
                    commanderName: f.commanderName,
                    commanderName_ko: f.commanderName_ko,
                    commanderImageUrl: f.commanderImageUrl,
                    factionIconUrl: f.factionIconUrl,
                    hoverVideoUrl: f.hoverVideoUrl,
                    hoverSoundUrl: f.hoverSoundUrl,
                    isActive: f.isActive,
                })),
                cards: cards.map(c => ({
                    id: c.id,
                    templateId: c.templateId,
                    name: c.name,
                    name_ko: c.name_ko,
                    description: c.description,
                    description_ko: c.description_ko,
                    category: c.category,
                    factionId: c.factionId,
                    rarity: c.rarity,
                    cardType: c.cardType,
                    imageUrl: c.imageUrl,
                    hoverVideoUrl: c.hoverVideoUrl,
                    hoverSoundUrl: c.hoverSoundUrl,
                    isActive: c.isActive,
                })),
            };

            // JSON 파일 다운로드
            const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `game-assets-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Firestore에 game-data 컬렉션으로도 저장 (게임에서 직접 읽을 수 있도록)
            if (db) {
                await setDoc(doc(db, 'game-data', 'assets'), gameData);
                console.log('Game data saved to Firestore');
            }

            alert('게임 데이터 내보내기 완료!');
        } catch (error) {
            console.error('Export failed:', error);
            alert('내보내기 실패: ' + (error as Error).message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                            <ArrowLeft size={20} />
                            <span>관리자</span>
                        </Link>
                        <div className="w-px h-6 bg-white/20" />
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 orbitron">
                            ASSET MANAGER
                        </h1>
                    </div>

                    {/* 탭 전환 */}
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                        <button
                            onClick={() => { setActiveTab('factions'); setSelectedItem(null); setIsEditing(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${activeTab === 'factions'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Users size={18} /> AI 군단
                        </button>
                        <button
                            onClick={() => { setActiveTab('cards'); setSelectedItem(null); setIsEditing(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${activeTab === 'cards'
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Layers size={18} /> 카드
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {/* 새로고침 버튼 */}
                        <button
                            onClick={loadDataFromFirebase}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-white/10 text-white font-bold px-4 py-2 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                            title="데이터 새로고침"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>

                        {/* 게임 데이터 내보내기 버튼 */}
                        <button
                            onClick={exportGameData}
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold px-4 py-2 rounded-lg hover:from-amber-500 hover:to-orange-500 transition disabled:opacity-50"
                            title="게임 데이터 내보내기"
                        >
                            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            <span className="hidden md:inline">내보내기</span>
                        </button>

                        {/* 새 아이템 추가 버튼 */}
                        <button
                            onClick={initializeNewItem}
                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold px-6 py-2 rounded-lg hover:from-emerald-500 hover:to-green-500 transition"
                        >
                            <Plus size={18} /> 새 {activeTab === 'factions' ? '군단' : '카드'} 추가
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-12 gap-8">
                    {/* ================= 왼쪽 사이드바 ================= */}
                    <div className="col-span-4 space-y-6">
                        {/* 검색 & 필터 */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'factions' ? 'AI 군단 검색...' : '카드 검색...'}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                />
                            </div>

                            {/* 카테고리 필터 */}
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${selectedCategory === cat.id
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {cat.icon} {cat.name}
                                    </button>
                                ))}
                            </div>

                            <div className="text-sm text-gray-400">
                                {filteredItems.length}개의 {activeTab === 'factions' ? '군단' : '카드'}
                            </div>
                        </div>

                        {/* 아이템 목록 */}
                        <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-2">
                            {filteredItems.map(item => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => { setSelectedItem(item); setIsEditing(false); setEditingItem(null); }}
                                    className={`group cursor-pointer rounded-xl border p-4 flex items-center gap-4 transition ${selectedItem?.id === item.id
                                        ? 'border-cyan-500 bg-cyan-950/30'
                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/cards/default-card.png'; }}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-white truncate">{item.name}</div>
                                        <div className="text-xs text-gray-400 truncate">{item.name_ko}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300">
                                                {CATEGORIES.find(c => c.id === item.category)?.icon} {item.category}
                                            </span>
                                            {(item as CardData).rarity && (
                                                <span className={`text-xs px-2 py-0.5 rounded ${RARITIES.find(r => r.id === (item as CardData).rarity)?.color}`}>
                                                    {(item as CardData).rarity}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 삭제 버튼 */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                        className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition opacity-0 group-hover:opacity-100"
                                        title="삭제"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* ================= 오른쪽 상세 패널 ================= */}
                    <div className="col-span-8">
                        {selectedItem ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
                                {/* 헤더 */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs text-cyan-400 font-bold mb-1">
                                            {activeTab === 'factions' ? '🏛️ AI 군단' : '🎴 카드'} / {CATEGORIES.find(c => c.id === selectedItem.category)?.name}
                                        </div>
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editingItem?.name || ''}
                                                    onChange={e => setEditingItem(prev => prev ? { ...prev, name: e.target.value } as any : null)}
                                                    className="text-3xl font-black bg-transparent border-b-2 border-cyan-500 outline-none w-full"
                                                    placeholder="English Name"
                                                />
                                                <input
                                                    type="text"
                                                    value={editingItem?.name_ko || ''}
                                                    onChange={e => setEditingItem(prev => prev ? { ...prev, name_ko: e.target.value } as any : null)}
                                                    className="text-lg text-gray-400 bg-transparent border-b border-gray-600 outline-none w-full"
                                                    placeholder="한글 이름"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <h2 className="text-3xl font-black text-white orbitron">{selectedItem.name}</h2>
                                                <p className="text-gray-400">{selectedItem.name_ko}</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={() => { setIsEditing(false); setEditingItem(null); }}
                                                    className="flex items-center gap-2 bg-gray-700 text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                                                >
                                                    <X size={18} /> 취소
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:from-cyan-500 hover:to-blue-500 transition disabled:opacity-50"
                                                >
                                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 저장
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => { setIsEditing(true); setEditingItem(selectedItem); }}
                                                className="flex items-center gap-2 bg-cyan-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-cyan-500 transition"
                                            >
                                                <Edit3 size={18} /> 편집
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 설명 */}
                                <div className="bg-black/30 rounded-xl p-4">
                                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                        <FileText size={14} /> 설명
                                    </div>
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-400">English</label>
                                                <input
                                                    type="text"
                                                    value={editingItem?.description || ''}
                                                    onChange={e => setEditingItem(prev => prev ? { ...prev, description: e.target.value } as any : null)}
                                                    className="w-full bg-gray-800 text-white rounded p-2 mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">한글</label>
                                                <input
                                                    type="text"
                                                    value={editingItem?.description_ko || ''}
                                                    onChange={e => setEditingItem(prev => prev ? { ...prev, description_ko: e.target.value } as any : null)}
                                                    className="w-full bg-gray-800 text-white rounded p-2 mt-1"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-white">{selectedItem.description}</p>
                                            <p className="text-gray-400 text-sm mt-1">{selectedItem.description_ko}</p>
                                        </>
                                    )}
                                </div>

                                {/* 군단장 정보 (Faction Only) */}
                                {activeTab === 'factions' && (
                                    <div className="bg-black/30 rounded-xl p-4">
                                        <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                                            <Users size={14} /> 군단장 정보
                                        </div>
                                        {isEditing ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-400">군단장 이름 (English)</label>
                                                    <input
                                                        type="text"
                                                        value={(editingItem as FactionData)?.commanderName || ''}
                                                        onChange={e => setEditingItem(prev => prev ? { ...prev, commanderName: e.target.value } as any : null)}
                                                        className="w-full bg-gray-800 text-white rounded p-2 mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400">군단장 이름 (한글)</label>
                                                    <input
                                                        type="text"
                                                        value={(editingItem as FactionData)?.commanderName_ko || ''}
                                                        onChange={e => setEditingItem(prev => prev ? { ...prev, commanderName_ko: e.target.value } as any : null)}
                                                        className="w-full bg-gray-800 text-white rounded p-2 mt-1"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800">
                                                    <img
                                                        src={(selectedItem as FactionData).commanderImageUrl}
                                                        alt="Commander"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{(selectedItem as FactionData).commanderName}</div>
                                                    <div className="text-sm text-gray-400">{(selectedItem as FactionData).commanderName_ko}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ================= 에셋 업로드 그리드 ================= */}
                                <div className="space-y-4">
                                    <div className="text-lg font-bold text-white flex items-center gap-2">
                                        <Upload size={18} /> 에셋 관리
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* 메인 이미지 */}
                                        <AssetUploadBox
                                            label="메인 이미지"
                                            fieldName="imageUrl"
                                            currentUrl={isEditing ? editingItem?.imageUrl : selectedItem.imageUrl}
                                            accept="image/*"
                                            isEditing={isEditing}
                                            progress={uploadProgress['imageUrl']}
                                            onUpload={(file) => handleFileUpload(file, 'imageUrl')}
                                        />

                                        {/* 군단장 이미지 (Faction Only) */}
                                        {activeTab === 'factions' && (
                                            <AssetUploadBox
                                                label="군단장 이미지"
                                                fieldName="commanderImageUrl"
                                                currentUrl={isEditing ? (editingItem as FactionData)?.commanderImageUrl : (selectedItem as FactionData).commanderImageUrl}
                                                accept="image/*"
                                                isEditing={isEditing}
                                                progress={uploadProgress['commanderImageUrl']}
                                                onUpload={(file) => handleFileUpload(file, 'commanderImageUrl')}
                                            />
                                        )}

                                        {/* 호버 비디오 */}
                                        <AssetUploadBox
                                            label="호버 비디오"
                                            fieldName="hoverVideoUrl"
                                            currentUrl={isEditing ? editingItem?.hoverVideoUrl : selectedItem.hoverVideoUrl}
                                            accept="video/*"
                                            isEditing={isEditing}
                                            isVideo
                                            progress={uploadProgress['hoverVideoUrl']}
                                            onUpload={(file) => handleFileUpload(file, 'hoverVideoUrl')}
                                        />

                                        {/* 호버 사운드 */}
                                        <AssetUploadBox
                                            label="호버 사운드"
                                            fieldName="hoverSoundUrl"
                                            currentUrl={isEditing ? editingItem?.hoverSoundUrl : selectedItem.hoverSoundUrl}
                                            accept="audio/*"
                                            isEditing={isEditing}
                                            isAudio
                                            progress={uploadProgress['hoverSoundUrl']}
                                            onUpload={(file) => handleFileUpload(file, 'hoverSoundUrl')}
                                        />

                                        {/* 팩션 아이콘 (Faction Only) */}
                                        {activeTab === 'factions' && (
                                            <AssetUploadBox
                                                label="팩션 아이콘"
                                                fieldName="factionIconUrl"
                                                currentUrl={isEditing ? (editingItem as FactionData)?.factionIconUrl : (selectedItem as FactionData).factionIconUrl}
                                                accept="image/*"
                                                isEditing={isEditing}
                                                progress={uploadProgress['factionIconUrl']}
                                                onUpload={(file) => handleFileUpload(file, 'factionIconUrl')}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    {activeTab === 'factions' ? <Users size={40} className="text-gray-600" /> : <Layers size={40} className="text-gray-600" />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-400 mb-2">
                                    {activeTab === 'factions' ? 'AI 군단을 선택하세요' : '카드를 선택하세요'}
                                </h3>
                                <p className="text-gray-500">
                                    왼쪽 목록에서 편집할 항목을 선택하세요.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= 로딩 오버레이 ================= */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
                    >
                        <div className="text-center">
                            <Loader2 size={48} className="text-cyan-400 animate-spin mx-auto mb-4" />
                            <p className="text-white font-bold">데이터 로딩 중...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ================= 새 아이템 추가 모달 ================= */}
            <AnimatePresence>
                {showAddModal && newItemData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
                        onClick={() => { setShowAddModal(false); setNewItemData(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Plus size={24} className="text-emerald-400" />
                                새 {activeTab === 'factions' ? '군단' : '카드'} 추가
                            </h2>

                            <div className="space-y-6">
                                {/* 기본 정보 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">이름 (English) *</label>
                                        <input
                                            type="text"
                                            value={newItemData.name}
                                            onChange={e => setNewItemData((prev: any) => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                            placeholder="Enter name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">이름 (한글) *</label>
                                        <input
                                            type="text"
                                            value={newItemData.name_ko}
                                            onChange={e => setNewItemData((prev: any) => ({ ...prev, name_ko: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                            placeholder="이름 입력"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">설명 (English)</label>
                                        <input
                                            type="text"
                                            value={newItemData.description}
                                            onChange={e => setNewItemData((prev: any) => ({ ...prev, description: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                            placeholder="Description"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">설명 (한글)</label>
                                        <input
                                            type="text"
                                            value={newItemData.description_ko}
                                            onChange={e => setNewItemData((prev: any) => ({ ...prev, description_ko: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                            placeholder="설명 입력"
                                        />
                                    </div>
                                </div>

                                {/* 카테고리 선택 */}
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block">카테고리</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setNewItemData((prev: any) => ({ ...prev, category: cat.id }))}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${newItemData.category === cat.id
                                                    ? 'bg-cyan-600 text-white'
                                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                                    }`}
                                            >
                                                {cat.icon} {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 군단 전용 필드 */}
                                {activeTab === 'factions' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">군단장 이름 (English)</label>
                                            <input
                                                type="text"
                                                value={newItemData.commanderName || ''}
                                                onChange={e => setNewItemData((prev: any) => ({ ...prev, commanderName: e.target.value }))}
                                                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                                placeholder="Commander name"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">군단장 이름 (한글)</label>
                                            <input
                                                type="text"
                                                value={newItemData.commanderName_ko || ''}
                                                onChange={e => setNewItemData((prev: any) => ({ ...prev, commanderName_ko: e.target.value }))}
                                                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                                placeholder="군단장 이름"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 카드 전용 필드 */}
                                {activeTab === 'cards' && (
                                    <>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-2 block">소속 군단</label>
                                            <select
                                                value={newItemData.factionId || ''}
                                                onChange={e => setNewItemData((prev: any) => ({ ...prev, factionId: e.target.value }))}
                                                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                            >
                                                <option value="">선택...</option>
                                                {factions.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name} ({f.name_ko})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-400 mb-2 block">희귀도</label>
                                                <select
                                                    value={newItemData.rarity || 'common'}
                                                    onChange={e => setNewItemData((prev: any) => ({ ...prev, rarity: e.target.value }))}
                                                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                                >
                                                    {RARITIES.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 mb-2 block">카드 타입</label>
                                                <select
                                                    value={newItemData.cardType || 'efficiency'}
                                                    onChange={e => setNewItemData((prev: any) => ({ ...prev, cardType: e.target.value }))}
                                                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white"
                                                >
                                                    {CARD_TYPES.map(t => (
                                                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => { setShowAddModal(false); setNewItemData(null); }}
                                    className="flex-1 bg-gray-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-600 transition"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    disabled={isSaving}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold px-6 py-3 rounded-lg hover:from-emerald-500 hover:to-green-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    추가하기
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ================= 삭제 확인 모달 ================= */}
            <AnimatePresence>
                {showDeleteModal && itemToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
                        onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
                                    <AlertTriangle size={32} className="text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">삭제 확인</h2>
                                    <p className="text-gray-400 text-sm">이 작업은 되돌릴 수 없습니다</p>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={itemToDelete.imageUrl || '/assets/cards/default-card.png'}
                                        alt={itemToDelete.name}
                                        className="w-16 h-16 rounded-lg object-cover"
                                    />
                                    <div>
                                        <div className="font-bold text-white">{itemToDelete.name}</div>
                                        <div className="text-sm text-gray-400">{itemToDelete.name_ko}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {activeTab === 'factions' ? '🏛️ AI 군단' : '🎴 카드'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-300 mb-6">
                                정말로 <span className="font-bold text-red-400">{itemToDelete.name_ko}</span>을(를) 삭제하시겠습니까?
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                                    className="flex-1 bg-gray-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-600 transition"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-6 py-3 rounded-lg hover:from-red-500 hover:to-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    삭제하기
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ================= 에셋 업로드 박스 컴포넌트 =================

interface AssetUploadBoxProps {
    label: string;
    fieldName: string;
    currentUrl?: string;
    accept: string;
    isEditing: boolean;
    isVideo?: boolean;
    isAudio?: boolean;
    progress?: number;
    onUpload: (file: File) => void;
}

function AssetUploadBox({ label, fieldName, currentUrl, accept, isEditing, isVideo, isAudio, progress, onUpload }: AssetUploadBoxProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (!isEditing) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onUpload(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onUpload(files[0]);
        }
    };

    return (
        <div className="bg-black/30 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    {isVideo ? <Video size={14} /> : isAudio ? <Music size={14} /> : <ImageIcon size={14} />}
                    {label}
                </span>
                {currentUrl && !isEditing && (
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="text-cyan-400 hover:text-cyan-300"
                    >
                        {isPlaying ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                )}
            </div>

            {/* 미리보기 */}
            <div
                className={`aspect-video rounded-lg overflow-hidden border-2 transition relative ${isEditing
                    ? isDragOver
                        ? 'border-cyan-500 bg-cyan-950/30 border-dashed'
                        : 'border-dashed border-gray-600 hover:border-cyan-500/50'
                    : 'border-transparent'
                    } bg-gray-800 flex items-center justify-center cursor-pointer`}
                onDragOver={e => { e.preventDefault(); if (isEditing) setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => isEditing && fileInputRef.current?.click()}
            >
                {currentUrl ? (
                    <>
                        {isVideo ? (
                            <video
                                src={currentUrl}
                                className="w-full h-full object-cover"
                                autoPlay={isPlaying}
                                loop
                                muted
                            />
                        ) : isAudio ? (
                            <div className="flex flex-col items-center p-4">
                                <Music size={32} className="text-cyan-400 mb-2" />
                                {isPlaying && <audio src={currentUrl} autoPlay loop />}
                            </div>
                        ) : (
                            <img
                                src={currentUrl}
                                alt={label}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/cards/default-card.png'; }}
                            />
                        )}

                        {isEditing && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition">
                                <Upload size={24} className="text-white mb-2" />
                                <span className="text-sm text-white">클릭 또는 드래그</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center p-4">
                        {isVideo ? <Video size={32} className="mx-auto text-gray-600 mb-2" /> :
                            isAudio ? <Music size={32} className="mx-auto text-gray-600 mb-2" /> :
                                <ImageIcon size={32} className="mx-auto text-gray-600 mb-2" />}
                        <p className="text-xs text-gray-500">
                            {isEditing ? '클릭 또는 드래그하여 업로드' : '없음'}
                        </p>
                    </div>
                )}

                {/* 업로드 진행률 */}
                {progress !== undefined && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                        <Loader2 size={32} className="text-cyan-400 animate-spin mb-2" />
                        <span className="text-sm text-white">{progress}%</span>
                    </div>
                )}
            </div>

            {/* 파일 경로 표시 */}
            {currentUrl && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-black/30 rounded p-2">
                    <LinkIcon size={12} />
                    <span className="truncate flex-1">{currentUrl}</span>
                </div>
            )}

            {/* 숨겨진 파일 입력 */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
