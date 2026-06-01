/**
 * Sheet Animado com Framer Motion
 *
 * Transição de Slide ao abrir BaseDetailSheet
 * Otimizado com domMax
 */

import { motion, domMax, LazyMotion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSheetContentProps {
  children: ReactNode;
  isOpen: boolean;
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

const slideVariants = {
  left: {
    hidden: { x: "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  right: {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  top: {
    hidden: { y: "-100%", opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  bottom: {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
};

/**
 * Conteúdo animado do Sheet
 */
export function AnimatedSheetContent({
  children,
  isOpen,
  side = "right",
  className,
}: AnimatedSheetContentProps) {
  return (
    <LazyMotion features={domMax} strict>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className={className}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideVariants[side]}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}

/**
 * Overlay animado do Sheet
 */
export function AnimatedSheetOverlay({
  isOpen,
  className,
}: {
  isOpen: boolean;
  className?: string;
}) {
  return (
    <LazyMotion features={domMax} strict>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}

/**
 * Fade-in para conteúdo interno do Sheet
 */
export function AnimatedSheetSection({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
