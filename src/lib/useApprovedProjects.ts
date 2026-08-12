import { useEffect, useState } from "react";
import type { Project } from "../data/projects";
import { supabase } from "./supabase";
import { submissionToProject, type Submission } from "./submissions";

interface ApprovedProjects {
  main: Project[];
  old: Project[];
  loading: boolean;
  /** Non-null only on a real fetch failure — an unconfigured backend is not an error. */
  error: string | null;
}

/**
 * Live, publicly-approved submissions from Supabase, split by ground. Merges
 * on top of the static seed arrays in App.tsx — this hook only ever returns
 * what came from the database.
 *
 * If Supabase isn't configured yet, resolves immediately to empty arrays so
 * the site still renders its seed content with no error state.
 */
export function useApprovedProjects(): ApprovedProjects {
  const [main, setMain] = useState<Project[]>([]);
  const [old, setOld] = useState<Project[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("submissions")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .returns<Submission[]>();

        if (cancelled) return;

        if (fetchError) {
          console.error("failed to load approved submissions", fetchError);
          setError("Couldn't reach the graveyard's records right now.");
          setLoading(false);
          return;
        }

        const projects = (data ?? []).map(submissionToProject);
        setMain(projects.filter((p) => p.ground === "main"));
        setOld(projects.filter((p) => p.ground === "old"));
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("failed to load approved submissions", err);
        setError("Couldn't reach the graveyard's records right now.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { main, old, loading, error };
}
