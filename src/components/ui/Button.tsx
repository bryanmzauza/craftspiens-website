import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  children: ReactNode;
  href?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  href,
  fullWidth,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-bold uppercase tracking-wide transition-all duration-200";

  const sizes = {
    md: "px-8 py-3 text-sm",
    lg: "px-8 py-3.5 text-sm sm:px-9 sm:py-4 sm:text-[15px]",
  };

  const variants = {
    primary:
      "bg-green-cs text-white hover:bg-green-dark hover:shadow-[0_0_20px_rgba(76,175,80,0.3)]",
    secondary:
      "border-2 border-white text-white hover:bg-white/10",
  };

  const classes = `${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
