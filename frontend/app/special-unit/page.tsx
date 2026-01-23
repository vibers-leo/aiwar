'use client';

import { useState, useEffect } from 'react';
import {
    getSpecialUnitProgress,
    getSpecialUnitData,
    claimSpecialUnit,
    SpecialUnitData
} from '@/lib/special-unit-utils';
import CyberPageLayout from '@/components/CyberPageLayout';
import { Button } from '@/components/ui/custom/Button';
import { Progress } from '@/components/ui/custom/Progress';
import { useAlert } from '@/context/AlertContext';
import { useUser } from '@/context/UserContext';
import { Zap, Shield, Target, Lock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function SpecialUnitPage() {
    const { showAlert } = useAlert();
    const { refreshData } = useUser();
    const { t } = useTranslation();

    const [unitData, setUnitData] = useState<SpecialUnitData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getSpecialUnitData();
            setUnitData(data);
        } catch (error) {
            console.error('Failed to load special unit data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClaim = async () => {
        if (!unitData || unitData.progress < 100) return;

        try {
            const result = await claimSpecialUnit();
            if (result.success) {
                showAlert({
                    title: '생산 완료!',
                    message: `${unitData.name} 특수 유닛이 인벤토리에 추가되었습니다.`,
                    type: 'success'
                });
                refreshData();
                loadData();
            } else {
                showAlert({
                    title: '생산 실패',
                    message: result.message,
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Failed to claim special unit:', error);
            showAlert({
                title: '오류',
                message: '유닛 수령 중 오류가 발생했습니다.',
                type: 'error'
            });
        }
    };

    if (isLoading) {
        return (
            <CyberPageLayout title="로딩 중..." description="데이터를 불러오고 있습니다." color="cyan">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
            </CyberPageLayout>
        );
    }

    if (!unitData) {
        return (
            <CyberPageLayout title="오류" description="데이터를 불러올 수 없습니다." color="cyan">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-white/60">데이터를 불러오는 데 실패했습니다.</p>
                </div>
            </CyberPageLayout>
        );
    }

    const isAvailable = unitData.progress >= 100 && !unitData.isClaimed;

    return (
        <CyberPageLayout
            title="특수 유닛 생산"
            subtitle="SPECIAL UNIT PRODUCTION"
            description="전장 데이터를 수집하여 강력한 특수 유닛을 생산하세요."
            color="cyan"
        >
            <div className="max-w-4xl mx-auto space-y-8">
                {/* 메인 유닛 카드 */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* 좌측: 유닛 이미지 및 정보 */}
                            <div className="space-y-6">
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-white/5">
                                    {unitData.imageUrl ? (
                                        <Image
                                            src={unitData.imageUrl}
                                            alt={unitData.name}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Zap className="w-20 h-20 text-cyan-500/20 animate-pulse" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/50 rounded-full text-cyan-400 text-xs font-bold tracking-wider uppercase">
                                            {unitData.faction}
                                        </span>
                                    </div>
                                    {!isAvailable && !unitData.isClaimed && (
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                            <div className="text-center">
                                                <Lock className="w-12 h-12 text-white/40 mx-auto mb-2" />
                                                <p className="text-white/60 font-bold uppercase tracking-widest text-sm">In Production</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                        {unitData.name}
                                    </h2>
                                    <p className="text-white/40 leading-relaxed font-light italic">
                                        "{unitData.description}"
                                    </p>
                                </div>
                            </div>

                            {/* 우측: 스탯 및 진행도 */}
                            <div className="flex flex-col justify-between space-y-8">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-[0.2em]">Predicted Combat Specs</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(unitData.stats).map(([key, value]) => (
                                            <div key={key} className="bg-white/5 border border-white/5 rounded-xl p-4 transition-colors hover:bg-white/10">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {key === 'power' && <Zap className="w-3 h-3 text-yellow-400" />}
                                                    {key === 'defense' && <Shield className="w-3 h-3 text-cyan-400" />}
                                                    {key === 'speed' && <Target className="w-3 h-3 text-fuchsia-400" />}
                                                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{key}</span>
                                                </div>
                                                <div className="text-xl font-mono text-white font-bold">{value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-[0.2em]">Material Processing</h3>
                                        <span className="text-2xl font-mono text-cyan-400 font-bold">{unitData.progress}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-500 transition-all duration-1000 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                                            style={{ width: `${unitData.progress}%` }}
                                        />
                                    </div>
                                    <p className="text-center text-[11px] text-white/30 font-mono">
                                        {unitData.progress < 100
                                            ? `COLLECTING FIELD DATA: ${(100 - unitData.progress).toFixed(0)}% REMAINING`
                                            : "DATA COLLECTION COMPLETE - READY FOR SYNTHESIS"}
                                    </p>
                                </div>

                                <Button
                                    onClick={handleClaim}
                                    disabled={!isAvailable}
                                    className={cn(
                                        "w-full h-16 text-lg font-bold transition-all duration-500",
                                        isAvailable
                                            ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 active:scale-95"
                                            : unitData.isClaimed
                                                ? "bg-white/5 text-white/20 border border-white/5"
                                                : "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed"
                                    )}
                                >
                                    {unitData.isClaimed ? (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-6 h-6" />
                                            <span>생산 완료</span>
                                        </div>
                                    ) : isAvailable ? (
                                        "유닛 수령하기"
                                    ) : (
                                        "생산 중"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 참고사항 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: Zap, title: "Combat Data", desc: "전투 승리 시 생산 게이지가 충전됩니다." },
                        { icon: Shield, title: "Unique Tech", desc: "이 유닛은 특별한 활성 보너스를 보유합니다." },
                        { icon: Target, title: "Deployment", desc: "생산 완료 후 인벤토리에서 확인할 수 있습니다." }
                    ].map((item, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <item.icon className="w-5 h-5 text-cyan-500 mb-2" />
                            <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                            <p className="text-xs text-white/40">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </CyberPageLayout>
    );
}
