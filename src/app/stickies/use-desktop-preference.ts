import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const prefix = "portfolio-desktop:v1:";

export function clearDesktopPreferences(group: string) {
  try {
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index);
      if (key?.startsWith(prefix + group)) localStorage.removeItem(key);
    }
  } catch {
    // Remounting the windows still restores their defaults in memory.
  }
}

export function useDesktopPreference<T>(name: string, initial: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const key = prefix + name;
  const [value, setValue] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Restore after hydration so the initial markup is identical on server and client.
    const restore = setTimeout(() => {
      try {
        const saved = localStorage.getItem(key);
        if (saved !== null) setValue(JSON.parse(saved) as T);
      } catch {
        // The desktop can still be used if browser storage is unavailable.
      }
      setLoaded(true);
    }, 0);
    return () => clearTimeout(restore);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      if (value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the current state in memory.
    }
  }, [key, loaded, value]);

  return [value, setValue, loaded];
}
