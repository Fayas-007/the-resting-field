/**
 * Fine ash drifting down through the gate. Fixed values, not random, so the
 * layer is stable across renders.
 */
const MOTES = [
  { left: "6%", size: 2, delay: -1, duration: 21, opacity: 0.16 },
  { left: "13%", size: 1, delay: -9, duration: 26, opacity: 0.1 },
  { left: "21%", size: 2, delay: -15, duration: 18, opacity: 0.13 },
  { left: "29%", size: 1, delay: -4, duration: 30, opacity: 0.08 },
  { left: "37%", size: 3, delay: -20, duration: 23, opacity: 0.12 },
  { left: "44%", size: 1, delay: -12, duration: 17, opacity: 0.14 },
  { left: "52%", size: 2, delay: -6, duration: 28, opacity: 0.09 },
  { left: "59%", size: 1, delay: -17, duration: 20, opacity: 0.15 },
  { left: "67%", size: 2, delay: -2, duration: 25, opacity: 0.11 },
  { left: "74%", size: 1, delay: -22, duration: 19, opacity: 0.13 },
  { left: "82%", size: 3, delay: -8, duration: 31, opacity: 0.07 },
  { left: "89%", size: 1, delay: -14, duration: 22, opacity: 0.14 },
  { left: "95%", size: 2, delay: -19, duration: 27, opacity: 0.1 },
];

export default function Ash() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="absolute top-0 animate-ash rounded-full bg-foreground"
          style={{
            left: m.left,
            width: m.size,
            height: m.size,
            opacity: m.opacity,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
