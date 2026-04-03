import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, Crown, Medal } from "lucide-react-native";

const RANKINGS = [
  { rank: 1, name: "드래곤슬레이어", rating: 2450, wins: 312, tier: "그랜드마스터" },
  { rank: 2, name: "아이스퀸", rating: 2380, wins: 289, tier: "그랜드마스터" },
  { rank: 3, name: "파이어로드", rating: 2310, wins: 275, tier: "마스터" },
  { rank: 4, name: "쉐도우헌터", rating: 2250, wins: 261, tier: "마스터" },
  { rank: 5, name: "스톰브링어", rating: 2180, wins: 248, tier: "마스터" },
  { rank: 6, name: "라이트세이버", rating: 2100, wins: 230, tier: "다이아몬드" },
  { rank: 7, name: "다크나이트", rating: 2050, wins: 218, tier: "다이아몬드" },
  { rank: 42, name: "나 (LEO)", rating: 1680, wins: 127, tier: "다이아몬드" },
];

const RANK_ICONS = [Crown, Trophy, Medal];
const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function RankingScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-text text-2xl font-bold mb-2">랭킹</Text>
        <Text className="text-text-muted mb-6">시즌 3 랭킹 보드</Text>

        {RANKINGS.map((player, i) => {
          const isMe = player.name.includes("나");
          const isTop3 = player.rank <= 3;
          const RankIcon = isTop3 ? RANK_ICONS[player.rank - 1] : null;

          return (
            <View
              key={player.rank}
              className={`rounded-xl p-4 mb-3 border flex-row items-center ${isMe ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}
            >
              <View className="w-10 items-center">
                {RankIcon ? (
                  <RankIcon size={24} color={RANK_COLORS[player.rank - 1]} />
                ) : (
                  <Text className="text-text-muted font-bold text-lg">#{player.rank}</Text>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className={`font-bold ${isMe ? "text-primary" : "text-text"}`}>{player.name}</Text>
                <Text className="text-text-muted text-xs mt-1">{player.tier} | {player.wins}승</Text>
              </View>
              <Text className="text-text font-bold">{player.rating} RP</Text>
            </View>
          );
        })}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
