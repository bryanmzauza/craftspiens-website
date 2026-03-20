"use client";

import { motion } from "framer-motion";

interface SectionTitleProps {
  children: string;
  className?: string;
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`font-[family-name:var(--font-press-start)] text-2xl text-white sm:text-3xl ${className}`}
    >
      {children}
    </motion.h2>
  );
}
