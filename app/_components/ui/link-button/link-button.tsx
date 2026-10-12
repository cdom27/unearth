import { AnchorHTMLAttributes, forwardRef } from "react";
import { linkButtonVariants } from "@/app/_lib/utils/link-button-variants";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: keyof typeof linkButtonVariants;
}

const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className = "", variant = "primary", children, ...props }, ref) => {
    const variantClasses = linkButtonVariants[variant];

    return (
      <a
        ref={ref}
        className={`min-h-11 rounded-md hover:cursor-pointer py-2 px-6 transition-colors duration-250 disabled:cursor-not-allowed ${variantClasses} ${className}`.trim()}
        {...props}
      >
        {children}
      </a>
    );
  },
);

LinkButton.displayName = "LinkButton";

export default LinkButton;
