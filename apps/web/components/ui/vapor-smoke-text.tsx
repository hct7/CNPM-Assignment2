'use client';
import React from 'react';
import { motion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

interface VaporSmokeTextProps {
  text: string;
  className?: string;
  trigger?: boolean;
}

export const VaporSmokeText: React.FC<VaporSmokeTextProps> = ({
  text,
  className,
  trigger = true,
}) => {
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        opacity: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
        y: { type: 'spring', damping: 20, stiffness: 60, mass: 0.8 },
        scale: { type: 'spring', damping: 20, stiffness: 60, mass: 0.8 },
        rotate: { type: 'spring', damping: 20, stiffness: 60, mass: 0.8 },
      },
    },
    hidden: {
      opacity: 0,
      filter: 'blur(20px)',
      y: 20,
      scale: 1.5,
      rotate: 5,
    },
  };

  return (
    <motion.div
      className={cn('flex flex-wrap items-center justify-center overflow-visible py-3', className)}
      variants={container}
      initial="hidden"
      animate={trigger ? 'visible' : 'hidden'}
    >
      {text.split(' ').map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex whitespace-nowrap mr-[0.28em] last:mr-0">
          {word.split('').map((letter, letterIndex) => (
            <motion.span
              key={letterIndex}
              variants={child}
              className="inline-block origin-bottom font-serif italic will-change-[transform,filter,opacity]"
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.div>
  );
};
