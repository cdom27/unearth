export type NavLink = {
  href: string;
  label: string;
  external?: boolean;
};

export const navLinks: NavLink[] = [
  {
    href: "/",
    label: "Analyze",
  },
  {
    href: "/discover",
    label: "Discover",
  },
  {
    href: "/media-ratings",
    label: "Ratings",
  },
];
