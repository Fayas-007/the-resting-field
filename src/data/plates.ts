/**
 * The four grounds backdrops.
 *
 * Photos: Unsplash (free licence, commercial use, no attribution required).
 * They are fetched pre-desaturated (`sat=-100`) so the page stays monochrome
 * like the rest of the site; any warmth or moss below comes from the *scrim*,
 * never from the photograph.
 *
 *   Old Ground      unsplash.com/photos/H0ywKW_lGFc
 *   Burial Ground   unsplash.com/photos/e0bPLaMOv0k
 *   Chamber         unsplash.com/photos/KTpVvAtrzCg
 *
 * The journey darkens as it descends: 0.70 → 0.62 → 0.52 brightness.
 * (Main Path sits ahead of these at 0.50 but is masked to a narrow corridor,
 * so it reads as the faintest of the four.)
 */
export interface Plate {
  src: string;
  filter: string;
  scrims: string[];
  position?: string;
  narrowBoost?: string;
}

/** Darker at the edges, lighter through the middle — the band the cards sit in. */
const band = (edge: number, mid: number) =>
  `linear-gradient(180deg, rgba(0,0,0,${edge}) 0%, rgba(0,0,0,${mid + 0.1}) 24%, ` +
  `rgba(0,0,0,${mid}) 50%, rgba(0,0,0,${mid + 0.08}) 74%, rgba(0,0,0,${edge}) 100%)`;

/*
 * Main Path has no still plate — it uses PathPlate, a scroll-driven ground plane.
 * A second full cemetery scene straight after the gate was too much picture too
 * soon; the path is now texture underfoot instead.
 */

/*
 * Old Ground has no still plate either — it uses OldGroundPlate, which carries its
 * own edge masks so the section dissolves into its neighbours instead of butting
 * up against them.
 */

/** Fresh plot: disturbed earth, no stone yet. Felt more than seen. */
export const burialPlate: Plate = {
  src: "/bg-burial.jpg",
  filter: "grayscale(1) contrast(1.06) brightness(0.62)",
  scrims: [band(0.98, 0.8), "radial-gradient(70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)"],
  position: "50% 50%",
};

/** The crypt: vaulted stone, the only warm light in the cemetery. */
export const chamberPlate: Plate = {
  src: "/bg-chamber.jpg",
  filter: "grayscale(1) contrast(1.05) brightness(0.52)",
  scrims: [
    band(0.97, 0.74),
    "radial-gradient(70% 60% at 50% 48%, transparent 0%, rgba(0,0,0,0.5) 100%)",
    // Candlelight, carried entirely by the scrim.
    "radial-gradient(62% 55% at 50% 46%, rgba(126,78,30,0.26) 0%, rgba(64,36,12,0.13) 55%, rgba(0,0,0,0) 100%)",
  ],
  position: "50% 55%",
};
