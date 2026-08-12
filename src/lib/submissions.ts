import type { Ground } from "../data/projects";

export type SubmissionStatus = "pending" | "approved" | "rejected";

/** Row shape of `public.submissions`, as returned by Supabase. */
export interface Submission {
  id: string;
  name: string;
  epitaph: string;
  stack: string;
  stars: number;
  commits: number;
  repo_url: string | null;
  ground: Ground;
  status: SubmissionStatus;
  flagged: boolean;
  flagged_at: string | null;
  created_at: string;
}

/** `submissions` in the site's own display shape, so live and seed data render identically. */
export function submissionToProject(row: Submission) {
  const year = new Date(row.created_at).getFullYear();
  return {
    id: row.id,
    name: row.name,
    opened: String(year),
    closed: String(year),
    epitaph: row.epitaph,
    stack: row.stack || "—",
    stars: row.stars,
    commits: row.commits,
    repo: row.repo_url,
    ground: row.ground,
    /** Distinguishes live (flaggable, DB-backed) cards from the static seed set. */
    source: "live" as const,
  };
}
