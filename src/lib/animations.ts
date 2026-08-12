/**
 * Shared motion helper. Every section staggers its children through this so the
 * whole page keeps one rhythm.
 */
export const fadeUp = (delay: number) =>
  ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }) as const;
