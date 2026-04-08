import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swords } from "lucide-react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { initGoogleSignIn, signInWithGoogle } from "../../lib/google-auth";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initGoogleSignIn();
  }, []);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/(tabs)");
    } catch (e: any) {
      if (e.code !== "SIGN_IN_CANCELLED") {
        Alert.alert("로그인 실패", e.message || "다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="flex-1 items-center justify-center px-6">
        <Swords size={64} color="#00D9FF" />
        <Text className="text-3xl font-bold text-text mt-6 mb-2">AI 워</Text>
        <Text className="text-text-muted text-center mb-10">
          AI 대전 카드 배틀
        </Text>

        <Pressable
          className="w-full bg-primary py-4 rounded-xl items-center mb-4"
          onPress={handleGoogleLogin}
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-bg font-bold text-lg">
            {loading ? "로그인 중..." : "Google로 로그인"}
          </Text>
        </Pressable>

        <Pressable
          className="w-full border border-border py-4 rounded-xl items-center"
          onPress={handleGuest}
        >
          <Text className="text-text font-bold text-lg">게스트로 시작</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
