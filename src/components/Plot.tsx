import type { Project } from "../data/projects";
import type { Plate } from "../data/plates";
import Coffin from "./Coffin";
import SectionIntro from "./SectionIntro";
import SectionPlate from "./SectionPlate";

interface PlotProps {
  id: string;
  eyebrow: string;
  heading: React.ReactNode;
  subtext: string;
  projects: Project[];
  weathered?: boolean;
  /** Photographic backdrop the coffins sit inside. */
  plate?: Plate;
  /** Or a bespoke backdrop, for sections that need more than a still plate. */
  plateNode?: React.ReactNode;
  /** Card to render each project with. Defaults to the original casket. */
  Card?: React.ComponentType<{ project: Project; weathered?: boolean; index?: number }>;
}

export default function Plot({
  id,
  eyebrow,
  heading,
  subtext,
  projects,
  weathered = false,
  plate,
  plateNode,
  Card = Coffin,
}: PlotProps) {
  return (
    <section
      id={id}
      className="relative overflow-hidden px-6 py-28 md:px-28 md:py-36"
    >
      {plateNode ?? (plate && <SectionPlate {...plate} />)}

      <div className="relative z-10">
        <SectionIntro eyebrow={eyebrow} heading={heading} subtext={subtext} />

        {/*
          Flex-wrap rather than a grid: section counts vary (Old Ground has 3
          caskets, the Main Path 5, and both grow as live submissions are
          approved), so a fixed 4-track grid leaves a trailing empty column
          that shifts a short row off the section's centre axis. Wrapping flex
          items centre every row, full or partial. Widths below reproduce the
          old track sizes exactly: (100% - totalGap) / columns.
          One coffin per row on phones — the record needs the width to stay readable.
        */}
        <div className="mx-auto mt-20 flex max-w-[300px] flex-wrap justify-center gap-x-6 gap-y-14 sm:max-w-6xl sm:gap-x-10 lg:gap-x-12">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="w-full sm:w-[calc((100%-2.5rem)/2)] md:w-[calc((100%-5rem)/3)] lg:w-[calc((100%-9rem)/4)]"
            >
              <Card project={project} weathered={weathered} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
