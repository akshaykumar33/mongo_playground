import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10 shadow-[0_0_10px_-5px_var(--primary)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
