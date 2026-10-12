import { ReactNode } from "react";

interface BannerProps {
  children: ReactNode;
}

export default function Banner({ children }: BannerProps) {
  return (
    <div className="bg-clay-500 text-clay-50">
      <div className="mx-4 sm:mx-12 py-2 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex justify-between items-center">
        {children}
      </div>
    </div>
  );
}
