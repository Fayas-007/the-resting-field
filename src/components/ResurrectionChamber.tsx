import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { AnimationPlaybackControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { fadeUp } from "../lib/animations";
import { theFirstOne, type Project } from "../data/projects";
import { chamberPlate } from "../data/plates";
import SectionPlate from "./SectionPlate";

const LID_CLIP = "polygon(0% 28%, 13% 0%, 100% 13%, 100% 87%, 13% 100%, 0% 72%)";
const HOLD_SECONDS = 2;

/** A different index than `avoid`, so "choose another" never re-picks the same grave. */
function pickAnother(count: number, avoid: number) {
  if (count <= 1) return 0;
  const roll = Math.floor(Math.random() * (count - 1));
  return roll >= avoid ? roll + 1 : roll;
}

export default function ResurrectionChamber({
  projects,
  target,
}: {
  projects: Project[];
  /** A specific grave sent up from a coffin. `seq` re-arms on a repeat send. */
  target?: { id: string; seq: number } | null;
}) {
  // Falls back to the lone hand-written project if the graveyard is empty —
  // that only happens if the seed arrays are cleared before any real burial.
  const pool = projects.length > 0 ? projects : [theFirstOne];

  const [index, setIndex] = useState(() => Math.floor(Math.random() * pool.length));
  const [resurrected, setResurrected] = useState(false);
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);

  const rotateX = useTransform(progress, [0, 1], [0, -100]);
  const fillWidth = useTransform(progress, [0, 1], ["0%", "100%"]);
  const interiorOpacity = useTransform(progress, [0.55, 1], [0, 1]);

  // The site is monochrome everywhere else. Colour is the tell that something
  // is coming back, so it bleeds in with the hold and belongs to nothing else.
  const lifeGlow = useTransform(
    progress,
    [0, 1],
    ["hsl(170 15% 45% / 0)", "hsl(170 15% 45% / 0.16)"],
  );

  const subject = pool[Math.min(index, pool.length - 1)];

  /*
    A coffin sent one up. Load it and seal the lid, so the ritual still has to
    be performed — arriving on an already-open coffin would give away the
    reveal the hold exists to earn. Keyed on `target` alone: Home builds a new
    object per send, so a repeat send of the same project still re-fires.
  */
  useEffect(() => {
    if (!target) return;
    const found = pool.findIndex((p) => p.id === target.id);
    if (found < 0) return;
    controls.current?.stop();
    progress.set(0);
    setResurrected(false);
    setIndex(found);
    // `pool` is intentionally not a dependency: it is rebuilt upstream on
    // every render, and re-running this would reseal the lid constantly.
  }, [target]);

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

  // Seal the lid and load a different grave. Snaps rather than animates —
  // the closing lid would otherwise replay the reveal in reverse.
  const chooseAnother = useCallback(() => {
    controls.current?.stop();
    progress.set(0);
    setResurrected(false);
    setIndex((current) => pickAnother(pool.length, current));
  }, [pool.length, progress]);

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

            {/* Life returning to the box, keyed to the same hold progress. */}
            <motion.div
              aria-hidden="true"
              style={{ backgroundColor: lifeGlow, clipPath: LID_CLIP }}
              className="absolute inset-0"
            />

            <motion.div
              style={{ opacity: interiorOpacity }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-[16%] text-center"
            >
              <h3 className="text-lg font-semibold">{subject.name}</h3>
              <p className="text-[11px] uppercase tracking-[2px] text-muted-foreground">
                b. {subject.opened} <span className="mx-0.5">†</span> {subject.closed}
              </p>
              <p className="font-serif text-xl italic text-secondary-foreground md:text-2xl">
                &ldquo;{subject.epitaph}&rdquo;
              </p>
              <p className="text-[11px] text-muted-foreground">
                {subject.stack} · {subject.stars}★ · {subject.commits} commits
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
              resurrected ? "text-[hsl(170_15%_58%)]" : "text-muted-foreground"
            }`}
          >
            {resurrected ? "Active" : "Awaiting Resurrection"}
          </span>

          {resurrected ? (
            <ClaimTag project={subject} onAnother={chooseAnother} />
          ) : (
            <>
              <button
                type="button"
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
                className="liquid-glass relative mt-5 w-full touch-none overflow-hidden rounded-lg px-8 py-3.5 text-sm font-semibold tracking-wide text-foreground"
              >
                <motion.span
                  style={{ width: fillWidth }}
                  className="absolute inset-y-0 left-0 bg-[hsl(170_15%_45%)]/25"
                  aria-hidden="true"
                />
                <span className="relative">Hold to Resurrect</span>
              </button>

              <p className="mt-4 text-sm text-muted-foreground">
                Press and hold. Let go too soon and the lid falls shut again.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * The payoff. A project with a repo can actually be carried out of here, so
 * the tag links to it; one without has nothing left to claim and the tag is
 * stamped spent instead. Either way you can go back for a different grave.
 */
function ClaimTag({ project, onAnother }: { project: Project; onAnother: () => void }) {
  const hasRepo = Boolean(project.repo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-5 flex w-full flex-col items-center"
    >
      {hasRepo ? (
        <a
          href={project.repo ?? undefined}
          target="_blank"
          rel="noreferrer noopener"
          className="toe-tag relative flex w-full items-center justify-between py-4 pl-11 pr-6 text-left"
        >
          <span>
            <span className="block text-[10px] uppercase tracking-[2px] text-[hsl(170_14%_62%)]">
              Claim the remains
            </span>
            <span className="engrave mt-0.5 block text-sm font-semibold tracking-wide text-foreground">
              {project.name}
            </span>
          </span>
          <span aria-hidden="true" className="text-lg text-[hsl(170_14%_62%)]">
            ↗
          </span>
        </a>
      ) : (
        <div className="toe-tag toe-tag-spent relative flex w-full items-center justify-between py-4 pl-11 pr-6 text-left">
          <span>
            <span className="block text-[10px] uppercase tracking-[2px] text-muted-foreground">
              No repo left
            </span>
            <span className="engrave mt-0.5 block text-sm font-semibold tracking-wide text-secondary-foreground">
              {project.name}
            </span>
          </span>
          <span aria-hidden="true" className="text-lg text-muted-foreground">
            †
          </span>
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        {hasRepo
          ? "It is out of the ground. What you do with it now is your problem."
          : "It came up empty. Whatever it was, the code is gone."}
      </p>

      <button
        type="button"
        onClick={onAnother}
        className="mt-4 text-xs uppercase tracking-[2px] text-muted-foreground underline decoration-white/20 underline-offset-4 transition-colors hover:text-foreground"
      >
        Seal it · dig another
      </button>
    </motion.div>
  );
}
