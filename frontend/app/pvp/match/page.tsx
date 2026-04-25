'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PvPMatchPage() {
    const router = useRouter();

    useEffect(() => {
        // [LEGACY] 이 페이지는 구형 Firestore 매칭용입니다.
        // 신규 리얼타임 DB 매칭(/pvp)으로 리다이렉트합니다.
        console.log('🔄 [PVP] Redirecting to new matchmaking arena...');
        router.replace('/pvp');
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <p className="orbitron italic text-xl">REDIRECTING TO ARENA...</p>
        </div>
    );
}
