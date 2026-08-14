import { ArrowDownToLine } from "lucide-react";

/**
 * Hands this project to the Resurrection Chamber and scrolls there.
 *
 * Deliberately additive: the repo link stays in the coffin, so nobody is
 * forced through the hold-to-resurrect ritual to reach the code. This is the
 * ceremonial route for anyone who wants it, and the only thing on the site
 * that points at the chamber.
 *
 * Verdigris on hover, matching the chamber it leads to — the same colour that
 * bleeds in as the lid comes up.
 */
export default function SendToChamber({
  projectId,
  onSend,
}: {
  projectId: string;
  onSend: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // The whole casket is a click target that toggles its lid — without
        // this, sending would also slam the lid shut on the way out.
        e.stopPropagation();
        onSend(projectId);
      }}
      className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-[1px] text-muted-foreground/70 transition-colors hover:text-[hsl(170_15%_62%)]"
    >
      <ArrowDownToLine className="h-2.5 w-2.5" />
      Send to the chamber
    </button>
  );
}
