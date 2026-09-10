"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LogoIcon from "../icons/logo";
import MenuIcon from "../icons/menu";
import { links } from "@/app/_lib/static/links";
import { navLinks } from "@/app/_lib/static/nav-links";
import SideMenu from "../ui/side-menu/side-menu";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <header>
      <div className="m-4 sm:my-6 sm:mx-12 pb-4 sm:pb-6 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex justify-between items-center border-b border-clay-200">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-serif text-3xl"
        >
          <LogoIcon className="size-9" /> <span>Unearth</span>
        </Link>

        <nav className="hidden md:flex">
          <ul className="flex gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const isHovered = hoveredLink === link.href;
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                    className={`font-medium decoration-clay-50 underline-offset-4 transition-colors duration-300 ${
                      isHovered
                        ? "underline decoration-clay-400"
                        : isActive && hoveredLink === null
                          ? "underline decoration-clay-900"
                          : "decoration-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="navigation-menu"
          aria-expanded={isOpen}
          className="hover:cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <MenuIcon className="w-9" />
          <span className="sr-only">
            {isOpen ? "Close navigation menu" : "Open navigation menu"}
          </span>
        </button>
      </div>

      <SideMenu open={isOpen} setOpen={setIsOpen} id="navigation-menu">
        <nav>
          <ul className="flex flex-col gap-4">
            {links.map((cat) => (
              <li key={cat.name}>
                <ul>
                  <li className="text-lg font-semibold pb-2">{cat.name}</li>

                  {cat.links.map((link) => {
                    const isActive = pathname === link.href;
                    const isHovered = hoveredLink === link.href;
                    return (
                      <li key={link.label} className="flex">
                        <Link
                          href={link.href}
                          onMouseEnter={() => setHoveredLink(link.href)}
                          onMouseLeave={() => setHoveredLink(null)}
                          onClick={() => setIsOpen(false)}
                          className={`text-2xl w-full p-2 border-b border-clay-800 transition-colors duration-300 ${
                            isHovered
                              ? "text-brand-500"
                              : isActive && hoveredLink === null
                                ? "text-brand-500"
                                : "text-clay-100"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </SideMenu>
    </header>
  );
}
