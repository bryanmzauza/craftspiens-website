import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
  href?: string;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  children,
  href,
  fullWidth,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-8 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-200";

  const variants = {
    primary:
      "bg-green-cs text-white hover:bg-green-dark hover:shadow-[0_0_20px_rgba(76,175,80,0.3)]",
    secondary:
      "border-2 border-white text-white hover:bg-white/10",
  };

  const classes = `${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`;

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
