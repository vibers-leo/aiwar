
import { saveUserProfile } from '@/lib/firebase-db'; // Ensure this matches user's actual import
import { signOut } from 'firebase/auth'; // Direct Firebase Auth
import { auth } from '@/lib/firebase'; // Direct Firebase Auth Instance

/**
 * SCORCHED EARTH LOGOUT UTILITY
 * -----------------------------
 * This utility guarantees a complete, non-recoverable cleanup of the user session.
 * It follows a "Sync-Then-Destroy" protocol.
 */

// 1. Storage Nuke Helper
async function nukeAllStorage() {
    if (typeof window === 'undefined') return;

    console.log("🔥 [Scorched Earth] Initiating Storage Nuke...");

    // A. Clear Local & Session Storage
    localStorage.removeItem('last_known_uid');
    localStorage.clear();
    sessionStorage.clear();
    console.log("✅ Local/Session Storage Cleared (including UID metadata)");

    // B. Clear Cookies
    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log("✅ Cookies Expired");

    // C. Unregister Service Workers & Clear CacheStorage
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
        if (registrations.length > 0) console.log("✅ Service Workers Unregistered");
    }

    const cleanupTasks: Promise<any>[] = [];

    if ('caches' in window) {
        cleanupTasks.push((async () => {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
                console.log(`✅ CacheStorage Cleared (${keys.length} caches)`);
            } catch (e) {
                console.warn("⚠️ CacheStorage cleanup failed:", e);
            }
        })());
    }

    // D. Delete IndexedDB (Firebase Persistence)
    if (window.indexedDB && window.indexedDB.databases) {
        cleanupTasks.push((async () => {
            try {
                const dbs = await window.indexedDB.databases();
                for (const db of dbs) {
                    if (db.name) {
                        window.indexedDB.deleteDatabase(db.name);
                        console.log(`🗑️ Deleted IndexedDB: ${db.name}`);
                    }
                }
            } catch (e) {
                console.warn("⚠️ IndexedDB cleanup failed (browser may block it):", e);
            }
        })());
    }

    await Promise.all(cleanupTasks);
}

// 2. The Main Logout Function
export async function performSecureLogout(
    userId?: string,
    userState?: any // Optional: Pass current coin/exp state if Context isn't trusted
) {
    console.log("🚨 [Security] SECURE LOGOUT SEQUENCE STARTED");

    // Set a flag immediately so we know we are in a dying session
    if (typeof window !== 'undefined') {
        localStorage.setItem('pending_logout', 'true');
    }

    // STEP 1: LAST-GASP SYNC & API & FIREBASE (PARALLEL)
    console.log("⚡ [Security] Initiating parallel logout sequence...");

    // Timeout wrapper for sync
    const syncWithTimeout = async () => {
        if (!userId) return;
        return Promise.race([
            saveUserProfile({ lastLogoutAt: new Date() }, userId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SYNC_TIMEOUT')), 1500))
        ]).then(() => {
            console.log("✅ [Security] Final Sync Response: OK");
        }).catch(e => {
            console.warn("⚠️ [Security] Final Sync skipped or timed out:", e.message);
        });
    };

    const logoutTasks: Promise<any>[] = [
        syncWithTimeout(),
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => { }), // API Logout
        (async () => {
            try {
                if (auth) await signOut(auth);
                console.log("✅ [Security] Firebase SignOut: OK");
            } catch (e) {
                console.warn("Firebase SignOut Warning:", e);
            }
        })()
    ];

    await Promise.all(logoutTasks);

    // STEP 4: NUKE LOCAL DATA
    localStorage.removeItem('auth-session');
    localStorage.removeItem('last_known_uid');
    await nukeAllStorage();

    // [CRITICAL] Set the flag AFTER nukeAllStorage so it survives the clear()
    localStorage.setItem('pending_logout', 'true');

    // STEP 5: HARD REDIRECT
    console.log("👋 [Security] Goodbye. Redirecting to Root...");
    // Force hard refresh with href to clear memory cache
    window.location.href = '/?logout=success&t=' + Date.now();
}
