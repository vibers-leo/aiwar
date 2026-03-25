'use client';

import { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, set, remove, push, onDisconnect } from 'firebase/database';
import { Button } from "@/components/ui/custom/Button";
import CyberPageLayout from '@/components/CyberPageLayout';
import { joinMatchmaking, leaveMatchmaking } from '@/lib/realtime-pvp-service';
import app from '@/lib/firebase';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function PVPDebugPage() {
    const { isAdmin, loading } = useUser();
    const router = useRouter();
    const [logs, setLogs] = useState<string[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
    const [queueData, setQueueData] = useState<any>(null);
    const [activeBattles, setActiveBattles] = useState<any>(null);

    // 0. Admin Check Redirect
    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, loading, router]);

    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
    };

    // 1. Monitor Connection
    useEffect(() => {
        const db = getDatabase(app || undefined);
        const connectedRef = ref(db, ".info/connected");

        const unsubscribe = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                setConnectionStatus(true);
                addLog("✅ Firebase Connected");
            } else {
                setConnectionStatus(false);
                addLog("❌ Firebase Disconnected");
            }
        });

        return () => unsubscribe();
    }, []);

    // 2. Monitor Queue & Battles
    useEffect(() => {
        const db = getDatabase(app || undefined);
        const queueRef = ref(db, 'matchmaking/double'); // Monitor 'double' mode queue
        const battlesRef = ref(db, 'battles');

        const unsubQueue = onValue(queueRef, (snap) => {
            setQueueData(snap.val());
        });

        const unsubBattles = onValue(battlesRef, (snap) => {
            setActiveBattles(snap.val());
        });

        return () => {
            unsubQueue();
            unsubBattles();
        };
    }, []);

    // Actions
    const handleJoinAsPlayer1 = async () => {
        addLog("🚀 Simulating Player 1 Join...");
        const result = await joinMatchmaking('double', 'DEBUG_PLAYER_1', 10, 1000);
        addLog(`Player 1 Join Result: ${JSON.stringify(result)}`);
    };

    const handleJoinAsPlayer2 = async () => {
        addLog("🚀 Simulating Player 2 Join...");
        // Player 2 needs a different ID simulation. 
        // Note: joinMatchmaking uses getGameState().userId internally.
        // To simulate distinct players properly without modifying the service code excessively,
        // we might need to manually write to firebase here for the second player.

        const db = getDatabase(app || undefined);
        const p2Id = 'DEBUG_PLAYER_2_ID';
        const entry = {
            playerId: p2Id,
            playerName: 'DEBUG_PLAYER_2',
            playerLevel: 10,
            deckPower: 1000,
            battleMode: 'double',
            joinedAt: Date.now(),
            status: 'waiting'
        };

        try {
            await set(ref(db, `matchmaking/double/${p2Id}`), entry);
            addLog("✅ Player 2 Manual Join Success");
        } catch (e) {
            addLog(`❌ Player 2 Join Failed: ${e}`);
        }
    };

    const handleClearQueue = async () => {
        const db = getDatabase(app || undefined);
        await remove(ref(db, 'matchmaking/double'));
        addLog("🧹 Queue Cleared");
    };

    const handleClearBattles = async () => {
        const db = getDatabase(app || undefined);
        await remove(ref(db, 'battles'));
        addLog("🧹 All Battles Cleared");
    };

    if (loading || !isAdmin) return null;

    return (
        <CyberPageLayout title="PVP DIAGNOSTICS" englishTitle="SYSTEM CHECK" color="cyan">
            <div className="max-w-4xl mx-auto p-4 space-y-6">

                {/* Status Board */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                        <h3 className="text-cyan-400 font-bold mb-2">NETWORK STATUS</h3>
                        <div className={`text-xl font-mono ${connectionStatus ? 'text-green-500' : 'text-red-500'}`}>
                            {connectionStatus ? 'ONLINE' : 'OFFLINE'}
                        </div>
                    </div>
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                        <h3 className="text-cyan-400 font-bold mb-2">ACTIVE NODES</h3>
                        <div className="text-sm space-y-1 text-white/70">
                            <div>Queued Players: {queueData ? Object.keys(queueData).length : 0}</div>
                            <div>Active Battles: {activeBattles ? Object.keys(activeBattles).length : 0}</div>
                        </div>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="bg-black/40 border border-cyan-500/30 p-6 rounded-xl">
                    <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                        MANUAL OVERRIDE CONTROLS
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                            <p className="text-xs text-white/50 mb-1">SIMULATION</p>
                            <Button fullWidth onClick={handleJoinAsPlayer1} color="primary">
                                Sim Join (Player 1)
                            </Button>
                            <Button fullWidth onClick={handleJoinAsPlayer2} color="secondary">
                                Sim Join (Player 2)
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-red-400/50 mb-1">DANGER ZONE</p>
                            <Button fullWidth onClick={handleClearQueue} color="danger" variant="ghost">
                                Force Clear Queue
                            </Button>
                            <Button fullWidth onClick={handleClearBattles} color="danger" variant="ghost">
                                Force End All Battles
                            </Button>
                        </div>
                    </div>

                    <div className="bg-black/80 rounded p-4 font-mono text-xs h-64 overflow-y-auto border border-white/5">
                        {logs.length === 0 && <span className="text-white/20">System ready. Waiting for input...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 border-b border-white/5 pb-1">
                                <span className="text-cyan-500 mr-2">{log.split(']')[0]}]</span>
                                <span className="text-white/80">{log.split(']')[1]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data Dump */}
                <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                        <h4 className="text-white/50 mb-2">RAW_QUEUE_DATA</h4>
                        <pre className="text-green-400/80 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(queueData, null, 2) || 'null'}
                        </pre>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                        <h4 className="text-white/50 mb-2">RAW_BATTLE_DATA</h4>
                        <pre className="text-yellow-400/80 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(activeBattles, null, 2) || 'null'}
                        </pre>
                    </div>
                </div>

            </div>
        </CyberPageLayout>
    );
}
