import { Link } from "react-router-dom";

const LID_CLIP = "polygon(0% 28%, 13% 0%, 100% 13%, 100% 87%, 13% 100%, 0% 72%)";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div className="fog absolute inset-0 animate-flicker" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center">
        {/* An empty plot — the lid is askew, nothing was ever laid here. */}
        <div
          className="relative mb-10 aspect-[2.2] w-full max-w-sm select-none"
          style={{ perspective: "1200px" }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-card" style={{ clipPath: LID_CLIP }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85" />
          </div>
          <div
            className="wood-grain absolute inset-0"
            style={{
              clipPath: LID_CLIP,
              transform: "rotate(-7deg) translateX(6%)",
              transformOrigin: "60% 40%",
              boxShadow: "0 30px 60px -25px rgba(0,0,0,0.95)",
            }}
          />
        </div>

        <p className="text-xs uppercase tracking-[3px] text-muted-foreground">Plot 404</p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-1px] md:text-5xl">
          Nothing was ever <span className="font-serif font-normal italic">buried here</span>
        </h1>
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
