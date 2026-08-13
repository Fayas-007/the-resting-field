import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render-time throws so one broken component can't take the site down.
 *
 * React's default is all-or-nothing: an uncaught throw during render unmounts
 * the *entire* tree, leaving a blank white page with nothing but a console
 * error. A visitor gets no explanation and no way forward. This is the only
 * mechanism React offers to intercept that, and it has to be a class —
 * componentDidCatch has no hook equivalent.
 *
 * Note this covers rendering, lifecycle, and constructors only. Errors thrown
 * inside event handlers or async callbacks never reach it, because they don't
 * happen during React's render pass — those still need their own try/catch,
 * which the Supabase calls in BurialGround and Admin already have.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("render error caught by boundary", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <div className="fog absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="engrave select-none font-serif text-[5.5rem] font-normal uppercase leading-none tracking-[2px] text-white/80 sm:text-8xl sm:tracking-[5px] md:text-9xl md:tracking-[8px]">
            Collapsed
          </h1>
          <span className="engrave mt-6 block h-px w-16 bg-white/20" aria-hidden="true" />

          <p className="mt-8 text-2xl font-medium tracking-[-0.5px] md:text-3xl">
            The ground gave way <span className="font-serif font-normal italic">underfoot</span>
          </p>
          <p className="mt-4 max-w-md text-sm text-muted-foreground md:text-base">
            Something broke while this page was being dug. Reloading usually settles it.
          </p>

          {/*
            A full reload, not a router link. Whatever threw is still in the
            component tree's state — routing away would keep the same broken
            JS running and risk throwing straight back.
          */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-8 rounded-full bg-foreground px-7 py-3 text-xs font-semibold tracking-[1.5px] text-background transition-opacity hover:opacity-85"
          >
            RELOAD THE PAGE
          </button>
        </div>
      </main>
    );
  }
}
