"use client";

import { motion } from "framer-motion";

/**
 * Route transition wrapper. App Router re-mounts template.tsx on every
 * navigation, so this gives each page a calm fade/slide entrance.
 * (Respects prefers-reduced-motion via the global CSS override.)
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
