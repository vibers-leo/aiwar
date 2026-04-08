import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';

function verifyAdminSecret(request: Request): boolean {
  const secret = process.env.VIBERS_ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get('x-vibers-admin-secret') === secret;
}

export async function GET(request: Request) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Firebase Auth: 전체 유저 수 (listUsers는 최대 1000명 단위)
    const auth = getAdminAuth();
    let totalUsers = 0;
    let recentSignups = 0;
    let pageToken: string | undefined;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    do {
      const result = await auth.listUsers(1000, pageToken);
      totalUsers += result.users.length;
      recentSignups += result.users.filter(
        (u) => u.metadata.creationTime && new Date(u.metadata.creationTime) > thirtyDaysAgo
      ).length;
      pageToken = result.pageToken;
    } while (pageToken);

    // Firestore: 최근 게임 활동 (games 컬렉션)
    let contentCount = 0;
    try {
      const adminApps = getApps();
      if (adminApps.length > 0) {
        const firestore = getFirestore(adminApps[0]);
        const gamesSnap = await firestore.collection('games').count().get();
        contentCount = gamesSnap.data().count;
      }
    } catch {
      // Firestore 접근 실패 시 무시
    }

    return NextResponse.json({
      projectId: 'aiwar',
      projectName: 'AI WAR',
      stats: {
        totalUsers,
        mau: 0,
        contentCount,
        recentSignups,
      },
      recentActivity: [],
      health: 'healthy',
    });
  } catch {
    return NextResponse.json({
      projectId: 'aiwar',
      projectName: 'AI WAR',
      stats: { mau: 0, totalUsers: 0, contentCount: 0, recentSignups: 0 },
      recentActivity: [],
      health: 'error',
    });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
