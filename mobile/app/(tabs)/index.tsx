import { View, Text, ScrollView, Pressable, Dimensions, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swords, Zap, Trophy, Users, Shield, Cpu, Gauge, ChevronRight, Activity, Gamepad2, Settings } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn, Layout, SlideInRight } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { width } = Dimensions.get('window');

const GAME_MODES = [
  { id: "1", icon: Swords, title: "Ranked Match", desc: "Prove your tactical superiority", color: "#00D9FF", players: "1v1", bg: "#00D9FF20" },
  { id: "2", icon: Users, title: "Casual Arena", desc: "Risk-free combat simulation", color: "#39FF14", players: "1v1", bg: "#39FF1420" },
  { id: "3", icon: Trophy, title: "Grand Tournament", desc: "Weekly championship finals", color: "#FFD700", players: "8P", bg: "#FFD70020" },
  { id: "4", icon: Zap, title: "Tactical Drill", desc: "Train against Advanced AI", color: "#FF6B35", players: "vs AI", bg: "#FF6B3520" },
];

export default function LobbyScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // 전용 프로필 문서 구독 (실시간 데이터 바인딩)
    const unsub = onSnapshot(doc(db, "profiles", user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data());
      } else {
        // 더미 데이터 초기값 (문서가 없을 경우)
        setProfile({
          tier: "Diamond",
          rank: "III",
          wins: 127,
          losses: 89,
          rp: 680,
          maxRp: 1000
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const winRate = profile ? Math.round((profile.wins / (profile.wins + profile.losses)) * 1000) / 10 : 0;
  const progressPercent = profile ? (profile.rp / (profile.maxRp || 1000)) * 100 : 0;

  return (
    <View className="flex-1 bg-[#050510]">
      <StatusBar style="light" />
      
      {/* 커스텀 헤더 */}
      <View className="px-6 pt-14 pb-4 flex-row items-center justify-between border-b border-white/5">
        <View className="flex-row items-center gap-2">
           <LinearGradient
             colors={['#00D9FF', '#39FF14']}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             className="w-10 h-10 rounded-xl items-center justify-center"
           >
             <Shield size={20} color="#000" fill="#000" />
           </LinearGradient>
           <Text className="text-white text-2xl font-black tracking-widest uppercase italic">AI <Text className="text-[#00D9FF]">War</Text></Text>
        </View>
        <View className="flex-row items-center gap-4">
           <Pressable className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center border border-white/5">
              <Activity size={20} color="#00D9FF" />
           </Pressable>
           <Pressable className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center border border-white/5">
              <Settings size={20} color="#fff" />
           </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6 pb-20">
          
          {/* 플레이어 카드 */}
          <Animated.View entering={FadeInDown.duration(800)}>
            <LinearGradient
              colors={['#1a1a2e', '#0f0f1a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-[40px] p-8 border border-[#00D9FF]/20 shadow-2xl relative overflow-hidden"
            >
              <View className="flex-row items-center justify-between mb-8">
                <View>
                  <Text className="text-[#00D9FF] text-[10px] font-black uppercase tracking-widest mb-1">Current Tier</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color="#00D9FF" className="mt-2" />
                  ) : (
                    <Text className="text-white text-3xl font-black tracking-tight mb-2">
                      {profile?.tier || "Diamond"} <Text className="text-[#00D9FF]">{profile?.rank || "III"}</Text>
                    </Text>
                  )}
                </View>
                <View className="w-16 h-16 bg-[#00D9FF]/10 rounded-3xl items-center justify-center border border-[#00D9FF]/20">
                   <Trophy size={32} color="#00D9FF" />
                </View>
              </View>
              
              <View className="flex-row justify-between mb-2">
                 <Text className="text-white/40 text-[10px] font-black uppercase">Combat Record</Text>
                 <Text className="text-white font-black text-sm">
                   {profile?.wins || 0}W {profile?.losses || 0}L <Text className="text-[#39FF14] text-[10px]">({winRate}%)</Text>
                 </Text>
              </View>

              <View className="bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
                 <LinearGradient
                    colors={['#00D9FF', '#39FF14']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${progressPercent}%` }}
                    className="h-full rounded-full"
                 />
              </View>
              
              <Text className="text-white/40 text-[10px] font-black mt-2">
                {profile ? (profile.maxRp - profile.rp) : 320} RP until <Text className="text-white">{profile?.tier} II</Text>
              </Text>

              {/* 데코 엘리먼트 */}
              <View className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00D9FF]/5 rounded-full blur-3xl" />
            </LinearGradient>
          </Animated.View>

          {/* 모드 선택 섹션 */}
          <View className="flex-row items-center justify-between mt-12 mb-6">
             <Text className="text-white text-xl font-black uppercase tracking-widest italic font-outline-2">Select Channel</Text>
             <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-[#39FF14]" />
                <Text className="text-[#39FF14] text-[10px] font-black">Region: Asia</Text>
             </View>
          </View>

          <View className="flex-row flex-wrap gap-4">
             {GAME_MODES.map((mode, idx) => (
               <Animated.View 
                 key={mode.id} 
                 entering={FadeInUp.delay(idx * 100 + 400)}
                 className="w-[47%]"
               >
                 <Pressable className="bg-white/5 p-6 rounded-[32px] border border-white/5 items-center">
                    <View className="w-14 h-14 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: mode.bg }}>
                       <mode.icon size={28} color={mode.color} />
                    </View>
                    <Text className="text-white font-black text-center mb-1">{mode.title}</Text>
                    <Text className="text-white/40 text-[10px] font-bold text-center mb-4 leading-tight">{mode.desc}</Text>
                    <View className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
                       <Text className="text-white/60 text-[10px] font-black">{mode.players}</Text>
                    </View>
                 </Pressable>
               </Animated.View>
             ))}
          </View>

          {/* 퀵 액션 배너 */}
          <Animated.View entering={FadeInUp.delay(800)} className="mt-8">
             <Pressable className="bg-[#00D9FF] rounded-[32px] p-8 flex-row items-center justify-between shadow-2xl">
                <View className="flex-row items-center gap-4">
                   <View className="w-12 h-12 bg-black rounded-2xl items-center justify-center">
                      <Gamepad2 size={24} color="#00D9FF" />
                   </View>
                   <View>
                      <Text className="text-black font-black text-xl uppercase italic">Quick Start</Text>
                      <Text className="text-black/60 text-xs font-bold">Estimated wait: 12 seconds</Text>
                   </View>
                </View>
                <ChevronRight size={24} color="#000" strokeWidth={3} />
             </Pressable>
          </Animated.View>

        </View>
      </ScrollView>
    </View>
  );
}
