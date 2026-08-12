import { Flag } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabase";

type State = "idle" | "sending" | "done" | "error";

/**
 * Report control for live (Supabase-backed) cards only. Static seed entries
 * have no database row to flag, so callers should not render this for them
 * — see `project.source` in data/projects.ts.
 */
export default function FlagButton({ projectId }: { projectId: string }) {
  const [state, setState] = useState<State>("idle");

  if (!supabase) return null;
  const client = supabase;

  const report = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state === "sending" || state === "done") return;
    setState("sending");
    try {
      const { data, error } = await client.functions.invoke("flag-project", {
        body: { id: projectId },
      });
      if (error || !data?.ok) throw error ?? new Error(data?.error ?? "flag failed");
      setState("done");
    } catch (err) {
      console.error("report failed", err);
      setState("error");
    }
  };

  const label = { idle: "Report", sending: "Reporting…", done: "Reported", error: "Try again" }[
    state
  ];

  return (
    <button
      type="button"
      onClick={report}
      disabled={state === "sending" || state === "done"}
      className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-[1px] text-muted-foreground/70 transition-colors hover:text-muted-foreground disabled:cursor-default disabled:hover:text-muted-foreground/70"
    >
      <Flag className="h-2.5 w-2.5" />
      {label}
    </button>
  );
}
