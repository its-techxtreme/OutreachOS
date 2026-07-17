'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Light ink doodles for page backgrounds — loose linework in the outer margins only.
 * Kept clear of the centered copy column so text stays readable.
 * Full mascot art lives in `/mascots` + `MascotCallout` for tips/tutorials.
 */
export function DoodleDecor() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      {/* Far outer margins only — hidden on small screens where they collide with copy */}
      <motion.div
        className="absolute left-[-12px] top-[72px] hidden opacity-40 md:block lg:left-[8px] lg:top-[88px] lg:opacity-50 xl:left-[24px]"
        animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [-2, 1.5, -2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AdventurerDoodle />
      </motion.div>

      <motion.div
        className="absolute right-[-12px] top-[64px] hidden opacity-40 md:block lg:right-[8px] lg:top-[80px] lg:opacity-50 xl:right-[24px]"
        animate={reduceMotion ? undefined : { y: [0, 6, 0], rotate: [2, -2, 2] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FighterDoodle />
      </motion.div>

      <motion.div
        className="absolute bottom-[18%] left-[-8px] hidden opacity-35 lg:block lg:left-[12px] lg:opacity-45 xl:left-[28px]"
        animate={reduceMotion ? undefined : { rotate: [-2, 1.5, -2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AceAthleteDoodle />
      </motion.div>

      <motion.div
        className="absolute bottom-[16%] right-[-8px] hidden opacity-35 lg:block lg:right-[12px] lg:opacity-45 xl:right-[28px]"
        animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CityGirlDoodle />
      </motion.div>

      {/* Tiny margin marks only — never over the content column */}
      <svg
        className="absolute bottom-[8%] left-[2%] hidden h-10 w-16 text-ink/15 xl:block"
        viewBox="0 0 120 60"
        fill="none"
      >
        <path
          d="M8 32 C28 8, 55 52, 110 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M92 12 L110 18 L96 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="absolute bottom-[10%] right-[3%] hidden -rotate-6 font-display text-sm font-bold text-marker/40 xl:block">
        let’s go!
      </div>
    </div>
  );
}

const ink = 'currentColor';

/** Loose scarf-adventurer doodle (margin scribble). */
function AdventurerDoodle() {
  return (
    <svg
      width="96"
      height="122"
      viewBox="0 0 110 140"
      fill="none"
      className="text-ink/65"
    >
      <path
        d="M28 48 C18 40 22 22 36 26 C40 14 58 12 64 26 C74 14 90 22 88 38"
        stroke={ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36 32 L32 48 M48 28 L46 46 M62 28 L64 46 M78 34 L74 48"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse
        cx="58"
        cy="58"
        rx="22"
        ry="24"
        fill="#FFFDF7"
        fillOpacity="0.45"
        stroke={ink}
        strokeWidth="2.1"
      />
      <path
        d="M46 54 Q50 58 46 62"
        stroke={ink}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M66 54 Q70 58 66 62"
        stroke={ink}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M48 70 Q58 78 68 70"
        stroke={ink}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M52 72 L52 76 M58 74 L58 78 M64 72 L64 76"
        stroke={ink}
        strokeWidth="1.2"
      />
      <path
        d="M40 80 C48 92 72 90 78 80 L82 98 C68 92 52 94 38 104"
        stroke="#0EA5E9"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M42 88 L36 128 L80 128 L74 88"
        stroke={ink}
        strokeWidth="2.1"
        fill="none"
      />
      <path d="M58 88 L58 128" stroke={ink} strokeWidth="1.6" />
      <path
        d="M42 98 L18 90"
        stroke={ink}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="14" cy="88" r="5" stroke={ink} strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Loose fighter doodle. */
function FighterDoodle() {
  return (
    <svg
      width="94"
      height="122"
      viewBox="0 0 108 140"
      fill="none"
      className="text-ink/65"
    >
      <path
        d="M30 58 L18 28 L34 42 L40 16 L52 40 L60 12 L70 40 L86 18 L82 48 L98 32 L88 58"
        stroke={ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse
        cx="56"
        cy="68"
        rx="22"
        ry="24"
        fill="#FFFDF7"
        fillOpacity="0.4"
        stroke={ink}
        strokeWidth="2.1"
      />
      <path
        d="M42 64 L52 70 L42 74"
        stroke={ink}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M70 64 L60 70 L70 74"
        stroke={ink}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M46 82 L66 82" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M38 90 L32 130 L80 130 L74 90"
        stroke={ink}
        strokeWidth="2.1"
        fill="none"
      />
      <path d="M56 90 L56 130" stroke={ink} strokeWidth="1.5" />
      <path
        d="M38 100 L56 90 L74 100"
        stroke={ink}
        strokeWidth="1.6"
        fill="none"
      />
      <path d="M36 112 H72" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M38 102 L20 114"
        stroke={ink}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M74 102 L92 110"
        stroke={ink}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M86 72 Q96 64 98 78"
        stroke="#0EA5E9"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M22 78 Q12 68 10 84"
        stroke="#0EA5E9"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Loose athlete doodle. */
function AceAthleteDoodle() {
  return (
    <svg
      width="90"
      height="122"
      viewBox="0 0 105 142"
      fill="none"
      className="text-ink/65"
    >
      <path
        d="M32 48 C30 30 74 28 72 48"
        stroke={ink}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M38 40 L36 54 M48 36 L48 54 M60 36 L60 54 M70 42 L68 54"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse
        cx="52"
        cy="58"
        rx="20"
        ry="22"
        fill="#FFFDF7"
        fillOpacity="0.4"
        stroke={ink}
        strokeWidth="2.1"
      />
      <circle cx="44" cy="56" r="2.5" fill="currentColor" />
      <circle cx="60" cy="56" r="2.5" fill="currentColor" />
      <path
        d="M46 68 Q52 72 58 68"
        stroke={ink}
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M36 78 L30 124 L74 124 L68 78"
        stroke="#EA580C"
        strokeWidth="2.2"
        fill="none"
      />
      <text
        x="44"
        y="108"
        fill="currentColor"
        fontSize="18"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        opacity="0.7"
      >
        7
      </text>
      <path
        d="M68 88 L90 58"
        stroke={ink}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="94" cy="50" r="9" stroke={ink} strokeWidth="1.9" fill="none" />
      <path
        d="M88 50 Q94 46 100 50 M94 42 L94 58"
        stroke={ink}
        strokeWidth="1.3"
      />
      <path
        d="M36 92 L22 102"
        stroke={ink}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Loose city-girl doodle. */
function CityGirlDoodle() {
  return (
    <svg
      width="90"
      height="120"
      viewBox="0 0 105 140"
      fill="none"
      className="text-ink/65"
    >
      <path
        d="M64 30 C78 24 88 40 82 54 C76 46 70 40 64 38"
        stroke={ink}
        strokeWidth="2.1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M78 52 Q82 66 80 76"
        stroke={ink}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 52 C28 34 74 32 72 52"
        stroke={ink}
        strokeWidth="2.1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M36 44 L34 58 M46 40 L46 58 M58 40 L58 58 M68 46 L66 58"
        stroke={ink}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <ellipse
        cx="52"
        cy="58"
        rx="19"
        ry="21"
        fill="#FFFDF7"
        fillOpacity="0.4"
        stroke={ink}
        strokeWidth="2.1"
      />
      <ellipse
        cx="44"
        cy="56"
        rx="3.5"
        ry="4.5"
        stroke={ink}
        strokeWidth="1.6"
        fill="none"
      />
      <ellipse
        cx="60"
        cy="56"
        rx="3.5"
        ry="4.5"
        stroke={ink}
        strokeWidth="1.6"
        fill="none"
      />
      <circle cx="45" cy="55" r="1.2" fill="currentColor" />
      <circle cx="61" cy="55" r="1.2" fill="currentColor" />
      <path
        d="M46 68 Q52 72 58 68"
        stroke="#F97316"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M36 78 L30 124 L74 124 L68 78"
        stroke="#38BDF8"
        strokeWidth="2.2"
        fill="none"
      />
      <path d="M52 78 L52 124" stroke={ink} strokeWidth="1.4" opacity="0.5" />
      <path
        d="M46 78 L52 90 L58 78"
        stroke={ink}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M36 94 L22 102"
        stroke={ink}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <rect
        x="72"
        y="96"
        width="18"
        height="14"
        rx="1"
        stroke="#CA8A04"
        strokeWidth="1.8"
        fill="none"
        transform="rotate(12 81 103)"
      />
    </svg>
  );
}
