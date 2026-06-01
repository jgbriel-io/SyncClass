/**
 * Lista Animada com Framer Motion
 *
 * Fade-in suave ao renderizar listas
 * Usa domMax para otimizar bundle size
 */

import { motion, domMax, LazyMotion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
}

/**
 * Container para lista animada
 */
export function AnimatedList({
  children,
  className,
  delay = 0,
  staggerChildren = 0.05,
}: AnimatedListProps) {
  return (
    <LazyMotion features={domMax} strict>
      <motion.div
        className={className}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              delay,
              staggerChildren,
            },
          },
        }}
      >
        {children}
      </motion.div>
    </LazyMotion>
  );
}

/**
 * Item individual da lista animada
 */
export function AnimatedListItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
            ease: "easeOut",
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Tbody animado para tabelas
 */
export function AnimatedTableBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <LazyMotion features={domMax} strict>
      <motion.tbody
        className={className}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.03,
            },
          },
        }}
      >
        {children}
      </motion.tbody>
    </LazyMotion>
  );
}

/**
 * Tr animado para linhas de tabela
 */
export function AnimatedTableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.tr
      className={className}
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.2,
            ease: "easeOut",
          },
        },
      }}
    >
      {children}
    </motion.tr>
  );
}
