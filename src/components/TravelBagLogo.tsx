import React from "react";
import { motion } from "motion/react";

interface TravelBagLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

export default function TravelBagLogo({
  size = "md",
  className = "",
  showText = true,
}: TravelBagLogoProps) {
  // Dimensions based on size preset
  const dimension = {
    sm: { svg: "h-9 w-9", font: "text-lg", sub: "text-[9px]" },
    md: { svg: "h-12 w-12", font: "text-xl", sub: "text-[10px]" },
    lg: { svg: "h-20 w-20", font: "text-3xl", sub: "text-xs" },
    xl: { svg: "h-32 w-32", font: "text-5xl", sub: "text-sm" },
  }[size];

  // Animated airplane flying along a curve path
  return (
    <div className={`flex items-center space-x-2 select-none ${className}`} id="travelbag-brand-logo">
      {/* Visual Logo SVG */}
      <div className={`relative ${dimension.svg}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="flight-trail-mask">
              <path
                d="M 15,48 C 10,62 38,62 58,42 C 68,32 74,22 78,16"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray="90"
                strokeDashoffset="90"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="90;0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </path>
            </mask>
          </defs>

          {/* Defined path for airplane flying animation */}
          <path
            id="flight-path"
            d="M 15,48 C 10,62 38,62 58,42 C 68,32 74,22 78,16"
            fill="none"
            stroke="transparent"
          />

          {/* Suitcase Handle */}
          <rect
            x="42"
            y="14"
            width="16"
            height="12"
            rx="3"
            stroke="#1E293B"
            strokeWidth="4"
            fill="none"
          />

          {/* Suitcase Body */}
          <rect
            x="34"
            y="24"
            width="32"
            height="44"
            rx="7"
            fill="#0F172A"
          />

          {/* Suitcase Vertical Stripes */}
          <line
            x1="43"
            y1="32"
            x2="43"
            y2="60"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="57"
            y1="32"
            x2="57"
            y2="60"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Suitcase Wheels */}
          <circle cx="41" cy="70" r="3.5" fill="#0F172A" />
          <circle cx="41" cy="70" r="1.5" fill="#64748B" />
          <circle cx="59" cy="70" r="3.5" fill="#0F172A" />
          <circle cx="59" cy="70" r="1.5" fill="#64748B" />

          {/* Elegant dashed flight trail */}
          <path
            d="M 15,48 C 10,62 38,62 58,42 C 68,32 74,22 78,16"
            stroke="#FF6B00"
            strokeWidth="3"
            strokeDasharray="5,4"
            strokeLinecap="round"
            opacity="0.85"
            mask="url(#flight-trail-mask)"
          />

          {/* Animated Airplane */}
          <g>
            <path
              d="M-6,-4 L6,0 L-6,4 L-4,0 Z"
              fill="#FF6B00"
            />
            {/* Native CSS / SVG animateMotion for perfect real plane flying animation */}
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              rotate="auto"
              path="M 15,48 C 10,62 38,62 58,42 C 68,32 74,22 78,16"
            />
          </g>
        </svg>
      </div>

      {/* Brand Name Text with exact coloring */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className={`${dimension.font} font-sans font-black tracking-tight leading-none text-slate-900 flex items-baseline`}>
            <span>travel</span>
            <span className="text-[#FF6B00]">bag</span>
          </div>
          <p className={`${dimension.sub} text-slate-400 font-mono tracking-wider uppercase font-bold`}>
            Companion Hub
          </p>
        </div>
      )}
    </div>
  );
}
