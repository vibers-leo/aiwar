import { useState } from 'react';
import Image from 'next/image';
import avatarPlaceholder from '@/public/avatar_placeholder_1765931243779.png';
import { useUser } from '@/context/UserContext';
import {
    Card,
    CardBody,
} from "@/components/ui/custom/Card";
import { Avatar } from "@/components/ui/custom/Avatar";
import { Progress } from "@/components/ui/custom/Progress";
import { Button } from "@/components/ui/custom/Button";
import { Divider } from "@/components/ui/custom/Divider";
import { Tooltip } from "@/components/ui/custom/Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sword,
    Shield,
    ShoppingCart,
    Zap,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Settings,
    Sparkles,
    BookOpen,
    FlaskConical,
    User,
    Heart,
    Trophy,
    Users,
} from "lucide-react";
import { useRouter, usePathname } from 'next/navigation';
import SettingsModal from './SettingsModal';
import CommanderProfileModal from './CommanderProfileModal';
import FriendsModal from './FriendsModal';
import { useTranslation } from '@/context/LanguageContext';
import { ResetTimer } from './ResetTimer';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const { coins, tokens, level, experience, handleSignOut, profile, user } = useUser();
    // const [isOpen, setIsOpen] = useState(true); // Lifted to LayoutWrapper
    const router = useRouter();
    const pathname = usePathname();
    const expPercentage = Math.min(100, (experience / (level * 100)) * 100);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

    const { t, language } = useTranslation();
    const navItems = [
        { name: t('menu.myCards'), path: '/my-cards', icon: <Shield size={18} />, color: "primary" },
        { name: t('menu.generation'), path: '/generation', icon: <Zap size={18} />, color: "warning" },
        { name: t('menu.aiFaction'), path: '/factions', icon: <Trophy size={18} />, color: "secondary" },
        { name: t('menu.uniqueGeneration'), path: '/mythic', icon: <Sparkles size={18} />, color: "danger" },
        { name: t('menu.uniqueStudio'), path: '/studio', icon: <User size={18} />, color: "success" },
        { name: t('menu.enhance'), path: '/enhance', icon: <Heart size={18} />, color: "warning" },
        { name: t('menu.fusion'), path: '/fusion', icon: <FlaskConical size={18} />, color: "secondary" },
        { name: t('menu.encyclopedia'), path: '/encyclopedia', icon: <BookOpen size={18} />, color: "default" },
    ];
    // navItemsFixed is now same as navItems
    const navItemsFixed = navItems;


    return (
        <motion.aside
            animate={{ width: isOpen ? 280 : 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden lg:block fixed right-0 top-20 bottom-0 z-30 p-4 select-none"
        >
            <Card
                className="h-full bg-black/40 backdrop-blur-2xl border-l border-white/5 shadow-2xl overflow-hidden rounded-lg"
            >
                {/* 토글 버튼 - 우아한 플로팅 디자인 */}
                <motion.button
                    whileHover={{ scale: 1.05, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggle}
                    className="absolute top-6 -left-4 z-50 w-8 h-14 
                        bg-gradient-to-b from-cyan-600/90 to-purple-600/90 
                        backdrop-blur-md rounded-l-xl border border-white/20
                        flex items-center justify-center
                        shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 
                        transition-shadow duration-300"
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 0 : 180 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronRight size={22} className="text-white" />
                    </motion.div>
                </motion.button>

                <CardBody className="p-0 flex flex-col h-full overflow-hidden">
                    {/* 프로필 섹션 */}
                    <div className="pt-10 pb-4 flex flex-col items-center px-6 flex-shrink-0">
                        <motion.div
                            animate={{
                                scale: isOpen ? 1 : 0.9,
                                marginBottom: isOpen ? 0 : -10
                            }}
                            className="relative transition-all duration-300 cursor-pointer group"
                            onClick={() => setIsProfileOpen(true)}
                        >
                            <div className="absolute -inset-2 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
                            <Avatar
                                src={profile?.avatarUrl || avatarPlaceholder.src}
                                className={`transition-all duration-300 text-large border-2 border-purple-500/50 ${isOpen ? 'w-16 h-16' : 'w-10 h-10'}`}
                                isBordered
                                color="secondary"
                            />
                            <div className={`absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center border-2 border-black font-black text-white shadow-lg transition-all duration-300 ${isOpen ? 'w-6 h-6 text-[10px]' : 'w-4 h-4 text-[8px]'}`}>
                                {level}
                            </div>
                            {!isOpen && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                                    <User size={14} className="text-white" />
                                </div>
                            )}
                        </motion.div>

                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mt-4 text-center"
                                >
                                    <h2 className="text-sm font-black text-white orbitron tracking-tight truncate max-w-[180px] mx-auto">
                                        {profile?.nickname || `${t('sidebar.commander')}_${user?.uid?.slice(0, 4) || '7429'}`}
                                    </h2>
                                    <p className="text-[10px] text-purple-400 font-bold tracking-[0.2em] uppercase opacity-80">{t('sidebar.eliteCommander')}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <Divider className="bg-white/5" />

                                {/* EXP 바 */}
                                <div className="px-6 py-3">
                                    <div className="flex justify-between items-center mb-1 px-1">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('sidebar.experience')}</span>
                                        <span className="text-[9px] text-purple-400 font-mono">{experience} / {level * 100} XP</span>
                                    </div>
                                    <Progress
                                        size="sm"
                                        value={expPercentage}
                                        color="secondary"
                                        className="h-1"
                                        classNames={{
                                            track: "bg-white/5",
                                            indicator: "shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Divider className="bg-white/5" />

                    {/* [NEW] Daily Reset Timer */}
                    {isOpen && (
                        <div className="px-6 py-4 flex-shrink-0">
                            <ResetTimer className="bg-white/5 p-3 rounded-xl border border-white/5 shadow-inner" />
                        </div>
                    )}
                    {!isOpen && (
                        <div className="flex justify-center p-2">
                            <Tooltip content={t('sidebar.dailyReset')} placement="left">
                                <div className="p-2 rounded-full bg-white/5">
                                    <ResetTimer showLabel={false} />
                                </div>
                            </Tooltip>
                        </div>
                    )}

                    <Divider className="bg-white/5" />

                    {/* 내비게이션 */}
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto no-scrollbar">
                        {navItemsFixed.map((item) => (
                            <Tooltip key={item.path} content={item.name} placement="left" isDisabled={isOpen}>
                                <Button
                                    id={`sidebar-nav${item.path.replace('/', '-')}`} // Added ID for tutorial targeting
                                    fullWidth
                                    variant="light"
                                    color="default"
                                    onPress={() => router.push(item.path)}
                                    className={`
                                        h-12 !justify-start px-5 transition-all relative overflow-hidden
                                        ${pathname.startsWith(item.path) ? "font-black text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"}
                                        ${!isOpen ? "min-w-0 px-0 justify-center" : ""}
                                    `}
                                >
                                    {pathname.startsWith(item.path) && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className={
                                                item.color === 'primary' ? 'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] rounded-l-md' :
                                                    item.color === 'success' ? 'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)] rounded-l-md' :
                                                        item.color === 'danger' ? 'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)] rounded-l-md' :
                                                            item.color === 'warning' ? 'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)] rounded-l-md' :
                                                                'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-400 shadow-[0_0_12px_rgba(161,161,170,0.8)] rounded-l-md'
                                            }
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <div className="relative z-10 flex items-center w-full">
                                        <div className={`${pathname.startsWith(item.path) ? "text-white scale-110" : "opacity-60"} transition-transform duration-300`}>
                                            {item.icon}
                                        </div>
                                        {isOpen && <span className="ml-3 orbitron text-[13px] tracking-wider">{item.name}</span>}
                                    </div>
                                </Button>
                            </Tooltip>
                        ))}
                    </div>

                    <Divider className="bg-white/5" />

                    <div className="p-3 space-y-1 pb-6 flex-shrink-0">
                        {/* Friends Button - Navigates to Social Page */}
                        <div className="flex gap-2">
                            <Button
                                fullWidth
                                variant="light"
                                color="default"
                                onPress={() => router.push('/social')}
                                className={`h-12 text-gray-400 hover:text-cyan-400 hover:bg-white/5 ${!isOpen ? "min-w-0 px-0 justify-center" : "!justify-start px-5"}`}
                                startContent={<Users size={18} />}
                            >
                                {isOpen && <span className="ml-3 font-bold text-xs orbitron tracking-widest">{t('sidebar.socialDashboard')}</span>}
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                fullWidth
                                variant="light"
                                color="default"
                                onPress={() => setIsSettingsOpen(true)}
                                className={`h-12 text-gray-400 hover:text-white hover:bg-white/5 ${!isOpen ? "min-w-0 px-0 justify-center" : "!justify-start px-5"}`}
                                startContent={<Settings size={18} />}
                            >
                                {isOpen && <span className="ml-3 font-bold text-xs orbitron tracking-widest">{t('sidebar.systemSettings')}</span>}
                            </Button>
                        </div>
                        <Button
                            fullWidth
                            variant="light"
                            color="danger"
                            onPress={handleSignOut}
                            className={`h-12 text-gray-400 hover:text-red-400 ${!isOpen ? "min-w-0 px-0 justify-center" : "!justify-start px-5"}`}
                            startContent={<LogOut size={18} />}
                        >
                            {isOpen && <span className="ml-3 font-bold text-xs orbitron tracking-widest">{t('sidebar.systemLogout')}</span>}
                        </Button>
                        {isOpen && (
                            <div className="text-center pt-2">
                                <span className="text-[8px] text-gray-600 font-bold orbitron">AGI WAR v1.2.0-PREMIUM</span>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <CommanderProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />

            <FriendsModal
                isOpen={isFriendsModalOpen}
                onClose={() => setIsFriendsModalOpen(false)}
            />
        </motion.aside >
    );
}
