'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadProps {
    onImageChange: (imageData: string | null) => void;
    currentImage?: string;
}

export default function ImageUpload({ onImageChange, currentImage, className }: ImageUploadProps & { className?: string }) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setUploading(true);
        setUploadProgress(0);

        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('이미지 파일만 업로드 가능합니다.');
                setUploading(false);
                return;
            }

            // Validate file size (10MB - Firebase Storage 제한 완화)
            if (file.size > 10 * 1024 * 1024) {
                setError('파일 크기는 10MB 이하여야 합니다.');
                setUploading(false);
                return;
            }

            // Create preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreview(result);
            };
            reader.readAsDataURL(file);

            // Upload to Firebase Storage
            if (!storage) {
                throw new Error('Firebase Storage가 초기화되지 않았습니다.');
            }

            // Generate unique filename
            const fileName = `${uuidv4()}_${file.name}`;
            const storageRef = ref(storage, `user-cards/${fileName}`);

            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            setUploadProgress(100);

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            console.log('✅ 이미지 업로드 성공:', downloadURL);

            // Call parent callback with URL
            onImageChange(downloadURL);
            setUploading(false);

        } catch (err: any) {
            console.error('❌ 이미지 업로드 실패:', err);
            setError(err.message || '업로드 중 오류가 발생했습니다.');
            setPreview(null);
            setUploading(false);
        }
    }, [onImageChange]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleRemove = useCallback(() => {
        setPreview(null);
        setError(null);
        onImageChange(null);
    }, [onImageChange]);

    return (
        <div className={cn("space-y-2 h-full flex flex-col", className)}>
            <label className="block text-sm text-gray-400">카드 이미지</label>

            <div className="flex-1 min-h-0 relative">
                {preview ? (
                    <div className="relative group w-full h-full">
                        <div className="w-full h-full bg-black/40 rounded-lg border-2 border-white/10 overflow-hidden">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-contain bg-center"
                            />
                        </div>
                        <button
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-400 rounded-full transition-colors shadow-lg z-10"
                        >
                            <X size={16} className="text-white" />
                        </button>
                    </div>
                ) : (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative w-full h-full border-2 border-dashed rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center",
                            uploading && "pointer-events-none opacity-75",
                            isDragging
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-white/20 bg-white/5 hover:border-cyan-500/50 hover:bg-white/10"
                        )}
                    >
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleFileInput}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                            {uploading ? (
                                <>
                                    <Loader2 size={40} className="text-cyan-400 animate-spin" />
                                    <p className="text-cyan-400 font-medium">Firebase Storage 업로드 중...</p>
                                    {uploadProgress > 0 && (
                                        <div className="w-48 bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : isDragging ? (
                                <>
                                    <Upload size={40} className="text-cyan-400 animate-bounce" />
                                    <p className="text-cyan-400 font-medium">이미지를 놓으세요</p>
                                </>
                            ) : (
                                <>
                                    <ImageIcon size={40} className="text-white/40" />
                                    <div className="text-center">
                                        <p className="text-white/60 font-medium mb-1">
                                            이미지를 드래그하거나 클릭하여 업로드
                                        </p>
                                        <p className="text-white/40 text-xs">
                                            PNG, JPEG, WEBP (최대 10MB)
                                        </p>
                                        <p className="text-cyan-400/60 text-xs mt-1">
                                            ⚡ Firebase Storage에 자동 업로드
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-red-400 text-xs">{error}</p>
            )}
        </div>
    );
}
