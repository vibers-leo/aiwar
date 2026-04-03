import { Tabs } from "expo-router";
import { Home, Swords, Layers, Trophy, Settings } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00D9FF",
        tabBarInactiveTintColor: "#555555",
        tabBarStyle: {
          borderTopColor: "#2a2a2a",
          backgroundColor: "#0a0a0a",
        },
        headerStyle: {
          backgroundColor: "#050505",
        },
        headerTintColor: "#f0f0f0",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "로비",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: "배틀",
          tabBarIcon: ({ color, size }) => <Swords size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "컬렉션",
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: "랭킹",
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "설정",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
