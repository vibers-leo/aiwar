'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Edit, Plus, Image as ImageIcon } from 'lucide-react';
import CyberPageLayout from '@/components/CyberPageLayout';
import { CARD_DATABASE } from '@/data/card-database';
import { CardTemplate, Rarity } from '@/lib/types';
import { cn } from '@/lib/utils';
import CardEditModal from '@/components/admin/CardEditModal'; // To be implemented

export default function AdminCardsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
    const [filteredCards, setFilteredCards] = useState<CardTemplate[]>([]);
    const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Initial Load & Filter Logic
    useEffect(() => {
        let results = CARD_DATABASE;

        // Filter by Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            results = results.filter(card =>
                card.name.toLowerCase().includes(lowerTerm) ||
                card.id.toLowerCase().includes(lowerTerm) ||
                card.aiFactionId.toLowerCase().includes(lowerTerm)
            );
        }

        // Filter by Rarity
        if (filterRarity !== 'all') {
            results = results.filter(card => card.rarity === filterRarity);
        }

        setFilteredCards(results);
    }, [searchTerm, filterRarity]);

    const handleEditCard = (card: CardTemplate) => {
        setSelectedCard(card);
        setIsEditModalOpen(true);
    };

    const handleSaveCard = () => {
        // Refresh mechanism could be better, but for now we rely on the modal saving to Firebase
        // and potentially manually updating the local list if we fetched real data.
        // Since we display static data primarily, the list view might not update immediately
        // unless we implementing merging logic here. 
        console.log('Card saved! Refreshing list...');
        // Todo: Implement live refresh from Firestore
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
            case 'rare': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
            case 'epic': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
            case 'legendary': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
            case 'mythic': return 'text-red-400 border-red-500/30 bg-red-500/10';
            case 'commander': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
            default: return 'text-white border-white/20 bg-white/5';
        }
    };

    return (
        <CyberPageLayout
            title="CARD DATABASE"
            englishTitle="ADMIN CONSOLE"
            subtitle="Manage Game Assets"
            color="red"
            showBack={true}
            backPath="/admin"
        >
            <div className="space-y-6">
                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-sm">

                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                        <input
                            type="text"
                            placeholder="Search by ID, Name, Faction..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>

                    {/* Filters & Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                            <select
                                value={filterRarity}
                                onChange={(e) => setFilterRarity(e.target.value as Rarity | 'all')}
                                className="bg-black/50 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white appearance-none focus:outline-none focus:border-red-500/50 cursor-pointer"
                            >
                                <option value="all">All Rarities</option>
                                <option value="common">Common</option>
                                <option value="rare">Rare</option>
                                <option value="epic">Epic</option>
                                <option value="legendary">Legendary</option>
                                <option value="mythic">Mythic</option>
                                <option value="commander">Commander</option>
                            </select>
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors text-sm font-medium ml-auto">
                            <Plus size={16} />
                            <span className="hidden md:inline">Add New Card</span>
                        </button>
                    </div>
                </div>

                {/* Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCards.map((card) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-red-500/50 transition-colors"
                        >
                            {/* Card Image Preview */}
                            <div className="aspect-[3/4] relative bg-black/60 overflow-hidden">
                                <img
                                    src={card.imageUrl}
                                    alt={card.name}
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/card_placeholder.png'; // Fallback
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                                {/* Overlay Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider", getRarityColor(card.rarity))}>
                                            {card.rarity}
                                        </span>
                                        <span className="text-[10px] text-white/40 font-mono">{card.aiFactionId}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{card.name}</h3>
                                    <p className="text-xs text-white/50 line-clamp-2">{card.description}</p>
                                </div>

                                {/* Edit Button Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <button
                                        onClick={() => handleEditCard(card)}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-400 transform hover:scale-105 transition-all shadow-lg shadow-red-500/20"
                                    >
                                        <Edit size={16} />
                                        EDIT CARD
                                    </button>
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="px-3 py-2 border-t border-white/5 bg-white/5 flex justify-between items-center text-[10px] font-mono text-white/30">
                                <span>ID: {card.id}</span>
                                <span className="flex items-center gap-1">
                                    {card.videoUrl && <span className="text-cyan-500">Video ✓</span>}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-white/30">
                        <ImageIcon size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-mono">NO CARDS FOUND</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {selectedCard && (
                <CardEditModal
                    card={selectedCard}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveCard}
                />
            )}
        </CyberPageLayout>
    );
}
