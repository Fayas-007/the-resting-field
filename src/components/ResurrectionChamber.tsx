import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { AnimationPlaybackControls } from "framer-motion";
import { useRef, useState } from "react";
import { fadeUp } from "../lib/animations";
import { theFirstOne } from "../data/projects";
import { chamberPlate } from "../data/plates";
import SectionPlate from "./SectionPlate";

const LID_CLIP = "polygon(0% 28%, 13% 0%, 100% 13%, 100% 87%, 13% 100%, 0% 72%)";
const HOLD_SECONDS = 2;

export default function ResurrectionChamber() {
  const [resurrected, setResurrected] = useState(false);
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);

  const rotateX = useTransform(progress, [0, 1], [0, -100]);
  const fillWidth = useTransform(progress, [0, 1], ["0%", "100%"]);
  const interiorOpacity = useTransform(progress, [0.55, 1], [0, 1]);

  const startHold = () => {
    if (resurrected) return;
    controls.current?.stop();
    controls.current = animate(progress, 1, {
      duration: HOLD_SECONDS * (1 - progress.get()),
      ease: "linear",
      onComplete: () => setResurrected(true),
    });
  };

  const endHold = () => {
    if (resurrected) return;
    controls.current?.stop();
    controls.current = animate(progress, 0, { duration: 0.45, ease: "easeIn" });
  };

  return (
    <section
      id="resurrection-chamber"
      className="relative overflow-hidden px-6 py-28 md:px-28 md:py-36"
    >
      <SectionPlate {...chamberPlate} />
      <div className="fog absolute inset-0 animate-flicker" aria-hidden="true" />

      <div className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            {...fadeUp(0)}
            className="text-xs uppercase tracking-[3px] text-muted-foreground"
          >
            The Resurrection Chamber
          </motion.p>
          <motion.h2
            {...fadeUp(0.1)}
            className="mt-6 text-4xl font-medium tracking-[-1.5px] md:text-6xl"
          >
            Nothing here is gone until you{" "}
            <span className="font-serif font-normal italic">stop trying</span>
          </motion.h2>
        </div>

        {/* ---- Featured coffin ---- */}
        <motion.div {...fadeUp(0.2)} className="mx-auto mt-16 w-full max-w-3xl">
          <div
            className="relative aspect-[1.6] w-full select-none sm:aspect-[2.1] md:aspect-[2.5]"
            style={{ perspective: "1800px" }}
          >
            <div className="absolute inset-0 bg-card" style={{ clipPath: LID_CLIP }}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
            </div>

            <motion.div
              style={{ opacity: interiorOpacity }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-[16%] text-center"
            >
              <h3 className="text-lg font-semibold">{theFirstOne.name}</h3>
              <p className="text-[11px] uppercase tracking-[2px] text-muted-foreground">
                b. {theFirstOne.opened} <span className="mx-0.5">†</span> {theFirstOne.closed}
              </p>
              <p className="font-serif text-xl italic text-secondary-foreground md:text-2xl">
                &ldquo;{theFirstOne.epitaph}&rdquo;
              </p>
            </motion.div>

            <motion.div
              style={{ rotateX, transformOrigin: "top center", transformStyle: "preserve-3d" }}
              className="absolute inset-0"
            >
              <div
                className="wood-grain absolute inset-0 shadow-[0_50px_90px_-30px_rgba(0,0,0,1)]"
                style={{ clipPath: LID_CLIP }}
              />
              <div className="absolute inset-x-[6%] top-1/2 h-px -translate-y-1/2 bg-white/[0.05]" />
              <div className="absolute inset-0 flex items-center justify-center px-[14%]">
                <span className="engrave text-center text-xl font-medium uppercase tracking-[3px] text-white/60 md:text-3xl">
                  Hold to Resurrect
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ---- Status + control ---- */}
        <motion.div
          {...fadeUp(0.3)}
          className="mx-auto mt-12 flex max-w-md flex-col items-center text-center"
        >
          <span
            className={`text-xs uppercase tracking-[3px] ${
              resurrected ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {resurrected ? "Active" : "Awaiting Resurrection"}
          </span>

          <button
            type="button"
            disabled={resurrected}
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                if (!e.repeat) startHold();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") endHold();
            }}
            className="liquid-glass relative mt-5 w-full touch-none overflow-hidden rounded-lg px-8 py-3.5 text-sm font-semibold tracking-wide text-foreground disabled:opacity-60"
          >
            <motion.span
              style={{ width: fillWidth }}
              className="absolute inset-y-0 left-0 bg-foreground/15"
              aria-hidden="true"
            />
            <span className="relative">
              {resurrected ? "Back Among the Living" : "Hold to Resurrect"}
            </span>
          </button>

          <p className="mt-4 text-sm text-muted-foreground">
            {resurrected
              ? "It is out of the ground. What you do with it now is your problem."
              : "Press and hold. Let go too soon and the lid falls shut again."}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
