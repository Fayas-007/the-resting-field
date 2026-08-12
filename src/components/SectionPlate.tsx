/**
 * Photographic backdrop for the grounds sections.
 *
 * Deliberately NOT shared with the Gate. The hero composites its plate inline
 * with its own filter/scrim stack, and that output is frozen — this component
 * duplicates the idea rather than refactoring the hero into it.
 *
 * Every plate is lazy-loaded: all four sections sit below the initial viewport.
 */
interface SectionPlateProps {
  src: string;
  /** CSS filter for the photo itself. Photos ship desaturated; this grades them. */
  filter: string;
  /** Scrims painted over the photo, first listed = furthest back. */
  scrims: string[];
  /** object-position, so the subject survives narrow crops. */
  position?: string;
  /**
   * Extra darkening for narrow viewports. `object-fit: cover` on a tall, narrow
   * section crops hard into the middle of the photo — if that happens to be the
   * brightest region, text contrast falls off a cliff. Tailwind classes so it
   * can be scoped to a breakpoint.
   */
  narrowBoost?: string;
}

export default function SectionPlate({
  src,
  filter,
  scrims,
  position = "50% 50%",
  narrowBoost,
}: SectionPlateProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
        style={{ filter, objectPosition: position }}
      />
      {scrims.map((background, i) => (
        <div key={i} className="absolute inset-0" style={{ background }} />
      ))}
      {narrowBoost && <div className={`absolute inset-0 ${narrowBoost}`} />}
    </div>
  );
}
