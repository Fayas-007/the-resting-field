import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      {/*
        Soil texture, pushed almost all the way down into the black. It should
        register as grain in the dark rather than as a photograph — hence the
        stacked reduction: greyscale strips the colour, brightness(0.34) drops
        the exposure, and 0.16 opacity blends what's left toward the page's
        background. A radial mask then eats the centre so the type never has
        to fight texture for contrast, and fades the edges out before they
        reach the viewport border.
      */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        aria-hidden="true"
        style={{
          backgroundImage: "url(/bg-path-soil.jpg)",
          filter: "grayscale(1) contrast(1.05) brightness(0.34)",
          opacity: 0.16,
          WebkitMaskImage:
            "radial-gradient(70% 60% at 50% 50%, transparent 0%, #000 78%, #000 100%)",
          maskImage:
            "radial-gradient(70% 60% at 50% 50%, transparent 0%, #000 78%, #000 100%)",
        }}
      />

      <div className="fog absolute inset-0 animate-flicker" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center">
        {/*
          Text carries the page now — no coffin graphic. Instrument Serif
          rather than the UI sans: cut caps on a headstone are serif, and the
          site already uses this face for its accents. Weight stays 400 —
          it's the only weight loaded, so anything heavier would be a
          synthetic bold. Same engrave shadow as the lid nameplates, at
          monument scale. Tracking tightens on small screens; wide letter-
          spacing on eight characters overflows a phone fast.
        */}
        <h1 className="engrave select-none font-serif text-[5.5rem] font-normal uppercase leading-none tracking-[2px] text-white/80 sm:text-9xl sm:tracking-[6px] md:text-[13rem] md:tracking-[10px]">
          Plot 404
        </h1>
        <span className="engrave mt-6 block h-px w-16 bg-white/20" aria-hidden="true" />

        <p className="mt-8 text-2xl font-medium tracking-[-0.5px] md:text-3xl">
          Nothing was ever <span className="font-serif font-normal italic">buried here</span>
        </p>
        <p className="mt-4 max-w-md text-sm text-muted-foreground md:text-base">
          Whatever page you were looking for doesn't have a plot in this cemetery.
        </p>

        <Link
          to="/"
          className="mt-8 rounded-full bg-foreground px-7 py-3 text-xs font-semibold tracking-[1.5px] text-background transition-opacity hover:opacity-85"
        >
          BACK TO THE GATE
        </Link>
      </div>
    </main>
  );
}
