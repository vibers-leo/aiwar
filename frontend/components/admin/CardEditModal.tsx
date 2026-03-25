'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Save, Volume2, Video, Image as ImageIcon, Check } from 'lucide-react';
import { CardTemplate } from '@/lib/types';
import { uploadCardMedia, saveCardMetadata, loadCardMetadata } from '@/lib/admin-card-service';
import { cn } from '@/lib/utils';
// import GameCard from '@/components/GameCard'; // We'll mock this or use the real one if adaptable

interface CardEditModalProps {
    card: CardTemplate;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function CardEditModal({ card, isOpen, onClose, onSave }: CardEditModalProps) {
    const [formData, setFormData] = useState<Partial<CardTemplate>>({
        name: '',
        description: '',
        imageUrl: '',
        videoUrl: '',
        hoverSound: '',
        hoverVideo: ''
    });
    const [activeTab, setActiveTab] = useState<'basic' | 'media'>('basic');
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    // Load existing metadata on open
    useEffect(() => {
        if (isOpen && card) {
            setFormData({
                name: card.name,
                description: card.description,
                imageUrl: card.imageUrl,
                videoUrl: card.videoUrl || '',
                hoverSound: card.hoverSound || '',
                hoverVideo: card.hoverVideo || ''
            });

            // Try to load any admin-overridden data
            loadCardMetadata(card.id).then(meta => {
                if (meta) {
                    setFormData(prev => ({
                        ...prev,
                        name: meta.name || prev.name,
                        description: meta.description || prev.description,
                        imageUrl: meta.imageUrl || prev.imageUrl,
                        videoUrl: meta.videoUrl || prev.videoUrl,
                        hoverSound: meta.hoverSound || prev.hoverSound,
                        hoverVideo: meta.hoverVideo || prev.hoverVideo
                    }));
                }
            });
        }
    }, [isOpen, card]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'videoUrl' | 'hoverSound' | 'hoverVideo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(field);
        try {
            let type: 'images' | 'videos' | 'sounds' = 'images';
            if (field === 'hoverSound') type = 'sounds';
            if (field === 'videoUrl' || field === 'hoverVideo') type = 'videos';

            const url = await uploadCardMedia(file, card.id, type);
            setFormData(prev => ({ ...prev, [field]: url }));
        } catch (error) {
            alert('Upload failed check console');
            console.error(error);
        } finally {
            setUploadingField(null);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveCardMetadata(card.id, {
                id: card.id,
                name: formData.name || card.name,
                description: formData.description || '',
                imageUrl: formData.imageUrl || '',
                videoUrl: formData.videoUrl,
                hoverSound: formData.hoverSound,
                hoverVideo: formData.hoverVideo,
                updatedAt: new Date(),
                updatedBy: 'admin' // In real app, use auth context
            });
            onSave();
            onClose();
        } catch (error) {
            alert('Save failed');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-5xl h-[80vh] flex overflow-hidden shadow-2xl"
                    >
                        {/* LEFT: Preview */}
                        <div className="w-1/3 bg-black/50 border-r border-zinc-800 p-8 flex flex-col items-center justify-center relative">
                            <h3 className="text-zinc-500 font-mono text-xs uppercase absolute top-4 left-4">Live Preview</h3>

                            {/* Card Preview Mockup */}
                            <div className="relative w-64 aspect-[3/4] rounded-xl overflow-hidden border border-zinc-700 group cursor-pointer shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30 transition-all">
                                <img
                                    src={formData.imageUrl || '/card_placeholder.png'}
                                    className="w-full h-full object-cover"
                                    alt="Preview"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                                <div className="absolute bottom-0 p-4 w-full">
                                    <h2 className="text-white font-bold text-xl leading-none mb-2">{formData.name}</h2>
                                    <p className="text-zinc-400 text-xs line-clamp-3">{formData.description}</p>
                                </div>

                                {/* Hover Effect Preview Indicator */}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    {formData.videoUrl && <Video size={12} className="text-cyan-400" />}
                                    {formData.hoverSound && <Volume2 size={12} className="text-pink-400" />}
                                </div>
                            </div>

                            <p className="text-zinc-600 text-xs mt-4 text-center">
                                * Hover effects will be applied in-game
                            </p>
                        </div>

                        {/* RIGHT: Edit Form */}
                        <div className="w-2/3 flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                                <div>
                                    <h2 className="text-white text-xl font-bold">Edit Card Asset</h2>
                                    <p className="text-zinc-500 text-xs font-mono">{card.id}</p>
                                </div>
                                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-zinc-800">
                                <button
                                    onClick={() => setActiveTab('basic')}
                                    className={cn("px-6 py-3 text-sm font-medium transition-colors", activeTab === 'basic' ? "text-white border-b-2 border-cyan-500 bg-cyan-500/10" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Basic Info
                                </button>
                                <button
                                    onClick={() => setActiveTab('media')}
                                    className={cn("px-6 py-3 text-sm font-medium transition-colors", activeTab === 'media' ? "text-white border-b-2 border-cyan-500 bg-cyan-500/10" : "text-zinc-500 hover:text-zinc-300")}
                                >
                                    Media Assets
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {activeTab === 'basic' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-mono text-zinc-500 mb-1">CARD NAME</label>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                                placeholder="Enter card name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-mono text-zinc-500 mb-1">DESCRIPTION</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={5}
                                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                                                placeholder="Enter card description"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'media' && (
                                    <div className="space-y-6">
                                        {/* Image Upload */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                                                <ImageIcon size={14} /> MAIN IMAGE
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    name="imageUrl"
                                                    value={formData.imageUrl}
                                                    onChange={handleChange}
                                                    className="flex-1 bg-black border border-zinc-700 rounded-lg p-2 text-sm text-zinc-300 focus:border-cyan-500 outline-none"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'imageUrl')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        disabled={uploadingField === 'imageUrl'}
                                                    />
                                                    <button className="h-full px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center border border-zinc-700 transition-colors">
                                                        {uploadingField === 'imageUrl' ? <span className="animate-spin">⌛</span> : <Upload size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Video Upload */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                                                <Video size={14} /> MOTION CARD VIDEO (MP4)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    name="videoUrl"
                                                    value={formData.videoUrl}
                                                    onChange={handleChange}
                                                    className="flex-1 bg-black border border-zinc-700 rounded-lg p-2 text-sm text-zinc-300 focus:border-cyan-500 outline-none"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="video/mp4"
                                                        onChange={(e) => handleFileUpload(e, 'videoUrl')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        disabled={uploadingField === 'videoUrl'}
                                                    />
                                                    <button className="h-full px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center border border-zinc-700 transition-colors">
                                                        {uploadingField === 'videoUrl' ? <span className="animate-spin">⌛</span> : <Upload size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Video Upload (NEW) */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-mono text-zinc-500 text-pink-400">
                                                <Video size={14} /> HOVER VIDEO (New!)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    name="hoverVideo"
                                                    value={formData.hoverVideo}
                                                    onChange={handleChange}
                                                    className="flex-1 bg-black border border-zinc-700 rounded-lg p-2 text-sm text-zinc-300 focus:border-pink-500 outline-none"
                                                    placeholder="Video to play when hovering"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="video/mp4"
                                                        onChange={(e) => handleFileUpload(e, 'hoverVideo')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        disabled={uploadingField === 'hoverVideo'}
                                                    />
                                                    <button className="h-full px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center border border-zinc-700 transition-colors">
                                                        {uploadingField === 'hoverVideo' ? <span className="animate-spin">⌛</span> : <Upload size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Sound Upload (NEW) */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-mono text-zinc-500 text-pink-400">
                                                <Volume2 size={14} /> HOVER SOUND EFFECT (New!)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    name="hoverSound"
                                                    value={formData.hoverSound}
                                                    onChange={handleChange}
                                                    className="flex-1 bg-black border border-zinc-700 rounded-lg p-2 text-sm text-zinc-300 focus:border-pink-500 outline-none"
                                                    placeholder="Sound to play when hovering"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="audio/*"
                                                        onChange={(e) => handleFileUpload(e, 'hoverSound')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        disabled={uploadingField === 'hoverSound'}
                                                    />
                                                    <button className="h-full px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center justify-center border border-zinc-700 transition-colors">
                                                        {uploadingField === 'hoverSound' ? <span className="animate-spin">⌛</span> : <Upload size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-lg text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-8 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-600/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>Saving...</>
                                    ) : (
                                        <>
                                            <Save size={16} /> Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
