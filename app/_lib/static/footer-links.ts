type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
  account?: boolean;
};

type FooterLinkCategory = {
  name: string;
  links: FooterLink[];
};

export const footerLinks: FooterLinkCategory[] = [
  {
    name: "About",
    links: [
      { href: "/about", label: "Learn more" },
      {
        href: "https://swe.cd",
        label: "Made by swe.cd",
        external: true,
      },
    ],
  },
  {
    name: "Sections",
    links: [
      { href: "/login", label: "Login", account: true },
      { href: "/#breaking-news", label: "Breaking news" },
      { href: "/", label: "Analyze articles" },
      { href: "/discover", label: "All analyses" },
      { href: "/media-ratings", label: "Media ratings" },
    ],
  },
  {
    name: "Contact",
    links: [
      { href: "mailto:hello@unearth.news", label: "hello@unearth.news" },
      {
        href: "https://github.com/cdom27/unearth",
        label: "Github repository",
        external: true,
      },
    ],
  },
];
