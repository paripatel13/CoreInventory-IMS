import * as React from "react";
import { cn } from "../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// BUTTON
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-700",
        outline: "border border-slate-200 text-slate-900 hover:bg-slate-50",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        ghost: "hover:bg-slate-100 text-slate-900",
        link: "text-slate-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

// INPUT
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// LABEL
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium text-slate-700", className)} {...props} />
  )
);
Label.displayName = "Label";

// BADGE
const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white border-transparent",
        outline: "border-slate-200 text-slate-700 bg-transparent",
        secondary: "bg-slate-100 text-slate-700 border-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

// CARD
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("bg-white rounded-xl border border-slate-100 shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pb-4", className)} {...props} />
);
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-base font-semibold text-slate-900", className)} {...props} />
);
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

// AVATAR
export const Avatar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full", className)} {...props} />
);
export const AvatarFallback = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold", className)} {...props} />
);

// SEPARATOR
export const Separator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("h-px w-full bg-slate-100", className)} {...props} />
);

// SKELETON
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} {...props} />
);
