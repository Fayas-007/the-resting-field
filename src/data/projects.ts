export type Ground = "main" | "old";

export interface Project {
  id: string;
  name: string;
  /** Date the first commit landed. */
  opened: string;
  /** Date the last one did. */
  closed: string;
  epitaph: string;
  stack: string;
  stars: number;
  commits: number;
  /** null means "No Repo Left". */
  repo: string | null;
  ground: Ground;
  /**
   * "live" = backed by a real `submissions` row (has a flag button, a real
   * UUID id). Missing/"seed" = one of the hand-authored entries below, which
   * were never submitted or moderated and can't be flagged or looked up in
   * the database.
   */
  source?: "seed" | "live";
}

export const mainCluster: Project[] = [
  {
    id: "todoflow",
    name: "TodoFlow",
    opened: "2023 · Jan",
    closed: "2023 · Feb",
    epitaph: "It was going to have dark mode.",
    stack: "React · Firebase",
    stars: 12,
    commits: 34,
    repo: null,
    ground: "main",
  },
  {
    id: "chatwrapper-47",
    name: "ChatWrapper #47",
    opened: "2024 · Jun",
    closed: "2024 · Jun",
    epitaph: "Never got past the landing page.",
    stack: "Next.js · OpenAI API",
    stars: 3,
    commits: 8,
    repo: null,
    ground: "main",
  },
  {
    id: "recipe-app-final-v2",
    name: "Recipe App (FINAL_v2)",
    opened: "2024 · Jan",
    closed: "2024 · Feb",
    epitaph: "The auth flow broke, and so did I.",
    stack: "Express · PostgreSQL",
    stars: 45,
    commits: 61,
    repo: null,
    ground: "main",
  },
  {
    id: "uber-for-dog-walkers",
    name: "Uber for Dog Walkers",
    opened: "2023 · Sep",
    closed: "2023 · Sep",
    epitaph: "Turns out Rover already existed.",
    stack: "React Native",
    stars: 67,
    commits: 22,
    repo: null,
    ground: "main",
  },
  {
    id: "discord-bot-everything",
    name: "Discord Bot That Does Everything",
    opened: "2022 · Nov",
    closed: "2023 · Jan",
    epitaph: "Banned from its own server.",
    stack: "Node.js · Discord.js",
    stars: 29,
    commits: 44,
    repo: null,
    ground: "main",
  },
];

export const oldGround: Project[] = [
  {
    id: "blockchain-todo",
    name: "Blockchain To-Do List",
    opened: "2018",
    closed: "2018",
    epitaph: "Solved a problem nobody had.",
    stack: "Solidity · Ambition",
    stars: 210,
    commits: 15,
    repo: null,
    ground: "old",
  },
  {
    id: "my-own-framework",
    name: "My Own Framework",
    opened: "2017",
    closed: "2017",
    epitaph: "It only ever had one component.",
    stack: "Pure JS · Hubris",
    stars: 340,
    commits: 5,
    repo: null,
    ground: "old",
  },
  {
    id: "portfoliosite-redesign-v9",
    name: "PortfolioSite_REDESIGN_v9",
    opened: "2019",
    closed: "2021",
    epitaph: "Perfect was the enemy of shipped.",
    stack: "Tailwind · Regret",
    stars: 1,
    commits: 89,
    repo: null,
    ground: "old",
  },
];

export const theFirstOne: Project = {
  id: "the-first-one",
  name: "The First One",
  opened: "first commit, ever",
  closed: "the day scope creep won",
  epitaph: "Everything after this one was practice.",
  stack: "—",
  stars: 0,
  commits: 0,
  repo: null,
  ground: "main",
};
