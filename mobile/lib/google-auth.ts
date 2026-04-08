import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "./firebase";

export function initGoogleSignIn() {
  GoogleSignin.configure({
    // Firebase Console → 프로젝트 설정 → 일반 → 웹 API 키 옆 "웹 클라이언트 ID"
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    offlineAccess: false,
  });
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const userInfo = await GoogleSignin.signIn();
  const { idToken } = userInfo.data ?? userInfo as any;
  if (!idToken) throw new Error("Google ID 토큰을 받지 못했습니다");
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signOutGoogle() {
  await GoogleSignin.signOut();
}
