import { AUTHOR_MARK } from "@/lib/app-brand";

/** Subtle site-wide author mark — GV with anchor · dove · leaf motif. */
export function BrandWatermark({ variant = "site" }: { variant?: "site" | "guide" }) {
  const isGuide = variant === "guide";

  return (
    <div
      className={`pointer-events-none select-none ${
        isGuide
          ? "fixed bottom-6 right-6 z-30 hidden sm:block"
          : "fixed bottom-4 right-4 z-20 opacity-[0.38] hover:opacity-55 transition-opacity"
      }`}
      aria-hidden
    >
      <div
        className={`flex items-center gap-2.5 rounded-2xl border backdrop-blur-sm ${
          isGuide
            ? "border-teal-900/15 bg-white/80 px-3.5 py-2.5 shadow-lg shadow-teal-950/5"
            : "border-teal-900/10 bg-[#f4f7f4]/70 px-2.5 py-1.5"
        }`}
      >
        <svg
          viewBox="0 0 88 32"
          className={isGuide ? "h-8 w-[5.5rem]" : "h-6 w-[4.5rem]"}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Leaf — Veridian / life */}
          <path
            d="M6 22c4-8 10-12 14-14-2 6-1 12 4 16-3-1-5-1-8-2 1-3 2-5 4-6-4 2-8 4-10 6z"
            fill="currentColor"
            className="text-emerald-600/80"
          />
          {/* Dove — care / peace */}
          <path
            d="M28 14c2-1 4 0 5 2 1-2 3-3 5-2-1 2-1 4 0 6 1 2 3 3 5 2-3 1-6 0-8-2-2 1-4 1-7-1 2-3 3-5 2z"
            fill="currentColor"
            className="text-teal-700/75"
          />
          {/* Anchor — stability / enterprise */}
          <path
            d="M48 10v4h-2c0 3 2 5 5 5v2c-3 0-5 1-7 3l1 1c2-2 4-3 6-3v8h2v-8c2 0 4 1 6 3l1-1c-2-2-4-3-7-3v-2c3 0 5-2 5-5h-2v-4h-2z"
            fill="currentColor"
            className="text-teal-900/70"
          />
          {/* GV monogram */}
          <text
            x="62"
            y="21"
            fill="#134e4a"
            fontFamily="Georgia, serif"
            fontSize="13"
            fontWeight="600"
          >
            {AUTHOR_MARK}
          </text>
        </svg>
        {isGuide && (
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-800/70">
            Secured
          </span>
        )}
      </div>
    </div>
  );
}
