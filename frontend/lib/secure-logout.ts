/**
 * FAST SECURE LOGOUT UTILITY
 * --------------------------
 * Optimized for speed: Redirect first, cleanup later.
 * User sees instant logout, heavy cleanup happens in background.
 */

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// ============================================
// FAST CLEANUP (Essential only - Blocking)
// ============================================
function fastCleanup() {
    if (typeof window === 'undefined') return;

    console.log("⚡ [Logout] Fast Cleanup...");

    // Clear critical session data only
    localStorage.removeItem('auth-session');
    localStorage.removeItem('last_known_uid');
    localStorage.removeItem('gameState');
    localStorage.removeItem('userProfile');
    sessionStorage.clear();

    // Clear all game-related keys efficiently
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.startsWith('tutorial_') ||
            key.startsWith('quest_') ||
            key.startsWith('stage_') ||
            key.startsWith('deck_') ||
            key.startsWith('inventory_')
        )) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log("✅ [Logout] Fast Cleanup Done");
}

// ============================================
// DEFERRED CLEANUP (Heavy tasks - Non-blocking)
// ============================================
async function deferredCleanup() {
    if (typeof window === 'undefined') return;

    console.log("🧹 [Logout] Starting Deferred Cleanup...");

    try {
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Unregister Service Workers (fire-and-forget)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(reg => reg.unregister());
            }).catch(() => { });
        }

        // Clear CacheStorage (fire-and-forget)
        if ('caches' in window) {
            caches.keys().then(keys => {
                keys.forEach(key => caches.delete(key));
            }).catch(() => { });
        }

        // Delete IndexedDB - Optional, can be slow
        // Only delete if user explicitly wants clean slate
        // Commenting out for speed - Firebase handles its own cleanup on next login
        /*
        if (window.indexedDB?.databases) {
            const dbs = await window.indexedDB.databases();
            dbs.forEach(db => {
                if (db.name) window.indexedDB.deleteDatabase(db.name);
            });
        }
        */

        console.log("✅ [Logout] Deferred Cleanup Complete");
    } catch (e) {
        console.warn("⚠️ [Logout] Deferred Cleanup Warning:", e);
    }
}

// ============================================
// MAIN LOGOUT FUNCTION (Optimized)
// ============================================
export async function performSecureLogout(
    userId?: string,
    skipDataSync: boolean = false // If true, skip DB write (already done by caller)
) {
    console.log("🚀 [Logout] FAST SECURE LOGOUT STARTED");
    const startTime = Date.now();

    // STEP 1: Set pending logout flag immediately
    if (typeof window !== 'undefined') {
        localStorage.setItem('pending_logout', 'true');
    }

    // STEP 2: Firebase SignOut + API Logout (Parallel, max 500ms)
    const logoutTasks: Promise<any>[] = [
        // Firebase SignOut
        (async () => {
            try {
                if (auth) await signOut(auth);
                console.log("✅ [Logout] Firebase SignOut OK");
            } catch (e) {
                console.warn("⚠️ [Logout] Firebase SignOut Warning:", e);
            }
        })(),
        // API Logout (non-critical, fire and forget with timeout)
        Promise.race([
            fetch('/api/auth/logout', { method: 'POST' }).catch(() => { }),
            new Promise(resolve => setTimeout(resolve, 500))
        ])
    ];

    await Promise.all(logoutTasks);

    // STEP 3: Fast Cleanup (Essential only)
    fastCleanup();

    // STEP 4: Set flag again after cleanup (survives localStorage.clear)
    localStorage.setItem('pending_logout', 'true');

    console.log(`⏱️ [Logout] Total Time: ${Date.now() - startTime}ms`);
    console.log("👋 [Logout] Redirecting...");

    // STEP 5: Redirect IMMEDIATELY
    window.location.href = '/?logout=success&t=' + Date.now();

    // STEP 6: Deferred cleanup runs after redirect starts (non-blocking)
    // This runs in the background while the page is unloading
    setTimeout(() => deferredCleanup(), 0);
}

// ============================================
// ULTRA-FAST LOGOUT (For button click - minimal)
// ============================================
export function performQuickLogout() {
    console.log("⚡ [Logout] QUICK LOGOUT");

    // Set flag
    localStorage.setItem('pending_logout', 'true');

    // Clear critical data synchronously
    localStorage.removeItem('auth-session');
    localStorage.removeItem('last_known_uid');
    sessionStorage.clear();

    // Firebase signout (fire and forget)
    if (auth) {
        signOut(auth).catch(() => { });
    }

    // Redirect immediately
    window.location.href = '/';
}
