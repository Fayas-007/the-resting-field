import { motion } from "framer-motion";
import { useState } from "react";
import type { Project } from "../data/projects";
import FlagButton from "./FlagButton";

/**
 * Main Path card.
 *
 * Closed it is a casket — head, shoulders, tapering to the foot — with nothing on
 * it but the project's name, etched into the lid. Clicking splits the lid at the
 * waist: the upper panel swings up on its hinge and the lower panel drops away,
 * the way a half-couch casket actually opens. Underneath is the record.
 *
 * The silhouette morphs to a rounded rectangle as it opens, so the tapered
 * shoulders and foot can't clip the revealed content. Both clip-paths carry five
 * points, which is what lets the browser interpolate between them natively.
 *
 * Old Ground keeps the original `Coffin` — this shape is the Main Path's alone.
 */
const CLOSED_CLIP = "polygon(50% 0%, 100% 17%, 88% 100%, 12% 100%, 0% 17%)";
const OPEN_CLIP = "polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)";

interface CasketCardProps {
  project: Project;
  index?: number;
}

/** Split "Node.js · Discord.js" into individual tags. */
const toTags = (stack: string) =>
  stack
    .split("·")
    .map((s) => s.trim())
    .filter((s) => s && s !== "—");

/** Anything whose last commit landed this year hasn't gone cold yet. */
function statusOf(project: Project) {
  const year = project.closed.slice(0, 4);
  const thisYear = String(new Date().getFullYear());
  return year === thisYear
    ? { label: "Still breathing", warm: true }
    : { label: `Abandoned ${year}`, warm: false };
}

export default function CasketCard({ project, index = 0 }: CasketCardProps) {
  const [open, setOpen] = useState(false);
  const tags = toTags(project.stack);
  const status = statusOf(project);

  const toggle = () => setOpen((v) => !v);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: "easeOut" }}
    >
      {/*
        A div rather than a <button>: the record holds a real link, and an anchor
        nested inside a button is invalid and announces badly. role/tabIndex/keydown
        restore everything a button gave us.
      */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={
          open ? `Close the record for ${project.name}` : `Open the record for ${project.name}`
        }
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        className="group relative block w-full cursor-pointer rounded-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <div
          className="relative aspect-[0.63] w-full select-none"
          style={{ perspective: "1200px" }}
        >
          {/* ---- The box, and the record inside it ---- */}
          <div
            className="absolute inset-0 bg-card transition-[clip-path,box-shadow,border-radius] duration-500 ease-out"
            style={{
              clipPath: open ? OPEN_CLIP : CLOSED_CLIP,
              borderRadius: open ? "1rem" : "0rem",
              // Lit from inside once open, so an opened casket never reads as broken.
              boxShadow: open
                ? "inset 0 0 0 1px rgba(255,255,255,0.14), 0 24px 60px -20px rgba(0,0,0,0.95), 0 0 46px -12px rgba(255,255,255,0.10)"
                : "0 20px 45px -25px rgba(0,0,0,0.9)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75" />
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 py-6 text-center"
            aria-hidden={!open}
            style={{
              opacity: open ? 1 : 0,
              // Fades in behind the lid, so the record is waiting by the time the
              // panels clear rather than popping in after them.
              transition: `opacity 300ms ease ${open ? "260ms" : "0ms"}`,
            }}
          >
            <h3 className="text-sm font-semibold leading-snug text-card-foreground">
              {project.name}
            </h3>

            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[1px] ${
                status.warm
                  ? "bg-foreground/90 text-background"
                  : "bg-white/[0.07] text-muted-foreground ring-1 ring-inset ring-white/10"
              }`}
            >
              {status.label}
            </span>

            <p className="font-serif text-base italic leading-snug text-secondary-foreground">
              &ldquo;{project.epitaph}&rdquo;
            </p>

            <ul className="flex flex-wrap items-center justify-center gap-1.5">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-secondary-foreground ring-1 ring-inset ring-white/10"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <p className="text-[10px] text-muted-foreground">
              {project.stars}★ · {project.commits} commits
            </p>

            {project.repo ? (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 rounded-full bg-foreground px-4 py-1.5 text-[11px] font-medium tracking-wide text-background transition-opacity hover:opacity-85"
              >
                Open Repo
              </a>
            ) : (
              <span className="mt-0.5 rounded-full px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground ring-1 ring-inset ring-white/10">
                No Repo Left
              </span>
            )}

            {project.source === "live" && <FlagButton projectId={project.id} />}
          </div>

          {/* ---- Lid, split at the waist ---- */}
          <LidPanel half="top" open={open} clip={CLOSED_CLIP}>
            <span className="engrave px-[18%] text-center text-[11px] font-semibold uppercase leading-snug tracking-[1.5px] text-white/70">
              {project.name}
            </span>
          </LidPanel>

          <LidPanel half="bottom" open={open} clip={CLOSED_CLIP}>
            <span className="engrave mb-1 block h-px w-8 bg-white/20" />
            <span className="text-[10px] uppercase tracking-[2px] text-white/25 transition-colors group-hover:text-white/45">
              lift the lid
            </span>
          </LidPanel>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * One half of the lid. Each panel clips the *whole* casket silhouette but only
 * shows its own half, so the two together are seamless when shut. The hinge sits
 * on the waist — the shared edge — and the backface is hidden so a panel simply
 * stops existing once it passes vertical.
 */
function LidPanel({
  half,
  open,
  clip,
  children,
}: {
  half: "top" | "bottom";
  open: boolean;
  clip: string;
  children: React.ReactNode;
}) {
  const isTop = half === "top";
  const angle = open ? (isTop ? -180 : 180) : 0;
  return (
    // A CSS transition, not a JS-driven one: the flip is the whole interaction, and
    // it shouldn't depend on an animation frame loop to land.
    <div
      className={`absolute inset-x-0 h-1/2 overflow-hidden ${isTop ? "top-0" : "bottom-0"}`}
      style={{
        transform: `rotateX(${angle}deg)`,
        transition: "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        transformOrigin: isTop ? "bottom center" : "top center",
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {/* Full-height silhouette, offset so this panel shows only its own half */}
      <div
        className="wood-grain absolute inset-x-0 h-[200%]"
        style={{ clipPath: clip, top: isTop ? 0 : "-100%" }}
      />
      <div
        className="absolute inset-x-0 h-[200%]"
        style={{
          clipPath: clip,
          top: isTop ? 0 : "-100%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 34%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
