'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import PageHeader from '@/components/PageHeader';
import { Card, CardBody } from '@/components/ui/custom/Card';
import { Button } from '@/components/ui/custom/Button';
import Image from 'next/image';
import { Upload, Trash2, RefreshCw, Check, X, Image as ImageIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// 모든 군단 정보
const ALL_FACTIONS = [
    // Super
    { id: 'gemini', name: 'Gemini', category: 'Super' },
    { id: 'chatgpt', name: 'ChatGPT', category: 'Super' },
    { id: 'claude', name: 'Claude', category: 'Super' },
    { id: 'grok', name: 'Grok', category: 'Super' },
    // Image
    { id: 'midjourney', name: 'Midjourney', category: 'Image' },
    { id: 'dalle', name: 'DALL-E', category: 'Image' },
    { id: 'stable-diffusion', name: 'Stable Diffusion', category: 'Image' },
    { id: 'flux', name: 'Flux', category: 'Image' },
    // Video
    { id: 'kling', name: 'Kling', category: 'Video' },
    { id: 'runway', name: 'Runway', category: 'Video' },
    { id: 'pika', name: 'Pika', category: 'Video' },
    { id: 'sora', name: 'Sora', category: 'Video' },
    // Audio
    { id: 'suno', name: 'Suno', category: 'Audio' },
    { id: 'udio', name: 'Udio', category: 'Audio' },
    { id: 'elevenlabs', name: 'ElevenLabs', category: 'Audio' },
    { id: 'musicgen', name: 'MusicGen', category: 'Audio' },
    // Coding
    { id: 'cursor', name: 'Cursor', category: 'Coding' },
    { id: 'copilot', name: 'Copilot', category: 'Coding' },
    { id: 'replit', name: 'Replit', category: 'Coding' },
    { id: 'codeium', name: 'Codeium', category: 'Coding' },
];

type ImageType = 'character' | 'faction';

export default function AdminCardImagesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [imageType, setImageType] = useState<ImageType>('character');
    const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = ['all', 'Super', 'Image', 'Video', 'Audio', 'Coding'];

    const filteredFactions = selectedCategory === 'all'
        ? ALL_FACTIONS
        : ALL_FACTIONS.filter(f => f.category === selectedCategory);

    const getImagePath = (factionId: string, type: ImageType) => {
        if (type === 'character') {
            return `/assets/cards/${factionId}-character.png`;
        }
        return `/assets/factions/${factionId}.png`;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 미리보기 생성
        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFaction || !uploadPreview || !fileInputRef.current?.files?.[0]) return;

        setIsUploading(true);

        try {
            const file = fileInputRef.current.files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('factionId', selectedFaction);
            formData.append('imageType', imageType);

            // 실제 업로드 API 호출 (추후 백엔드 구현 필요)
            // const response = await fetch('/api/admin/upload-card-image', {
            //     method: 'POST',
            //     body: formData,
            // });

            // 데모: 로컬 스토리지에 저장
            const customImages = JSON.parse(localStorage.getItem('customCardImages') || '{}');
            customImages[`${imageType}-${selectedFaction}`] = uploadPreview;
            localStorage.setItem('customCardImages', JSON.stringify(customImages));

            // 성공 처리
            setTimeout(() => {
                setIsUploading(false);
                setUploadPreview(null);
                setSelectedFaction(null);
                setRefreshKey(prev => prev + 1);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 1000);
        } catch (error) {
            console.error('Upload failed:', error);
            setIsUploading(false);
        }
    };

    const handleRemoveCustomImage = (factionId: string) => {
        const customImages = JSON.parse(localStorage.getItem('customCardImages') || '{}');
        delete customImages[`${imageType}-${factionId}`];
        localStorage.setItem('customCardImages', JSON.stringify(customImages));
        setRefreshKey(prev => prev + 1);
    };

    const getCustomImage = (factionId: string): string | null => {
        if (typeof window === 'undefined') return null;
        const customImages = JSON.parse(localStorage.getItem('customCardImages') || '{}');
        return customImages[`${imageType}-${factionId}`] || null;
    };

    return (
        <div className="min-h-screen py-12 px-6 lg:px-12 bg-[#050505] relative overflow-hidden">
            <BackgroundBeams className="opacity-35" />

            <div className="max-w-7xl mx-auto relative z-10">
                <PageHeader
                    title="카드 이미지 관리"
                    englishTitle="CARD IMAGE MANAGER"
                    description="군단별 캐릭터 및 아이콘 이미지를 관리합니다"
                    color="purple"
                />

                {/* 컨트롤 패널 */}
                <Card className="bg-black/40 backdrop-blur-xl border-white/10 mb-8">
                    <CardBody className="p-6">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            {/* 이미지 타입 선택 */}
                            <div className="flex gap-2">
                                <Button
                                    color={imageType === 'character' ? 'primary' : 'default'}
                                    variant={imageType === 'character' ? 'solid' : 'flat'}
                                    onPress={() => setImageType('character')}
                                    className="font-bold"
                                >
                                    <ImageIcon size={16} className="mr-2" />
                                    캐릭터 일러스트
                                </Button>
                                <Button
                                    color={imageType === 'faction' ? 'primary' : 'default'}
                                    variant={imageType === 'faction' ? 'solid' : 'flat'}
                                    onPress={() => setImageType('faction')}
                                    className="font-bold"
                                >
                                    <Users size={16} className="mr-2" />
                                    군단 아이콘
                                </Button>
                            </div>

                            {/* 카테고리 필터 */}
                            <div className="flex gap-2 flex-wrap">
                                {categories.map(cat => (
                                    <Button
                                        key={cat}
                                        size="sm"
                                        color={selectedCategory === cat ? 'secondary' : 'default'}
                                        variant={selectedCategory === cat ? 'solid' : 'flat'}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        {cat === 'all' ? '전체' : cat}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* 이미지 그리드 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    {filteredFactions.map(faction => {
                        const customImage = getCustomImage(faction.id);
                        const defaultPath = getImagePath(faction.id, imageType);

                        return (
                            <motion.div
                                key={`${faction.id}-${refreshKey}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
                                    selectedFaction === faction.id
                                        ? "border-purple-500 shadow-lg shadow-purple-500/30"
                                        : "border-white/10 hover:border-white/30"
                                )}
                                onClick={() => setSelectedFaction(faction.id)}
                            >
                                <div className="aspect-square relative bg-gradient-to-br from-gray-900 to-gray-800">
                                    {customImage ? (
                                        <img
                                            src={customImage}
                                            alt={faction.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Image
                                            src={defaultPath}
                                            alt={faction.name}
                                            fill
                                            className="object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/card_placeholder_1765931222851.png';
                                            }}
                                        />
                                    )}

                                    {/* 오버레이 */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* 커스텀 이미지 표시 */}
                                    {customImage && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                                            커스텀
                                        </div>
                                    )}
                                </div>

                                {/* 정보 */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                                    <p className="text-white font-bold text-sm">{faction.name}</p>
                                    <p className="text-white/60 text-xs">{faction.category}</p>
                                </div>

                                {/* 호버 액션 */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            color="primary"
                                            className="bg-purple-600 min-w-0 w-8 h-8 p-0"
                                            onPress={() => {
                                                setSelectedFaction(faction.id);
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            <Upload size={16} />
                                        </Button>
                                        {customImage && (
                                            <Button
                                                size="sm"
                                                color="danger"
                                                className="min-w-0 w-8 h-8 p-0"
                                                onPress={() => {
                                                    handleRemoveCustomImage(faction.id);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* 숨겨진 파일 입력 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* 업로드 미리보기 모달 */}
                <AnimatePresence>
                    {uploadPreview && selectedFaction && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => {
                                setUploadPreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full border border-white/10"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-xl font-bold text-white mb-4">
                                    이미지 업로드 확인
                                </h3>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-white/60 mb-2">현재 이미지</p>
                                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-800 relative">
                                            <Image
                                                src={getImagePath(selectedFaction, imageType)}
                                                alt="Current"
                                                fill
                                                className="object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/card_placeholder_1765931222851.png';
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/60 mb-2">새 이미지</p>
                                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                                            <img
                                                src={uploadPreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-3 mb-6">
                                    <p className="text-sm text-white/60">대상</p>
                                    <p className="text-white font-bold">
                                        {ALL_FACTIONS.find(f => f.id === selectedFaction)?.name} - {imageType === 'character' ? '캐릭터 일러스트' : '군단 아이콘'}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        color="default"
                                        variant="flat"
                                        className="flex-1"
                                        onPress={() => {
                                            setUploadPreview(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        <X size={16} className="mr-2" />
                                        취소
                                    </Button>
                                    <Button
                                        color="success"
                                        className="flex-1"
                                        isLoading={isUploading}
                                        onPress={handleUpload}
                                    >
                                        <Check size={16} className="mr-2" />
                                        업로드
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 안내 */}
                <Card className="bg-purple-900/20 border-purple-500/30">
                    <CardBody className="p-6">
                        <h3 className="text-lg font-bold text-purple-400 mb-2">📋 사용 안내</h3>
                        <ul className="text-white/70 text-sm space-y-1">
                            <li>• 카드를 클릭하거나 호버 후 업로드 버튼을 눌러 이미지를 교체할 수 있습니다</li>
                            <li>• 업로드된 커스텀 이미지는 브라우저 로컬 스토리지에 저장됩니다</li>
                            <li>• 권장 이미지 크기: 캐릭터 1024x1024, 아이콘 512x512</li>
                            <li>• 지원 형식: PNG, JPG, WebP</li>
                        </ul>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
