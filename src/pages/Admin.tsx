import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { Submission } from "../lib/submissions";

const fieldClass =
  "w-full rounded-lg bg-input/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none ring-1 ring-inset ring-border/60 transition focus:ring-ring";

/** Not configured at all — no point rendering a login form that can't work. */
function Unconfigured() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="text-xs uppercase tracking-[3px] text-muted-foreground">Admin</p>
        <h1 className="mt-4 text-2xl font-medium">Supabase isn't configured yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Set <code className="text-foreground">VITE_SUPABASE_URL</code> and{" "}
          <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code> in your environment,
          then reload. See SETUP.md for the full checklist.
        </p>
      </div>
    </main>
  );
}

function LoginGate({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) onSignedIn(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [onSignedIn]);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setStatus("sending");
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (signInError) throw signInError;
      setStatus("sent");
    } catch (err) {
      console.error("magic link request failed", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't send the link. Try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="liquid-glass w-full max-w-sm rounded-2xl p-8">
        <p className="text-xs uppercase tracking-[3px] text-muted-foreground">Admin</p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.5px]">Sign in to moderate</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A one-time link goes to your email — no password to leak.
        </p>

        {status === "sent" ? (
          <p className="mt-6 text-sm text-secondary-foreground">
            Check <span className="text-foreground">{email}</span> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={sendLink} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={fieldClass}
              disabled={status === "sending"}
            />
            <button
              type="submit"
              disabled={status === "sending" || !email.trim()}
              className="w-full rounded-full bg-foreground px-6 py-3 text-xs font-semibold tracking-[1.5px] text-background transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              {status === "sending" ? "SENDING…" : "SEND SIGN-IN LINK"}
            </button>
            {status === "error" && (
              <p role="alert" className="text-center text-xs text-red-400/90">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

type ActionState = Record<string, "pending" | "error" | undefined>;

function Queue({ session }: { session: Session }) {
  const [rows, setRows] = useState<Submission[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<ActionState>({});

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoadError(null);
    try {
      // RLS only returns rows at all if this session's email is in
      // `admins` — an empty, error-free result for a non-admin looks
      // identical to "no pending submissions", so we can't distinguish
      // "not an admin" from "all caught up" purely from this query.
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .or("status.eq.pending,flagged.eq.true")
        .order("created_at", { ascending: false })
        .returns<Submission[]>();
      if (error) throw error;
      setRows(data ?? []);
    } catch (err) {
      console.error("failed to load moderation queue", err);
      setLoadError("Couldn't load the queue. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "approve" | "reject" | "delete" | "unflag") => {
    if (!supabase) return;
    setActioning((s) => ({ ...s, [id]: "pending" }));
    try {
      if (action === "delete") {
        const { error } = await supabase.from("submissions").delete().eq("id", id);
        if (error) throw error;
      } else {
        const patch =
          action === "approve"
            ? { status: "approved" as const }
            : action === "reject"
              ? { status: "rejected" as const }
              : { flagged: false, flagged_at: null };
        const { error } = await supabase.from("submissions").update(patch).eq("id", id);
        if (error) throw error;
      }
      setRows((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    } catch (err) {
      console.error(`admin action "${action}" failed`, err);
      setActioning((s) => ({ ...s, [id]: "error" }));
      return;
    }
    setActioning((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <button
          onClick={load}
          className="rounded-full bg-foreground px-6 py-2.5 text-xs font-semibold tracking-[1.5px] text-background"
        >
          RETRY
        </button>
      </main>
    );
  }

  if (rows === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading the queue…</p>
      </main>
    );
  }

  const pending = rows.filter((r) => r.status === "pending");
  const flaggedLive = rows.filter((r) => r.status === "approved" && r.flagged);

  return (
    <main className="min-h-screen bg-background px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[3px] text-muted-foreground">Admin</p>
            <h1 className="mt-2 text-3xl font-medium tracking-[-0.5px]">Moderation queue</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {session.user.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="liquid-glass rounded-full px-5 py-2 text-xs font-medium tracking-[1px] text-foreground"
          >
            SIGN OUT
          </button>
        </div>

        <Section
          title="Pending submissions"
          empty="Nothing waiting on review."
          rows={pending}
          actioning={actioning}
          onApprove={(id) => act(id, "approve")}
          onReject={(id) => act(id, "reject")}
          onDelete={(id) => act(id, "delete")}
        />

        <Section
          title="Flagged, currently live"
          empty="No reports to review."
          rows={flaggedLive}
          actioning={actioning}
          onUnflag={(id) => act(id, "unflag")}
          onDelete={(id) => act(id, "delete")}
        />

        {rows.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Empty queue and not-an-admin look identical from here by design — RLS never tells the
            client which. If you expect submissions and see none, confirm your email is in the{" "}
            <code>admins</code> table.
          </p>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  empty,
  rows,
  actioning,
  onApprove,
  onReject,
  onUnflag,
  onDelete,
}: {
  title: string;
  empty: string;
  rows: Submission[];
  actioning: ActionState;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onUnflag?: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-[1.5px] text-secondary-foreground">
        {title} <span className="text-muted-foreground">({rows.length})</span>
      </h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const busy = actioning[row.id] === "pending";
            const failed = actioning[row.id] === "error";
            return (
              <li
                key={row.id}
                className="rounded-xl bg-card/60 p-5 ring-1 ring-inset ring-border/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-card-foreground">{row.name}</p>
                    <p className="mt-1 font-serif text-base italic text-secondary-foreground">
                      &ldquo;{row.epitaph}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.stack || "—"} · {row.stars}★ · {row.commits} commits
                      {row.repo_url && (
                        <>
                          {" · "}
                          <a
                            href={row.repo_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="underline underline-offset-2 hover:text-foreground"
                          >
                            repo
                          </a>
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[1px] text-muted-foreground">
                      Submitted {new Date(row.created_at).toLocaleString()}
                      {row.flagged && (
                        <span className="ml-2 rounded-full bg-white/[0.08] px-2 py-0.5 text-foreground">
                          flagged
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {onApprove && (
                      <ActionButton busy={busy} onClick={() => onApprove(row.id)} tone="primary">
                        Approve
                      </ActionButton>
                    )}
                    {onReject && (
                      <ActionButton busy={busy} onClick={() => onReject(row.id)}>
                        Reject
                      </ActionButton>
                    )}
                    {onUnflag && (
                      <ActionButton busy={busy} onClick={() => onUnflag(row.id)}>
                        Unflag
                      </ActionButton>
                    )}
                    <ActionButton busy={busy} onClick={() => onDelete(row.id)} tone="danger">
                      Delete
                    </ActionButton>
                  </div>
                </div>
                {failed && (
                  <p role="alert" className="mt-3 text-xs text-red-400/90">
                    That action failed. Try again.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone?: "default" | "primary" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={
        "rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-[1px] transition-opacity disabled:opacity-40 " +
        (tone === "primary"
          ? "bg-foreground text-background hover:opacity-85"
          : tone === "danger"
            ? "bg-white/[0.06] text-red-300/90 ring-1 ring-inset ring-red-400/20 hover:bg-white/[0.1]"
            : "bg-white/[0.06] text-secondary-foreground ring-1 ring-inset ring-white/10 hover:bg-white/[0.1]")
      }
    >
      {busy ? "…" : children}
    </button>
  );
}

export default function Admin() {
  const [session, setSession] = useState<Session | null | "loading">("loading");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured || !supabase) return <Unconfigured />;

  if (session === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </main>
    );
  }

  if (!session) return <LoginGate onSignedIn={setSession} />;

  return <Queue session={session} />;
}
