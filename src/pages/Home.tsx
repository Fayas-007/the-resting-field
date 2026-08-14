import { useCallback, useMemo, useState } from "react";
import Gate from "../components/Gate";
import Plot from "../components/Plot";
import BurialGround from "../components/BurialGround";
import ResurrectionChamber from "../components/ResurrectionChamber";
import Footer from "../components/Footer";
import { mainCluster, oldGround } from "../data/projects";
import PathPlate from "../components/PathPlate";
import OldGroundPlate from "../components/OldGroundPlate";
import CasketCard from "../components/CasketCard";
import { useApprovedProjects } from "../lib/useApprovedProjects";

export default function Home() {
  const live = useApprovedProjects();

  // Live submissions lead (freshest first, matching the old client-only
  // "bury" behaviour), seed data follows. Memoised because `buried` is a
  // dependency of the chamber's target effect — a fresh array every render
  // would re-fire it on every render.
  const main = useMemo(() => [...live.main, ...mainCluster], [live.main]);
  const old = useMemo(() => [...live.old, ...oldGround], [live.old]);
  const buried = useMemo(() => [...main, ...old], [main, old]);

  /*
    A coffin can hand its project to the Resurrection Chamber. `seq` rather
    than a bare id: sending the *same* project twice has to re-arm the
    chamber, and an unchanged id would look like no change at all.
  */
  const [chamberTarget, setChamberTarget] = useState<{ id: string; seq: number } | null>(null);

  const sendToChamber = useCallback((id: string) => {
    setChamberTarget((prev) => ({ id, seq: (prev?.seq ?? 0) + 1 }));
    // `scroll-behavior: smooth` lives on <html>, and the reduced-motion block
    // in index.css switches it to auto — so this inherits the right one.
    document.getElementById("resurrection-chamber")?.scrollIntoView();
  }, []);

  // Gate counter: everything in the ground, live.
  const interred = buried.length;

  // The cemetery is as old as its earliest headstone.
  const since = buried.map((p) => p.opened.slice(0, 4)).reduce((a, b) => (b < a ? b : a));

  // Five names for the roll at the foot of the gate — shortest first, so the
  // row stays a row instead of becoming a paragraph.
  const roll = [...buried]
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, 5)
    .map((p) => p.name);

  return (
    <main className="relative min-h-screen bg-background">
      {/*
        The static seed coffins always render regardless of this fetch — a
        failed request to load *additional* live submissions shouldn't take
        the whole page down. It still needs to be visible, not silent.
      */}
      {live.error && (
        <div
          role="status"
          className="liquid-glass fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-xs text-secondary-foreground"
        >
          {live.error}
        </div>
      )}

      <Gate interred={interred} since={since} roll={roll} />

      <Plot
        id="main-cluster"
        eyebrow="The Main Path"
        heading={
          <>
            Open one to read its{" "}
            <span className="font-serif font-normal italic">record</span>
          </>
        }
        subtext="Every coffin holds a project's full history. Click one to lift the lid."
        projects={main}
        plateNode={<PathPlate />}
        Card={CasketCard}
        onSend={sendToChamber}
      />

      <Plot
        id="old-ground"
        eyebrow="The Old Ground"
        heading={
          <>
            Where the <span className="font-serif font-normal italic">oldest</span> ones rest
          </>
        }
        subtext="Higher ambition, deeper neglect. The wood here has seen more weather."
        projects={old}
        weathered
        plateNode={<OldGroundPlate />}
        onSend={sendToChamber}
      />

      <BurialGround />

      <ResurrectionChamber projects={buried} target={chamberTarget} />

      <Footer />
    </main>
  );
}
