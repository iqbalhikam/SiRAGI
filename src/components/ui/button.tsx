import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "emerald";
  size?: "default" | "sm" | "lg" | "icon";
}

const buttonVariants = {
  variant: {
    default:
      "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:scale-[0.99] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
    destructive:
      "bg-red-500 text-white shadow-xs hover:bg-red-600 active:scale-[0.99] dark:bg-red-600 dark:hover:bg-red-700",
    outline:
      "border border-slate-200 bg-white shadow-2xs hover:bg-slate-100 hover:text-slate-900 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:text-slate-300",
    secondary:
      "bg-slate-100 text-slate-900 shadow-2xs hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    ghost:
      "hover:bg-slate-100 hover:text-slate-900 text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:text-slate-300",
    link: "text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400",
    emerald:
      "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] dark:bg-emerald-600 dark:hover:bg-emerald-500",
  },
  size: {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8 text-base",
    icon: "h-9 w-9 p-0",
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
