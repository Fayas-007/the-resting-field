import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

/**
 * The Main Path backdrop.
 *
 * Not a photograph hung behind the cards — a *ground plane*. The soil texture is
 * laid flat with a CSS 3D rotation so it recedes toward a horizon near the top of
 * the section, and its texture scrolls along that plane as the page scrolls. Going
 * down the page walks you up the path; the earth passes under your feet.
 *
 * The perspective does the hard work: a rotated plane converges on its own, so the
 * exposed earth naturally narrows to a corridor without a single mask. Everything
 * above the horizon is void.
 *
 * Kept deliberately faint — this sits between the gate and the deeper ground, and
 * it should read as texture underfoot, not as another picture.
 */
export default function PathPlate() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // The texture travels along the plane rather than the plane moving on screen,
  // so the ground flows instead of sliding.
  const groundY = useTransform(scrollYProgress, [0, 1], ["0%", "62%"]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/*
        Perspective has to clear the plane's depth: points rotate to z = sin(62°)·y,
        and anything reaching z = the perspective distance is behind the camera and
        gets clipped. 900px against a ~55%-height plane keeps the whole thing in
        front of the lens and lands the near edge around the foot of the section.
      */}
      <div
        className="absolute inset-0"
        style={{ perspective: "900px", perspectiveOrigin: "50% 0%" }}
      >
        <motion.div
          className="absolute left-1/2 w-[240%] -translate-x-1/2"
          style={{
            /*
              Both capped in px, not left as pure percentages. On mobile the section
              runs several thousand pixels tall, and a 55% plane rotates to a depth
              far past the 900px camera plane — the far half ends up behind the lens
              and the projection inverts. sin(62°)·820 = 724px keeps it in front at
              any section height.
            */
            top: "min(24%, 300px)",
            height: "min(55%, 820px)",
            backgroundImage: "url(/bg-path-soil.jpg)",
            backgroundSize: "58% auto",
            backgroundRepeat: "repeat",
            backgroundPositionY: reduced ? "0%" : groundY,
            transform: "rotateX(62deg)",
            transformOrigin: "50% 0%",
            filter: "grayscale(1) contrast(1.12) brightness(0.5)",
            // Dissolve both ends so the plane can never show a hard edge, whatever
            // the section height does to the projection.
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, #000 16%, #000 70%, transparent 100%)",
            maskImage:
              "linear-gradient(180deg, transparent 0%, #000 16%, #000 70%, transparent 100%)",
          }}
        />
      </div>

      {/* Horizon — everything beyond the far edge of the path is nothing at all */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.86) 34%, rgba(0,0,0,0.84) 62%, rgba(0,0,0,0.92) 82%, #000 100%)",
        }}
      />
      {/* Verges: the path is only ever lit down its middle */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 52% at 50% 62%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.9) 100%)",
        }}
      />
    </div>
  );
}
