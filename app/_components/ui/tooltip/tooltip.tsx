"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const tooltipVariants: Record<string, string> = {
  default: "text-clay-900 bg-brand-500",
  secondary: "bg-clay-600 text-clay-50",
};

interface TooltipProps {
  variant?: keyof typeof tooltipVariants;
  content: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function Tooltip({
  variant = "default",
  content,
  icon,
  children,
  className = "",
  id,
}: TooltipProps) {
  const variantClasses = tooltipVariants[variant];
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    setIsVisible(true);
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <span
        className="inline-block leading-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        id={id}
      >
        {children}
      </span>
      {mounted &&
        isVisible &&
        createPortal(
          <div
            className={`fixed pointer-events-none z-50 rounded-full py-2 px-6 shadow-xs animate-in fade-in flex items-center gap-2 ${variantClasses} ${className}`.trim()}
            style={{
              top: position.y - 5,
              left: position.x + 5,
              transform: "translate(0, -100%)",
            }}
          >
            {icon && (
              <span className="flex items-center justify-center">{icon}</span>
            )}
            <span className="font-mediumt">{content}</span>
          </div>,
          document.body,
        )}
    </>
  );
}
