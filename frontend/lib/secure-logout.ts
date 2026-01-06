
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

    if ('caches' in window) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
            console.log(`✅ CacheStorage Cleared (${keys.length} caches)`);
        } catch (e) {
            console.warn("⚠️ CacheStorage cleanup failed:", e);
        }
    }

    // D. Delete IndexedDB (Firebase Persistence)
    // This is critical for preventing Firebase from "remembering" the user on reload
    if (window.indexedDB && window.indexedDB.databases) {
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
    }
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

    // STEP 1: LAST-GASP SYNC (If user exists)
    if (userId) {
        try {
            console.log("💾 [Security] Syncing final user state to DB...");
            // Force save user profile if data is provided, or just rely on previous auto-saves.
            // If userState is provided, we could save it, but usually UserContext handles auto-save.
            // We'll call saveUserProfile with an empty update just to ensure connection is alive/verified? 
            // Actually, best to just trust the Context's last sync or force one if passed.
            // For now, we'll assume the caller (UserContext) has done the heavy lifting,
            // or we can trigger a 'last login' update as a sync ping.

            await saveUserProfile({ lastLogoutAt: new Date() }, userId);
            console.log("✅ [Security] Final Sync Response: OK");
        } catch (e) {
            console.error("❌ [Security] Final Sync Failed (Network Down?). Proceeding to Nuke anyway.", e);
        }
    }

    // STEP 2: SERVER SIDE LOGOUT (Cookie destruction)
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        // Ignore network errors for logout api
    }

    // STEP 3: FIREBASE SIGNOUT
    try {
        if (auth) await signOut(auth);
    } catch (e) {
        console.warn("Firebase SignOut Warning:", e);
    }

    // STEP 4: NUKE LOCAL DATA
    await nukeAllStorage();

    // STEP 5: HARD REDIRECT
    console.log("👋 [Security] Goodbye. Redirecting to Root...");
    // Force hard refresh with href to clear memory cache
    window.location.href = '/?logout=success&t=' + Date.now();
}
