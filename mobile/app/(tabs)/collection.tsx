import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Layers } from "lucide-react-native";

const ALL_CARDS = [
  { id: "1", name: "번개 마법사", rarity: "전설", owned: true },
  { id: "2", name: "얼음 수호자", rarity: "영웅", owned: true },
  { id: "3", name: "불꽃 전사", rarity: "영웅", owned: true },
  { id: "4", name: "바람 궁수", rarity: "희귀", owned: true },
  { id: "5", name: "대지 골렘", rarity: "전설", owned: false },
  { id: "6", name: "암흑 기사", rarity: "영웅", owned: false },
  { id: "7", name: "빛의 성기사", rarity: "전설", owned: false },
  { id: "8", name: "독 암살자", rarity: "희귀", owned: true },
  { id: "9", name: "물의 정령", rarity: "희귀", owned: true },
  { id: "10", name: "철벽 기사", rarity: "일반", owned: true },
];

const RARITY_COLORS: Record<string, string> = {
  "전설": "#FFD700",
  "영웅": "#a855f7",
  "희귀": "#00D9FF",
  "일반": "#888888",
};

export default function CollectionScreen() {
  const owned = ALL_CARDS.filter((c) => c.owned).length;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-bg">
      <ScrollView className="flex-1 px-5 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-text text-2xl font-bold">카드 컬렉션</Text>
            <Text className="text-text-muted text-sm mt-1">{owned}/{ALL_CARDS.length} 수집 완료</Text>
          </View>
          <View className="bg-primary/20 px-3 py-2 rounded-xl">
            <Text className="text-primary font-bold">{Math.round((owned / ALL_CARDS.length) * 100)}%</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {ALL_CARDS.map((card) => (
            <Pressable
              key={card.id}
              className={`w-[48%] rounded-xl p-4 border ${card.owned ? "bg-card border-border" : "bg-surface/50 border-border/50 opacity-50"}`}
            >
              <View className="h-20 bg-surface rounded-lg items-center justify-center mb-3">
                <Layers size={32} color={card.owned ? RARITY_COLORS[card.rarity] : "#555"} />
              </View>
              <Text className={`font-bold text-sm ${card.owned ? "text-text" : "text-text-muted"}`}>{card.name}</Text>
              <View className="mt-1 self-start px-2 py-0.5 rounded" style={{ backgroundColor: (RARITY_COLORS[card.rarity] || "#888") + "20" }}>
                <Text style={{ color: card.owned ? RARITY_COLORS[card.rarity] : "#555" }} className="text-xs font-bold">{card.rarity}</Text>
              </View>
              {!card.owned && (
                <Text className="text-text-muted text-xs mt-2">미보유</Text>
              )}
            </Pressable>
          ))}
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
