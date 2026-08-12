import { motion } from "framer-motion";
import { ArrowDown, Shovel } from "lucide-react";
import { useState } from "react";
import Ash from "./Ash";

/**
 * The cemetery gate plate. Drop the image at one of these paths in `public/` —
 * the first that loads wins, and if none do the hero falls back to pure black,
 * which still reads as intended.
 */
const GATE_PLATE = ["/gate.png", "/hero-gate.jpg", "/hero-gate.png", "/hero-gate.webp"];

interface GateProps {
  /** Total interred — Main Cluster + Old Ground, live. */
  interred: number;
  /** Earliest year on any headstone. The cemetery's founding date. */
  since: string;
  /** Names for the roll at the foot of the gate. */
  roll: string[];
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Gate({ interred, since, roll }: GateProps) {
  const [plate, setPlate] = useState(0);

  return (
    <section
      id="gate"
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black"
    >
      {/* ---- The gate ---- */}
      {plate < GATE_PLATE.length && (
        <img
          src={GATE_PLATE[plate]}
          onError={() => setPlate((p) => p + 1)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full animate-drift object-cover"
          style={{ filter: "grayscale(1) contrast(1.1) brightness(0.72)" }}
        />
      )}

      {/* Light scrim only — the ironwork and trees should stay legible at the edges */}
      <div className="absolute inset-0 bg-background/22" />
      {/*
        The type sits in a pool of dark punched through the middle of the plate,
        so the gate frames the words instead of fighting them.
      */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 46% at 50% 44%, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0) 100%)",
        }}
      />
      {/* Vignette: edges fall away to black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 92% at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.66) 84%, #000 100%)",
        }}
      />
      <div className="fog absolute inset-0 animate-flicker" />
      <Ash />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* ---- Centre column ---- */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-20 text-center md:pt-24">
        {/* Registry badge */}
        <motion.div
          {...rise(0)}
          className="flex items-center gap-2.5 rounded-full bg-black/50 py-1.5 pl-1.5 pr-4 backdrop-blur-sm ring-1 ring-inset ring-white/12 xl:gap-3 xl:py-2 xl:pl-2 xl:pr-5"
        >
          <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold tracking-[1px] text-background xl:px-3 xl:py-1.5 xl:text-xs">
            EST. {since}
          </span>
          <span className="text-xs tracking-[0.5px] text-secondary-foreground xl:text-sm">
            Municipal Repository Cemetery
          </span>
        </motion.div>

        {/* Headstone */}
        <motion.h1
          {...rise(0.08)}
          className="mt-6 max-w-4xl font-serif text-5xl font-normal leading-[0.94] tracking-[-1px] [text-shadow:0_2px_50px_rgba(0,0,0,0.95)] sm:text-6xl md:mt-7 md:text-7xl lg:max-w-5xl lg:text-[5.5rem] xl:max-w-6xl xl:text-[6.75rem] 2xl:text-[7.25rem]"
        >
          The Website Your Projects
          <br />
          <span className="italic">Never Became</span>
        </motion.h1>

        <motion.p
          {...rise(0.16)}
          className="mt-6 max-w-xl text-base leading-relaxed [text-shadow:0_2px_24px_rgba(0,0,0,0.95)] md:text-lg lg:mt-7 xl:max-w-2xl xl:text-xl"
          style={{ color: "hsl(var(--hero-subtitle))" }}
        >
          Every repo you opened and walked away from, given a plot, a stone and an honest
          sentence. Read the records, or put something new in the ground.
        </motion.p>

        {/* Two ways in */}
        <motion.div
          {...rise(0.24)}
          className="mt-7 flex flex-wrap items-center justify-center gap-3 md:mt-8"
        >
          <motion.a
            href="#main-cluster"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background xl:px-9 xl:py-4 xl:text-base"
          >
            Walk the grounds
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5 xl:h-[18px] xl:w-[18px]" />
          </motion.a>
          <motion.a
            href="#burial-ground"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="liquid-glass flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-foreground xl:px-9 xl:py-4 xl:text-base"
          >
            <Shovel className="h-4 w-4 xl:h-[18px] xl:w-[18px]" />
            Bury a project
          </motion.a>
        </motion.div>
      </div>

      {/* ---- The roll. Where a landing page lists its customers, this one lists its dead. ---- */}
      <motion.div {...rise(0.34)} className="relative z-10 px-6 pb-8 text-center md:pb-10">
        <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground xl:text-[11px]">
          {interred} interred · among them
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 xl:mt-5 xl:gap-x-11">
          {roll.map((name) => (
            <span
              key={name}
              className="font-serif text-sm text-foreground/45 transition-colors hover:text-foreground/80 md:text-base xl:text-lg"
            >
              {name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
