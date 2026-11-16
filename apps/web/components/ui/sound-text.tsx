'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { cn } from '@/lib/utils';

interface SoundTextProps {
  text: string;
  className?: string;
  basePitch?: number; // Base frequency in Hz
}

// Simple Pentatonic Scale frequencies (approximate) relative to a base
// We will just multiply the base freq by these ratios
const SCALE_RATIOS = [
  1, // Root
  1.125, // Major 2nd
  1.25, // Major 3rd
  1.5, // Perfect 5th
  1.667, // Major 6th
  2, // Octave
];

export default function SoundText({
  text = 'Hover over me',
  className,
  basePitch = 300,
}: SoundTextProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext lazily on user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playSound = useCallback(
    (index: number) => {
      initAudio(); // Ensure context is ready
      if (!audioContextRef.current) return;

      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Calculate pitch based on index to create a melody effect
      // Cycle through the scale
      const scaleIndex = index % SCALE_RATIOS.length;
      const octaveOffset = Math.floor(index / SCALE_RATIOS.length);
      const frequency = basePitch * SCALE_RATIOS[scaleIndex] * Math.pow(2, octaveOffset * 0.5); // Slight octave overlapping for smoother sound

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Envelope: Fast attack, smooth decay
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02); // Attack
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); // Decay

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    },
    [basePitch, initAudio]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {
          // Ignore already closed errors or others
        });
      }
    };
  }, []);

  const letters = text.split('');
  const lastTouchedIndex = useRef<number | null>(null);

  const handleTouch = (clientX: number, clientY: number) => {
    initAudio();
    const elem = document.elementFromPoint(clientX, clientY);
    if (!elem) return;
    const letterSpan = elem.closest('[data-sound-index]');
    if (letterSpan) {
      const idxStr = letterSpan.getAttribute('data-sound-index');
      if (idxStr !== null) {
        const idx = parseInt(idxStr, 10);
        if (lastTouchedIndex.current !== idx) {
          lastTouchedIndex.current = idx;
          playSound(idx);
          letterSpan.dispatchEvent(new CustomEvent('trigger-sound-anim'));
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    initAudio();
    if (e.touches.length > 0) {
      handleTouch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleTouch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    lastTouchedIndex.current = null;
  };

  const containerVariants = {
    hover: {
      transition: { staggerChildren: 0.05 },
    },
  };

  return (
    <motion.div
      className={cn('flex cursor-default flex-wrap select-none touch-none', className)}
      variants={containerVariants}
      initial="initial"
      whileHover="hover"
      onMouseEnter={initAudio}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {letters.map((letter, index) => {
        // If it's a space, render it but no sound triggers usually (or keep it for rhythm)
        if (letter === ' ') {
          return (
            <span key={index} className="w-2">
              {' '}
            </span>
          );
        }

        return <Letter key={index} char={letter} index={index} onHover={() => playSound(index)} />;
      })}
    </motion.div>
  );
}

// Individual Letter Component for cleaner animation isolation
const Letter = ({ char, index, onHover }: { char: string; index: number; onHover: () => void }) => {
  const controls = useAnimationControls();
  const elementRef = useRef<HTMLSpanElement>(null);

  // Random subtle rotation for "organic" feel
  const randomRotate = Math.random() * 10 - 5;

  const triggerAnimation = useCallback(() => {
    controls.start({
      y: -10,
      scale: 1.3,
      rotate: randomRotate,
      color: '#fc4c01', // Copper highlight
      textShadow: '0px 0px 8px rgba(252, 76, 1, 0.55)',
      transition: { type: 'spring', stiffness: 500, damping: 10 },
    });
    setTimeout(() => {
      controls.start({
        y: 0,
        scale: 1,
        rotate: 0,
        color: 'currentColor',
        textShadow: 'none',
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      });
    }, 350);
  }, [controls, randomRotate]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    const onTrigger = () => triggerAnimation();
    el.addEventListener('trigger-sound-anim', onTrigger);
    return () => el.removeEventListener('trigger-sound-anim', onTrigger);
  }, [triggerAnimation]);

  return (
    <motion.span
      ref={elementRef}
      data-sound-index={index}
      className="relative inline-block"
      onMouseEnter={() => {
        onHover();
        triggerAnimation();
      }}
      onMouseLeave={() => {
        controls.start({
          y: 0,
          scale: 1,
          rotate: 0,
          color: 'currentColor',
          textShadow: 'none',
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        });
      }}
      animate={controls}
      // Add initial subtle fade-in for page load
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.02, type: 'spring', stiffness: 200 }}
    >
      {char}
    </motion.span>
  );
};
