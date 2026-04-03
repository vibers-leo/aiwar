import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swords, Shield, Zap, Heart, Trophy, User, ChevronLeft, Cpu } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn, RotateInUpLeft, SlideInRight, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const MY_DECK = [
  { id: "1", name: "번개 마법사", atk: 85, def: 40, hp: 120, type: "공격", rarity: "전설" },
  { id: "2", name: "얼음 수호자", atk: 30, def: 90, hp: 200, type: "방어", rarity: "영웅" },
  { id: "3", name: "불꽃 전사", atk: 70, def: 50, hp: 150, type: "공격", rarity: "영웅" },
  { id: "4", name: "바람 궁수", atk: 60, def: 35, hp: 100, type: "공격", rarity: "희귀" },
];

const RARITY_COLORS: Record<string, string> = {
  "전설": "#FFD700",
  "영웅": "#a855f7",
  "희귀": "#00D9FF",
  "일반": "#888888",
};

export default function BattleScreen() {
  const [gameState, setGameState] = useState<"ready" | "matching" | "simulation" | "result">("ready");
  const [battleResult, setBattleResult] = useState<"win" | "loss" | null>(null);
  const [animating, setAnimating] = useState(false);
  const [opponent, setOpponent] = useState<any>(null);

  // 시뮬레이션용 공유 값
  const shake = useSharedValue(0);

  const startBattle = () => {
    setGameState("matching");
    
    // Simulate finding opponent
    setTimeout(() => {
      setOpponent({
        name: `REPLICANT_${Math.floor(1000 + Math.random() * 9000)}`,
        tier: "Platinum I",
        power: 1250 + Math.floor(Math.random() * 500),
        winRate: "48%"
      });
      setGameState("simulation");
      runSimulation();
    }, 2000);
  };

  const runSimulation = async () => {
    setAnimating(true);
    // Battle simulation animation loop
    for (let i = 0; i < 5; i++) {
        shake.value = withSequence(withTiming(10, { duration: 50 }), withTiming(-10, { duration: 50 }), withTiming(0, { duration: 50 }));
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    const isWin = Math.random() > 0.45; // 55% win chance
    setBattleResult(isWin ? "win" : "loss");
    setGameState("result");
    setAnimating(false);

    // Update Firestore if logged in
    const user = auth.currentUser;
    if (user) {
      const profileRef = doc(db, "profiles", user.uid);
      try {
        await updateDoc(profileRef, {
          rp: increment(isWin ? 25 : -15),
          wins: isWin ? increment(1) : increment(0),
          losses: isWin ? increment(0) : increment(1),
        });
      } catch (err) {
        console.error("Failed to update battle result", err);
      }
    }
  };

  const animatedShake = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }));

  if (gameState === "matching") {
    return (
      <View className="flex-1 bg-[#050510] items-center justify-center">
        <Animated.View entering={ZoomIn.duration(1000)} className="items-center">
          <ActivityIndicator size="large" color="#00D9FF" />
          <Text className="text-[#00D9FF] font-black text-xl mt-6 tracking-[4px] uppercase italic">Matching Target...</Text>
          <Text className="text-white/40 mt-2">Searching Neural Networks</Text>
        </Animated.View>
      </View>
    );
  }

  if (gameState === "simulation") {
    return (
      <View className="flex-1 bg-[#050510] items-center justify-center p-6">
        <View className="flex-row items-center justify-between w-full mb-20">
            <Animated.View entering={SlideInRight.delay(200)} className="items-center">
                <View className="w-20 h-20 bg-[#00D9FF]/20 rounded-full items-center justify-center border border-[#00D9FF]/40">
                   <User size={40} color="#00D9FF" />
                </View>
                <Text className="text-white font-black mt-2">YOU</Text>
            </Animated.View>
            <View className="items-center">
                <Text className="text-[#FF6B35] font-black text-3xl italic">VS</Text>
            </View>
            <Animated.View entering={SlideInRight.delay(400)} className="items-center">
                <View className="w-20 h-20 bg-red-500/20 rounded-full items-center justify-center border border-red-500/40">
                   <Cpu size={40} color="#ef4444" />
                </View>
                <Text className="text-white font-black mt-2">{opponent?.name}</Text>
            </Animated.View>
        </View>

        <Animated.View style={animatedShake} className="w-full bg-white/5 rounded-3xl p-8 border border-white/10">
           <View className="flex-row justify-between mb-4">
              <Text className="text-white/40 font-bold uppercase text-[10px]">Neural Pulse</Text>
              <Text className="text-[#39FF14] font-black text-[10px]">SIMULATING {">>>"}</Text>
           </View>
           <View className="h-2 bg-white/5 rounded-full overflow-hidden">
               <Animated.View 
                  entering={FadeIn.duration(3000)}
                  className="h-full bg-[#00D9FF]" 
                  style={{ width: '65%' }}
               />
           </View>
           <Text className="text-white font-mono text-center mt-6 text-xs leading-5">
             [LOG] Exchange #4: Shield held, counter pulse detected. {"\n"}
             [LOG] Neural overlap synchronized at 89.4%.
           </Text>
        </Animated.View>
      </View>
    );
  }

  if (gameState === "result") {
    return (
      <View className="flex-1 bg-[#050510] items-center justify-center p-8">
        <Animated.View entering={ZoomIn.springify()} className="items-center">
          <LinearGradient
            colors={battleResult === "win" ? ['#00D9FF', '#39FF14'] : ['#ef4444', '#b91c1c']}
            className="w-24 h-24 rounded-[32px] items-center justify-center shadow-2xl mb-8"
          >
            <Trophy size={48} color="#000" fill="#000" />
          </LinearGradient>
          
          <Text className={`text-5xl font-black italic tracking-tighter mb-2 ${battleResult === 'win' ? 'text-white' : 'text-red-500'}`}>
            {battleResult === "win" ? "MISSION SUCCESS" : "MISSION FAILED"}
          </Text>
          <Text className="text-white/40 font-bold tracking-[2px] mb-12 uppercase italic">
            Neural Combat Finalized
          </Text>

          <View className="bg-white/5 w-full rounded-3xl p-6 border border-white/10 mb-12">
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white/60 font-black">Rank Points</Text>
                <Text className={`font-black text-lg ${battleResult === 'win' ? 'text-[#39FF14]' : 'text-red-500'}`}>
                    {battleResult === 'win' ? '+25 RP' : '-15 RP'}
                </Text>
             </View>
             <View className="flex-row justify-between items-center">
                <Text className="text-white/60 font-black">Combat Reward</Text>
                <Text className="text-white font-black text-lg">150 Credits</Text>
             </View>
          </View>

          <Pressable 
            onPress={() => router.replace("/(tabs)")}
            className="bg-white w-full py-5 rounded-[24px] items-center shadow-xl"
          >
            <Text className="text-black font-black text-lg uppercase italic">Return to Lobby</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-[#050510]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-10">
          <View className="flex-row items-center mb-8">
             <Pressable onPress={() => router.back()} className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center border border-white/10 mr-4">
                <ChevronLeft size={20} color="#fff" />
             </Pressable>
             <Text className="text-white text-3xl font-black italic uppercase tracking-tighter">Prepare <Text className="text-[#00D9FF]">Battle</Text></Text>
          </View>

          <Text className="text-white/40 font-black uppercase text-[10px] tracking-[4px] mb-6 mb-2">Selected Squad (4/4)</Text>
          
          {MY_DECK.map((card, idx) => (
            <Animated.View 
                key={card.id} 
                entering={FadeInDown.delay(idx * 100).springify()}
                className="bg-white/5 rounded-[32px] p-6 mb-4 border border-white/5 relative overflow-hidden"
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Text className="text-white font-black text-xl italic">{card.name}</Text>
                  <View className="ml-3 px-3 py-1 rounded-full" style={{ backgroundColor: RARITY_COLORS[card.rarity] + "20" }}>
                    <Text style={{ color: RARITY_COLORS[card.rarity] }} className="text-[10px] font-black uppercase tracking-widest">{card.rarity}</Text>
                  </View>
                </View>
                <View className="bg-white/10 px-3 py-1 rounded-full">
                    <Text className="text-white/60 text-[10px] font-bold uppercase">{card.type}</Text>
                </View>
              </View>

              <View className="flex-row gap-6">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-[#FF6B35]/20 items-center justify-center mr-2">
                    <Swords size={14} color="#FF6B35" />
                  </View>
                  <View>
                    <Text className="text-white/40 text-[8px] font-black uppercase">Atk</Text>
                    <Text className="text-white font-black text-lg">{card.atk}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-[#00D9FF]/20 items-center justify-center mr-2">
                    <Shield size={14} color="#00D9FF" />
                  </View>
                  <View>
                    <Text className="text-white/40 text-[8px] font-black uppercase">Def</Text>
                    <Text className="text-white font-black text-lg">{card.def}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-red-500/20 items-center justify-center mr-2">
                    <Heart size={14} color="#ef4444" />
                  </View>
                  <View>
                    <Text className="text-white/40 text-[8px] font-black uppercase">HP</Text>
                    <Text className="text-white font-black text-lg">{card.hp}</Text>
                  </View>
                </View>
              </View>
              
              {/* 데코 엘리먼트 */}
              <View className="absolute top-0 right-0 p-4 opacity-5">
                  <Zap size={100} color="#fff" />
              </View>
            </Animated.View>
          ))}

          <Animated.View entering={FadeInUp.delay(600)} className="mt-8 mb-20">
            <LinearGradient
                colors={['#00D9FF', '#39FF14']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-[32px] overflow-hidden shadow-2xl"
            >
                <Pressable 
                    onPress={startBattle}
                    className="py-6 items-center flex-row justify-center"
                >
                    <Swords size={24} color="#000" className="mr-3" fill="#000" />
                    <Text className="text-black font-black text-2xl italic uppercase tracking-tighter">Engage Neural Link</Text>
                </Pressable>
            </LinearGradient>
            <Text className="text-white/20 text-center mt-4 text-[10px] font-bold uppercase tracking-[2px]">Warning: Disconnecting results in rank penalty</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
