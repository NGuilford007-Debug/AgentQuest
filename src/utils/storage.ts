/**
 * SSR-safe, fault-tolerant LocalStorage helper utilities.
 * Ensures the application runs seamlessly in browser, Node, and SSR environments without ReferenceErrors.
 */

export function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return fallback;
  }
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch (error) {
    console.warn(`[Storage] Failed to read or parse "${key}":`, error);
    return fallback;
  }
}

export function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[Storage] Failed to persist "${key}":`, error);
  }
}

export function removeStoredItem(key: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Storage] Failed to remove "${key}":`, error);
  }
}
