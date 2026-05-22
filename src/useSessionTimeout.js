import { useEffect, useRef } from "react";

export default function useSessionTimeout(onTimeout, minutes = 30) {
  const timer = useRef(null);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onTimeout, minutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ["mousedown","mousemove","keydown","touchstart","scroll","click"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}