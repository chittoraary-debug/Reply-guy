import { useEffect, useState } from "react";

export function Waveform({ isRecording }: { isRecording: boolean }) {
  const [bars, setBars] = useState<number[]>(new Array(20).fill(10));

  useEffect(() => {
    if (!isRecording) {
      setBars(new Array(20).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.max(10, Math.random() * 60)));
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="flex items-center justify-center gap-1 h-16 w-full">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1.5 bg-primary/80 rounded-full transition-all duration-100 ease-in-out"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
