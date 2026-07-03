import { useEffect, useState } from "react";

export function useImagesPreload(urls: (string | null | undefined)[]) {
  const targets = urls.filter((u): u is string => !!u);
  const key = targets.join("|");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    if (targets.length === 0) return;
    let cancelled = false;
    let remaining = targets.length;
    const images: HTMLImageElement[] = [];

    const onSettled = () => {
      remaining -= 1;
      if (remaining === 0 && !cancelled) setLoadedKey(key);
    };

    for (const url of targets) {
      const img = new Image();
      img.onload = onSettled;
      img.onerror = onSettled;
      img.src = url;
      images.push(img);
    }

    return () => {
      cancelled = true;
      for (const img of images) {
        img.onload = null;
        img.onerror = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return targets.length === 0 || loadedKey === key;
}
