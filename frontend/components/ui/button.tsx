import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        {
          "bg-electric-mint text-deep-black hover:scale-105 shadow-glow-mint": variant === "primary",
          "bg-white text-deep-black hover:bg-warm-cream-dark border border-border-subtle shadow-soft": variant === "secondary",
          "hover:bg-white/10 text-text-secondary hover:text-deep-black": variant === "ghost",
          "bg-coral-pink text-white hover:scale-105": variant === "danger",
        },
        {
          "px-4 py-2 rounded-full text-sm": size === "sm",
          "px-6 py-3 rounded-full text-sm": size === "md",
          "px-8 py-4 rounded-full text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  )
}
