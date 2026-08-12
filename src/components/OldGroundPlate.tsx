/**
 * The Old Ground backdrop.
 *
 * A field of weathered headstones and crosses going back into heavy fog. The fog
 * is the problem: it is the brightest thing in any of the section photographs, and
 * the intro copy sits right on top of it. So this gets the same treatment as the
 * Main Path — graded hard down, then buried under layered scrims until it lands in
 * "felt not seen" territory rather than merely dimmed.
 *
 * Both ends dissolve to nothing via a mask on the photograph itself, so the section
 * cannot hard-cut against the ones above and below it. The page is meant to read as
 * one continuous descent, not four stacked panels.
 *
 * Photo: Unsplash (free licence) — unsplash.com/photos/A9vTEsP1EV8
 * Shipped pre-desaturated (`sat=-100`); the page stays monochrome.
 */
const EDGE_FADE =
  "linear-gradient(180deg, transparent 0%, #000 14%, #000 80%, transparent 100%)";

export default function OldGroundPlate() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src="/bg-old-ground.jpg"
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
        style={{
          // Contrast pushed up before the scrims go on: flat fog has almost no
          // dynamic range, so without it the mean rides right under the peak and
          // the whole frame reads as one grey wash instead of stones in weather.
          filter: "grayscale(1) contrast(1.45) brightness(0.45)",
          objectPosition: "50% 60%",
          WebkitMaskImage: EDGE_FADE,
          maskImage: EDGE_FADE,
        }}
      />

      {/* Body of the scrim — full black at both edges so the seam is a fade, not a line */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.91) 16%, rgba(0,0,0,0.82) 34%, rgba(0,0,0,0.80) 62%, rgba(0,0,0,0.89) 84%, #000 100%)",
        }}
      />
      {/* Verges: the ground falls away to black at the sides */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(66% 56% at 50% 52%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.88) 100%)",
        }}
      />
    </div>
  );
}
