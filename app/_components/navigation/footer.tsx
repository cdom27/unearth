"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoIcon from "../icons/logo";
import { authClient } from "@/app/_lib/auth/auth-client";
import { footerLinks } from "@/app/_lib/static/links";

export default function Footer() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  return (
    <footer className="mt-4 bg-clay-900 text-clay-50 sm:mt-6 md:mt-10 xl:mt-16 2xl:mt-22">
      <div className="mx-4 pb-18 pt-4 sm:mx-12 sm:pb-6 sm:pt-6 md:py-10 lg:mx-18 xl:py-16 xl:mx-24 2xl:mx-auto 2xl:max-w-325 2xl:py-22">
        <div>
          <Link
            href="/"
            className="mx-auto flex w-fit flex-col items-center gap-2 text-clay-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay-400"
          >
            <LogoIcon className="size-6" />
            <span className="font-serif text-3xl leading-tight sm:text-4xl">
              Unearth News
            </span>
          </Link>

          <div className="mt-8 border-t border-clay-600 sm:mt-10" />

          <nav aria-label="Footer navigation" className="mt-8 flex justify-center">
            <ul className="mx-auto grid w-fit max-w-full grid-cols-1 justify-items-center gap-14 sm:grid-cols-2 md:grid-cols-[repeat(3,max-content)] md:gap-16">
              {footerLinks.map((category) => (
                <li
                  key={category.name}
                  className="flex w-max flex-col items-center text-center md:items-start md:text-left"
                >
                  <div className="mb-1.5 font-semibold text-clay-400">
                    {category.name}
                  </div>
                  <ul className="grid w-max grid-cols-1 justify-items-center gap-x-6 md:grid-flow-col md:grid-rows-3 md:grid-cols-none md:auto-cols-max md:justify-items-start">
                    {category.links.map((link) => {
                      const href =
                        link.account && session ? "/account" : link.href;
                      const label =
                        link.account && session ? "My account" : link.label;
                      const isActive = pathname === href;
                      const isHovered = hoveredLink === href;
                      const className = `block whitespace-nowrap py-[3px] underline-offset-4 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-400 ${
                        link.account ? "font-medium text-brand-500" : "text-clay-100"
                      } ${
                        isHovered
                          ? "underline decoration-clay-400"
                          : isActive && hoveredLink === null
                            ? "underline decoration-clay-50"
                            : "decoration-transparent"
                      }`;

                      return (
                        <li key={link.label}>
                          {link.external ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onMouseEnter={() => setHoveredLink(href)}
                              onMouseLeave={() => setHoveredLink(null)}
                              className={className}
                            >
                              {label}
                            </a>
                          ) : (
                            <Link
                              href={href}
                              onMouseEnter={() => setHoveredLink(href)}
                              onMouseLeave={() => setHoveredLink(null)}
                              className={className}
                            >
                              {label}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
