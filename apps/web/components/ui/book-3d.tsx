'use client';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface PageData {
  title?: string;
  content?: string;
  image?: string;
  caption?: string;
  quote?: string;
  author?: string;
}

interface Book3DProps {
  src?: string;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  className?: string;
  pages?: PageData[];
}

// Inline SVG fractal noise data URI for tactile bookcloth texture
const NOISE_DATA_URL =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.35'/%3E%3C/svg%3E";

export function Book3D({
  src,
  title,
  subtitle,
  width = 230,
  height = 350,
  className,
  pages = [
    {
      title: 'Welcome to ShitUI',
      content:
        'A premium collection of beautifully crafted, animated React components. Built with Motion and Tailwind CSS for modern web applications.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1589561253898-768105ca91a8?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      caption: 'Beautiful Design',
    },
    {
      title: 'Premium Components',
      content:
        'From glass-morphic buttons to 3D cards, each component is designed with attention to detail. Self-contained, easy to install via CLI, and ready to use.',
    },
    {
      quote:
        'Great design is not just what looks good. It also needs to perform, convert, and amaze.',
      author: 'ShitUI Philosophy',
    },
    {
      title: 'Getting Started',
      content:
        'Install any component with a single command: npx shadcn@latest add @shitui/[component-name]. No configuration needed, just beautiful components ready to go.',
    },
    {
      title: 'Build Something Great',
      content:
        'Join thousands of developers creating stunning interfaces with ShitUI. Your next project deserves components that stand out.',
    },
  ],
}: Book3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [pageIndex, setPageIndex] = useState(0); // 0 means just cover open, no pages flipped
  const bookContainerRef = useRef<HTMLDivElement>(null);

  // Close book when user clicks/taps outside on mobile/touch screens
  useEffect(() => {
    if (!isHovered) return;
    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      if (bookContainerRef.current && !bookContainerRef.current.contains(e.target as Node)) {
        setIsHovered(false);
      }
    };
    document.addEventListener('touchstart', handleOutsideInteraction);
    document.addEventListener('mousedown', handleOutsideInteraction);
    return () => {
      document.removeEventListener('touchstart', handleOutsideInteraction);
      document.removeEventListener('mousedown', handleOutsideInteraction);
    };
  }, [isHovered]);

  // Reset pages when book closes
  useEffect(() => {
    if (!isHovered) {
      const timer = setTimeout(() => {
        setPageIndex(0);
      }, 300); // Small delay to allow cover to start closing
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  const [isFlipping, setIsFlipping] = useState(false);

  const handlePageClick = (index: number) => {
    if (!isHovered || isFlipping) return;
    if (pageIndex === index) {
      setIsFlipping(true);
      setPageIndex((prev) => prev + 1);
      setTimeout(() => setIsFlipping(false), 300); // Debounce
    }
  };

  const handleBackClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (isFlipping) return;
    setIsFlipping(true);
    setPageIndex(index);
    setTimeout(() => setIsFlipping(false), 300);
  };

  const handleContainerClick = () => {
    // If book is closed on touch screen or tap, open it
    if (!isHovered) {
      setIsHovered(true);
    }
  };

  return (
    <div
      ref={bookContainerRef}
      className={cn('group relative z-10 cursor-pointer', className, isHovered && 'z-50')}
      style={{
        perspective: '1500px',
        paddingLeft: '150px', // Extra space for the rotated cover on the left
        marginLeft: '-150px', // Pull back to maintain visual position
      }}
      onClick={handleContainerClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="preserve-3d relative transition-all duration-700 ease-out"
        style={{
          width,
          height,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateY: isHovered ? -35 : 0,
          rotateX: isHovered ? 15 : 0,
          z: isHovered ? 60 : 0,
        }}
      >
        {/* Back Cover - Bound with matching tactile blue cloth */}
        <div
          className="absolute inset-0 rounded-l-sm rounded-r-md shadow-2xl"
          style={{
            transform: 'translateZ(-20px)',
            boxShadow: '20px 20px 50px rgba(0,0,0,0.5)',
            backgroundColor: '#1f5ad1',
            backgroundImage: `url("${NOISE_DATA_URL}")`,
          }}
        />

        {/* PAGES STACK */}
        {Array.from({ length: pages.length })
          .map((_, i) => pages.length - 1 - i)
          .map((index) => {
            const isFlipped = index < pageIndex;

            // Dynamic z-index optimization
            let activeZIndex = 0;
            if (isFlipped) {
              activeZIndex = index + 1;
            } else {
              activeZIndex = 20 - index; // Higher base to safely sit above back cover but below front cover
            }

            return (
              <motion.div
                key={index}
                className="transform-style-3d absolute inset-y-[2px] right-[2px] left-[4px] origin-left cursor-pointer rounded-l-sm rounded-r-md border border-neutral-100/50 bg-[#fffcf5]"
                style={{
                  transformStyle: 'preserve-3d',
                  zIndex: activeZIndex,
                }}
                animate={{
                  rotateY: isFlipped ? -178 : 0,
                  z: isFlipped ? 0 : pages.length - 1 - index,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.23, 1, 0.32, 1],
                  delay: isFlipped ? 0 : index * 0.05,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFlipped) {
                    handleBackClick(e, index);
                  } else {
                    handlePageClick(index);
                  }
                }}
              >
                {/* FRONT FACE (Right side content) */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-white p-6 text-center backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-10" />
                  {/* Deeper right edge shadow for book crease */}
                  <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-linear-to-l from-black/20 via-black/5 to-transparent" />
                  {/* Left edge for binding */}
                  <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-2 bg-linear-to-r from-black/10 to-transparent" />

                  <div className="relative z-10 font-serif text-neutral-800 select-none">
                    {pages[index].image && (
                      <div className="mb-4 overflow-hidden rounded-sm border border-neutral-200 shadow-inner">
                        <img
                          src={pages[index].image}
                          alt="Page visual"
                          className="h-32 w-full object-cover grayscale transition-all hover:grayscale-0"
                        />
                      </div>
                    )}
                    {pages[index].title && (
                      <h3 className="mb-2 font-sans text-lg text-[10px] font-bold tracking-widest uppercase">
                        {pages[index].title}
                      </h3>
                    )}
                    {pages[index].content && (
                      <p className="text-[10px] leading-relaxed text-neutral-600">
                        {pages[index].content}
                      </p>
                    )}
                    {pages[index].quote && (
                      <blockquote className="border-l-2 border-neutral-300 pl-3 text-sm text-neutral-600 italic">
                        "{pages[index].quote}"
                        <footer className="mt-2 font-sans text-[9px] text-neutral-400 not-italic">
                          - {pages[index].author}
                        </footer>
                      </blockquote>
                    )}
                    <span className="absolute right-4 bottom-2 text-[8px] text-neutral-400">
                      {index + 1}
                    </span>
                  </div>
                </div>

                {/* BACK FACE (Left side content) */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-[#f8f5f0] backface-hidden"
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-10" />
                  {/* Left edge shadow (becomes visible when flipped) */}
                  <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-12 bg-linear-to-r from-black/20 via-black/5 to-transparent" />
                  <div className="rotate-90 transform font-sans text-[9px] tracking-widest text-neutral-400 uppercase opacity-30 select-none">
                    Notes
                  </div>
                </div>
              </motion.div>
            );
          })}

        {/* Front Cover */}
        <motion.div
          className={cn(
            'absolute inset-0 origin-left cursor-pointer',
            isHovered ? 'z-50' : 'z-50'
          )}
          onClick={(e) => {
            if (isHovered) {
              e.stopPropagation();
              setIsHovered(false);
            }
          }}
          style={{
            transformStyle: 'preserve-3d',
            transform: !isHovered ? 'translateZ(10px)' : undefined, // Ensure it starts in front
          }}
          initial={{
            rotateY: 0,
            z: 10,
          }}
          animate={{
            rotateY: isHovered ? -180 : 0,
            z: isHovered ? 0 : 10, // Push far forward when closed to be in front of all pages
          }}
          transition={{
            duration: 0.8,
            ease: [0.23, 1, 0.32, 1],
            delay: isHovered ? 0 : 0.5, // Delay closing so pages flip back first
          }}
        >
          {/* Outer Cover */}
          <div
            className={cn(
              'absolute inset-0 overflow-hidden rounded-l-sm rounded-r-md border-l border-white/20 shadow-md backface-hidden',
              src ? 'bg-neutral-900' : 'bg-[#3f80ff]'
            )}
            style={{
              backgroundImage: src
                ? `url(${src})`
                : 'linear-gradient(135deg, #4d8aff 0%, #3f80ff 50%, #2b6fe8 100%)',
              backgroundSize: src ? 'cover' : undefined,
              backgroundPosition: src ? 'center' : undefined,
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Conditional overlays based on mode */}
            {src ? (
              <>
                {/* Image mode overlays */}
                <div className="absolute inset-0 bg-linear-to-r from-black/30 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/40" />
              </>
            ) : (
              <>
                {/* 1. Tactical Noise Overlay for authentic paper/cloth grain */}
                <div
                  className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
                  style={{
                    backgroundImage: `url("${NOISE_DATA_URL}")`,
                    backgroundRepeat: 'repeat',
                  }}
                />

                {/* 2. Rough / Ruff linen cloth cross-weave texture */}
                <div
                  className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 2.5px),
                      repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 2.5px)
                    `,
                    backgroundSize: '2.5px 2.5px',
                  }}
                />

                {/* 3. Surface Light / Radial Sheen */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-25"
                  style={{
                    background:
                      'radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.6) 0%, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.2) 100%)',
                  }}
                />

                {/* 4. Book Spine Hinge / Fold shadow on left */}
                <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-7 bg-linear-to-r from-black/40 via-white/10 to-transparent z-20" />
                <div className="pointer-events-none absolute top-0 bottom-0 left-3 w-px bg-black/25 z-20" />

                {/* 5. Right edge opening shadow */}
                <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-3 bg-linear-to-l from-black/20 to-transparent z-20" />
              </>
            )}

            {/* Content - Custom or Clean Default */}
            {src || title || subtitle ? (
              // Custom cover with user's image/title/subtitle
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-white select-none">
                {title && (
                  <div className="mb-4 text-center">
                    <div className="mx-auto mb-5 h-px w-14 bg-white/50" />
                    <h3 className="mb-2 font-serif text-3xl font-bold tracking-tight drop-shadow-md">
                      {title}
                    </h3>
                    <div className="mx-auto mt-4 h-px w-14 bg-white/50" />
                  </div>
                )}
                {subtitle && (
                  <p className="mt-2 text-[11px] font-sans font-medium tracking-[0.2em] uppercase opacity-90">
                    {subtitle}
                  </p>
                )}
              </div>
            ) : (
              // Clean ShitUI Cover with refined typography and noise/ruff finish
              <div className="absolute inset-0 z-10 flex flex-col justify-between p-7 text-white select-none">
                {/* Top header badge */}
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <span className="font-mono text-[9px] font-semibold tracking-[0.25em] text-white/90 uppercase">
                    SHITUI
                  </span>
                  <span className="font-mono text-[8px] tracking-[0.2em] text-white/70 uppercase">
                    VOL. 01
                  </span>
                </div>

                {/* Main center branding */}
                <div className="my-auto flex flex-col items-center justify-center py-4 text-center">
                  <h1 className="font-serif text-[42px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] leading-none">
                    ShitUI
                  </h1>
                  <div className="mt-3.5 h-0.5 w-8 rounded-full bg-white/70" />
                  <p className="mt-3.5 text-[10px] font-sans font-medium tracking-[0.22em] text-white/90 uppercase">
                    Component Library
                  </p>
                </div>

                {/* Bottom details */}
                <div className="flex items-center justify-between border-t border-white/20 pt-3 font-mono text-[8.5px] tracking-widest text-white/75 uppercase">
                  <span>REACT / MOTION</span>
                  <span>2026</span>
                </div>
              </div>
            )}
          </div>

          {/* Inner Cover */}
          <div
            className="absolute inset-0 overflow-hidden rounded-l-md rounded-r-sm border-r border-neutral-200 bg-[#f5f1e8] backface-hidden"
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="flex h-full w-full flex-col justify-end p-8">
              <p className="text-center font-serif text-xs text-neutral-500 italic select-none">
                ShitUI
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Shadow */}
      <div
        className={cn(
          'absolute right-4 bottom-0 left-4 h-10 rounded-[100%] bg-black/40 blur-xl transition-all duration-500',
          isHovered ? 'scale-110 opacity-80' : 'opacity-40'
        )}
        style={{
          transform: 'perspective(1000px) rotateX(60deg) translateZ(-60px)',
        }}
      />
    </div>
  );
}
export default Book3D;
