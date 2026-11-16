"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

type Placement = "top" | "bottom" | "left" | "right";

interface LiquidTooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  popupClassName?: string;
  placement?: Placement;
}

export const LiquidTooltip = ({
  text,
  children,
  className,
  popupClassName,
  placement = "top",
}: LiquidTooltipProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [effectivePlacement, setEffectivePlacement] = useState<Placement>(placement);
  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({ left: 0, top: 0, width: 0, height: 0 });

  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setEffectivePlacement(placement);
  }, [placement]);

  // Spring physics for the "liquid" feel
  const springConfig = { stiffness: 100, damping: 15, mass: 0.1 };

  // Mouse position tracking for subtle parallax
  const value = useMotionValue(0);

  // Rotate based on movement value
  const rotate = useSpring(
    useTransform(value, [-100, 100], [-45, 45]),
    springConfig
  );

  // Springy movement value
  const springValue = useSpring(value, springConfig);

  // Update position & auto-flip based on viewport boundaries
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();

    setCoords({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });

    // Space available around the trigger relative to viewport
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;

    const HORIZONTAL_THRESHOLD = 150;
    const VERTICAL_THRESHOLD = 60;

    let nextPlacement = placement;

    if (placement === 'left') {
      if (spaceLeft < HORIZONTAL_THRESHOLD && spaceRight > spaceLeft) {
        nextPlacement = 'right';
      }
    } else if (placement === 'right') {
      if (spaceRight < HORIZONTAL_THRESHOLD && spaceLeft > spaceRight) {
        nextPlacement = 'left';
      }
    } else if (placement === 'top') {
      if (spaceTop < VERTICAL_THRESHOLD && spaceBottom > spaceTop) {
        nextPlacement = 'bottom';
      }
    } else if (placement === 'bottom') {
      if (spaceBottom < VERTICAL_THRESHOLD && spaceTop > spaceBottom) {
        nextPlacement = 'top';
      }
    }

    setEffectivePlacement(nextPlacement);
  }, [placement]);

  // Track scroll and resize across the document so fixed portal tooltip stays perfectly pinned
  useEffect(() => {
    if (!isHovered) return;
    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isHovered, updatePosition]);

  const handleMouseEnter = () => {
    updatePosition();
    setIsHovered(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLSpanElement>) => {
    const isVertical = effectivePlacement === "top" || effectivePlacement === "bottom";
    if (isVertical) {
      const halfWidth = event.currentTarget.offsetWidth / 2;
      value.set(event.nativeEvent.offsetX - halfWidth);
    } else {
      const halfHeight = event.currentTarget.offsetHeight / 2;
      value.set(event.nativeEvent.offsetY - halfHeight);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    value.set(0);
  };

  // Determine fixed anchor coordinates and CSS translation for the portal wrapper
  const getAnchorStyle = (): React.CSSProperties => {
    let top = 0;
    let left = 0;
    let transform = '';

    switch (effectivePlacement) {
      case 'top':
        left = coords.left + coords.width / 2;
        top = coords.top - 8;
        transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        left = coords.left + coords.width / 2;
        top = coords.top + coords.height + 8;
        transform = 'translate(-50%, 0)';
        break;
      case 'left':
        left = coords.left - 8;
        top = coords.top + coords.height / 2;
        transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        left = coords.left + coords.width + 8;
        top = coords.top + coords.height / 2;
        transform = 'translate(0, -50%)';
        break;
      default:
        left = coords.left + coords.width / 2;
        top = coords.top - 8;
        transform = 'translate(-50%, -100%)';
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      transform,
      zIndex: 99999,
      pointerEvents: 'none',
    };
  };

  const getArrowClasses = () => {
    switch (effectivePlacement) {
      case 'top':
        return '-bottom-0.5 left-1/2 -translate-x-1/2';
      case 'bottom':
        return '-top-0.5 left-1/2 -translate-x-1/2';
      case 'left':
        return '-right-0.5 top-1/2 -translate-y-1/2';
      case 'right':
        return '-left-0.5 top-1/2 -translate-y-1/2';
      default:
        return '-bottom-0.5 left-1/2 -translate-x-1/2';
    }
  };

  const getAnimation = () => {
    const distance = 8;
    switch (effectivePlacement) {
      case 'top':
        return {
          initial: { opacity: 0, scale: 0.6, y: distance },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.6, y: distance },
        };
      case 'bottom':
        return {
          initial: { opacity: 0, scale: 0.6, y: -distance },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.6, y: -distance },
        };
      case 'left':
        return {
          initial: { opacity: 0, scale: 0.6, x: distance },
          animate: { opacity: 1, scale: 1, x: 0 },
          exit: { opacity: 0, scale: 0.6, x: distance },
        };
      case 'right':
        return {
          initial: { opacity: 0, scale: 0.6, x: -distance },
          animate: { opacity: 1, scale: 1, x: 0 },
          exit: { opacity: 0, scale: 0.6, x: -distance },
        };
      default:
        return {
          initial: { opacity: 0, scale: 0.6, y: distance },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.6, y: distance },
        };
    }
  };

  const animationProps = getAnimation();
  const isVertical = effectivePlacement === 'top' || effectivePlacement === 'bottom';

  const motionStyle = isVertical
    ? ({ x: springValue, rotate: rotate } as any)
    : ({ y: springValue, rotate: rotate } as any);

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('relative inline-flex', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {children}
      </span>

      {mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isHovered && (
              <div style={getAnchorStyle()}>
                <motion.div
                  initial={animationProps.initial}
                  animate={{
                    ...animationProps.animate,
                    transition: {
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                    },
                  }}
                  exit={animationProps.exit}
                  style={motionStyle}
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-100 dark:text-neutral-900 shadow-xl select-none whitespace-nowrap',
                    popupClassName
                  )}
                >
                  <span className="relative z-10 font-mono tracking-tight">
                    {text}
                  </span>

                  <div
                    className={cn(
                      'absolute h-2 w-2 rotate-45 transform bg-neutral-900 dark:bg-neutral-100',
                      getArrowClasses()
                    )}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default LiquidTooltip;
