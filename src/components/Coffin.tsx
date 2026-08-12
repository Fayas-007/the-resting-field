import { motion } from "framer-motion";
import { useState } from "react";
import type { Project } from "../data/projects";
import { cn } from "../lib/utils";
import FlagButton from "./FlagButton";

/** Vertical casket silhouette: head, shoulders, tapering to the foot. */
const COFFIN_CLIP = "polygon(50% 0%, 100% 17%, 88% 100%, 12% 100%, 0% 17%)";

interface CoffinProps {
  project: Project;
  /** Old Ground caskets get the weathered grain and a longer lid hinge. */
  weathered?: boolean;
  index?: number;
}

export default function Coffin({ project, weathered = false, index = 0 }: CoffinProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: "easeOut" }}
    >
      {/*
        A div rather than a <button>: this coffin now holds a FlagButton (and
        may hold a repo <a>), and neither an interactive element nor an
        anchor is valid nested inside a real <button>. role/tabIndex/keydown
        restore everything a button gave us.
      */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        aria-expanded={open}
        aria-label={
          open ? `Close the record for ${project.name}` : `Open the record for ${project.name}`
        }
        className="group relative block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-sm"
      >
        <div
          className="relative w-full aspect-[0.63] select-none"
          style={{ perspective: "1400px" }}
        >
          {/* ---- Interior: the record itself ---- */}
          <div
            className="absolute inset-0 bg-card"
            style={{ clipPath: COFFIN_CLIP }}
            aria-hidden={!open}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
          </div>

          <motion.div
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: 0.35, delay: open ? 0.28 : 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-[14%] py-[16%] text-center"
          >
            <h3 className="text-sm font-semibold leading-snug text-card-foreground">
              {project.name}
            </h3>

            <p className="text-[11px] uppercase tracking-[1.5px] text-muted-foreground">
              b. {project.opened} <span className="mx-0.5">†</span> {project.closed}
            </p>

            <p className="font-serif text-base italic leading-snug text-secondary-foreground">
              &ldquo;{project.epitaph}&rdquo;
            </p>

            <p className="text-[11px] text-muted-foreground">
              {project.stack} · {project.stars}★ · {project.commits} commits
            </p>

            {project.repo ? (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                className="mt-1 rounded-full bg-foreground px-4 py-1.5 text-[11px] font-medium tracking-wide text-background transition-opacity hover:opacity-85"
              >
                Open Repo
              </a>
            ) : (
              <span className="liquid-glass mt-1 rounded-full px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                No Repo Left
              </span>
            )}

            {project.source === "live" && <FlagButton projectId={project.id} />}
          </motion.div>

          {/* ---- Lid ---- */}
          <motion.div
            animate={{ rotateX: open ? -104 : 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            style={{ transformOrigin: "top center", transformStyle: "preserve-3d" }}
          >
            <div
              className={cn(
                "absolute inset-0 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)]",
                weathered ? "wood-grain-old" : "wood-grain",
              )}
              style={{ clipPath: COFFIN_CLIP }}
            />
            {/* Seam down the centre of the lid */}
            <div className="absolute inset-y-[18%] left-1/2 w-px -translate-x-1/2 bg-white/[0.06]" />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-[16%] text-center">
              <span
                className={cn(
                  "engrave text-[11px] font-semibold uppercase leading-snug tracking-[1.5px]",
                  weathered ? "text-white/45" : "text-white/70",
                )}
              >
                {project.name}
              </span>
              <span className="engrave mt-2 block h-px w-8 bg-white/20" />
              <span className="mt-2 text-[10px] uppercase tracking-[2px] text-white/25 transition-colors group-hover:text-white/45">
                lift the lid
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}
