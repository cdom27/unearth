import { navLinks } from "./nav-links";

type MenuLinkCategory = {
  name: string;
  links: typeof navLinks;
};

export const menuLinks: MenuLinkCategory[] = [
  {
    name: "Navigation",
    links: navLinks,
  },
  {
    name: "Connect",
    links: [
      {
        href: "mailto:hello@unearth.news",
        label: "Email Unearth",
      },
      {
        href: "https://github.com/cdom27/unearth",
        label: "GitHub repository",
        external: true,
      },
      {
        href: "https://swe.cd",
        label: "Made by swe.cd",
        external: true,
      },
    ],
  },
];
