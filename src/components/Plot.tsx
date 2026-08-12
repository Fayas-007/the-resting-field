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

        {/* One coffin per row on phones — the record needs the width to stay readable. */}
        <div className="mx-auto mt-20 grid max-w-[300px] grid-cols-1 gap-x-6 gap-y-14 sm:max-w-6xl sm:grid-cols-2 sm:gap-x-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-12">
          {projects.map((project, i) => (
            <Card key={project.id} project={project} weathered={weathered} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
