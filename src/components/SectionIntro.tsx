import { motion } from "framer-motion";
import { fadeUp } from "../lib/animations";

interface SectionIntroProps {
  eyebrow: string;
  heading: React.ReactNode;
  subtext: string;
}

export default function SectionIntro({ eyebrow, heading, subtext }: SectionIntroProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <motion.p
        {...fadeUp(0)}
        className="text-xs uppercase tracking-[3px] text-muted-foreground"
      >
        {eyebrow}
      </motion.p>

      <motion.h2
        {...fadeUp(0.1)}
        className="mt-6 text-4xl font-medium tracking-[-1.5px] md:text-6xl"
      >
        {heading}
      </motion.h2>

      <motion.p
        {...fadeUp(0.2)}
        className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
      >
        {subtext}
      </motion.p>
    </div>
  );
}
