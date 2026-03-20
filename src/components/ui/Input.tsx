import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-white">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`mt-1 w-full rounded-lg border bg-white/5 px-4 py-3 text-white placeholder:text-white/40 transition-colors focus:outline-none ${
            error
              ? "border-error focus:border-error"
              : "border-white/20 focus:border-green-cs"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
