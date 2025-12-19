
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans p-2 md:p-4 lg:p-6 gap-3 md:gap-4">
      {/* Header Skeleton */}
      <header className="flex-none h-14 bg-card/80 backdrop-blur shadow-sm flex items-center justify-between px-4 z-10 rounded-2xl">
         <div className="flex items-center gap-4">
             <Skeleton className="h-8 w-24" />
             <div className="flex items-center gap-3">
                 <Skeleton className="h-6 w-40" />
                 <Skeleton className="h-6 w-12" />
             </div>
         </div>
         <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
         </div>
      </header>

      {/* Main Content Skeleton */}
      <div className="flex-1 w-full overflow-hidden flex bg-card/50 shadow-sm rounded-2xl flex-col md:flex-row">
        
        {/* Left Panel Skeleton */}
        <div className="w-full md:w-[400px] h-full border-r bg-muted/10 p-6 space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-32 w-full" />
        </div>

        {/* Right Panel Skeleton */}
        <div className="flex-1 h-full flex flex-col">
             <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/10 flex-none">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-24" />
             </div>
             <div className="flex-1 flex flex-col p-4 gap-4">
                 <Skeleton className="h-full w-full opacity-50" />
             </div>
        </div>
      </div>
    </div>
  )
}
