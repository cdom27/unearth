"use client";

import { navLinks } from "@/app/_lib/static/nav-links";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BarChartIcon from "@/app/_components/icons/barchart";
import MagicWandIcon from "@/app/_components/icons/magic-wand";
import GridIcon from "@/app/_components/icons/grid";

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; filled?: boolean }>
> = {
  Analyze: MagicWandIcon,
  Discover: GridIcon,
  Ratings: BarChartIcon,
};

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 w-full max-w-full bg-clay-900 text-clay-50 sm:hidden">
      <ul className="grid min-w-0 grid-cols-3 justify-items-center">
        {navLinks.map((link) => {
          const Icon = iconMap[link.label];
          const isActive = pathname === link.href;

          return (
            <li key={link.label}>
              <Link
                href={link.href}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 transition-colors ${
                  isActive ? "text-clay-100" : "text-clay-50"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`size-6 ${isActive ? "text-brand-500" : "text-clay-50"}`}
                    filled={isActive}
                  />
                )}
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
