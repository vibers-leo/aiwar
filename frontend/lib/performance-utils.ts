'use client';

/**
 * 🚀 AI War Performance Optimization Utilities
 * Based on Vercel React Best Practices
 */

// ================= Reduced Motion Hook =================
/**
 * Hook to detect user's reduced motion preference
 * @returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
}

/**
 * Returns animation props based on user's motion preference
 * @param fullAnimation - Animation to use when motion is allowed
 * @param reducedAnimation - Animation to use when motion should be reduced (optional)
 * @returns The appropriate animation object
 */
export function getAccessibleAnimation<T>(
    fullAnimation: T,
    reducedAnimation: Partial<T> = {}
): T {
    if (typeof window === 'undefined') return fullAnimation;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
        return { ...fullAnimation, ...reducedAnimation };
    }

    return fullAnimation;
}

// ================= Memoization Helpers =================
/**
 * LRU Cache for expensive computations (cross-request caching)
 */
export class MemoCache<K, V> {
    private cache = new Map<K, { value: V; timestamp: number }>();
    private maxSize: number;
    private ttl: number; // Time to live in ms

    constructor(maxSize = 100, ttlMs = 60000) {
        this.maxSize = maxSize;
        this.ttl = ttlMs;
    }

    get(key: K): V | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    set(key: K, value: V): void {
        // Evict oldest if at max capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, { value, timestamp: Date.now() });
    }

    clear(): void {
        this.cache.clear();
    }
}

// ================= Debounce & Throttle =================
/**
 * Debounce function - delays execution until after wait milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return function (...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
    };
}

/**
 * Throttle function - limits execution to once per wait milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return function (...args: Parameters<T>) {
        const now = Date.now();
        if (now - lastCall >= wait) {
            lastCall = now;
            fn(...args);
        }
    };
}

// ================= Preload Utilities =================
/**
 * Preload a component on hover/focus for perceived speed
 */
export function preloadComponent(componentPath: string): void {
    import(componentPath).catch(() => {
        // Ignore preload errors
    });
}

/**
 * Preconnect to a domain for faster resource loading
 */
export function preconnect(url: string): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';

    if (!document.head.querySelector(`link[href="${url}"][rel="preconnect"]`)) {
        document.head.appendChild(link);
    }
}

// ================= Set/Map Lookup Optimization =================
/**
 * Creates an O(1) lookup Set from an array
 */
export function createLookupSet<T>(items: T[]): Set<T> {
    return new Set(items);
}

/**
 * Creates an O(1) lookup Map from an array with a key extractor
 */
export function createLookupMap<T, K>(
    items: T[],
    keyExtractor: (item: T) => K
): Map<K, T> {
    return new Map(items.map(item => [keyExtractor(item), item]));
}

// ================= Animation Optimization =================
/**
 * GPU-friendly transform configurations
 * Use these instead of width/height/top/left animations
 */
export const GPU_FRIENDLY_ANIMATION = {
    scale: (from: number, to: number) => ({
        initial: { transform: `scale(${from})` },
        animate: { transform: `scale(${to})` },
    }),

    translateX: (from: string, to: string) => ({
        initial: { transform: `translateX(${from})` },
        animate: { transform: `translateX(${to})` },
    }),

    translateY: (from: string, to: string) => ({
        initial: { transform: `translateY(${from})` },
        animate: { transform: `translateY(${to})` },
    }),

    opacity: (from: number, to: number) => ({
        initial: { opacity: from },
        animate: { opacity: to },
    }),

    rotate: (from: number, to: number) => ({
        initial: { transform: `rotate(${from}deg)` },
        animate: { transform: `rotate(${to}deg)` },
    }),
};

// ================= Virtualization Helper =================
/**
 * Simple visible range calculator for virtualized lists
 */
export function getVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan: number = 3
): { startIndex: number; endIndex: number } {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount);

    return { startIndex, endIndex };
}

// ================= Image Optimization =================
/**
 * Get optimized image sizes string for Next.js Image component
 */
export function getResponsiveImageSizes(
    mobileWidth: string = '100vw',
    tabletWidth: string = '50vw',
    desktopWidth: string = '33vw'
): string {
    return `(max-width: 640px) ${mobileWidth}, (max-width: 1024px) ${tabletWidth}, ${desktopWidth}`;
}

/**
 * Checks if an image is in viewport for lazy loading
 */
export function isInViewport(element: HTMLElement, threshold: number = 200): boolean {
    if (typeof window === 'undefined') return false;

    const rect = element.getBoundingClientRect();
    return (
        rect.top <= window.innerHeight + threshold &&
        rect.bottom >= -threshold &&
        rect.left <= window.innerWidth + threshold &&
        rect.right >= -threshold
    );
}

// Export all utilities
export default {
    useReducedMotion,
    getAccessibleAnimation,
    MemoCache,
    debounce,
    throttle,
    preloadComponent,
    preconnect,
    createLookupSet,
    createLookupMap,
    GPU_FRIENDLY_ANIMATION,
    getVisibleRange,
    getResponsiveImageSizes,
    isInViewport,
};
