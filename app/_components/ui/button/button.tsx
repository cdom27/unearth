import { ButtonHTMLAttributes, forwardRef } from "react";
import { linkButtonVariants } from "@/app/_lib/utils/link-button-variants";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof linkButtonVariants;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", children, ...props }, ref) => {
    const variantClasses = linkButtonVariants[variant];

    return (
      <button
        ref={ref}
        className={`min-h-11 rounded-md hover:cursor-pointer py-2 px-6 transition-colors duration-250 disabled:cursor-not-allowed ${variantClasses} ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
