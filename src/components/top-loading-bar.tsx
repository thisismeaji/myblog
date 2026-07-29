"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function TopLoadingBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    setVisible(true);
    setProgress(18);

    const startTimer = window.setTimeout(() => {
      setProgress(72);
    }, 40);

    const finishTimer = window.setTimeout(() => {
      setProgress(100);
    }, 220);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 420);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
