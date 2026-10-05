"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader } from "@/components/Loader";

const STORAGE_KEY = "msnss_splash_seen";

/**
 * Persistent boot splash: shown once per browser session while the first page
 * hydrates, then suppressed via sessionStorage. Route-level streaming loading
 * (app/loading.tsx) handles subsequent navigation feedback.
 */
export default function SiteLoader() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — show splash this session */
    }
    Promise.resolve().then(() => setShow(seen !== "1"));
  }, []);

  const handleComplete = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;
  return <Loader key={pathname} duration={1400} onComplete={handleComplete} />;
}