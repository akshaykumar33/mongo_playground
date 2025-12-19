"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"


interface TerminalPanelProps {
  output: string | null
  status: "idle" | "success" | "error"
  isLoading?: boolean
}

import { Skeleton } from "@/components/ui/skeleton"


import { ObjectRenderer } from "./ObjectRenderer"
import { Copy, Terminal as TerminalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function TerminalPanel({ output, status, isLoading }: TerminalPanelProps) {
    let parsedOutput = null
    try {
        if (output) parsedOutput = JSON.parse(output)
    } catch {
        parsedOutput = output // Fallback to string if not JSON
    }

  const handleCopy = () => {
      if (output) {
          navigator.clipboard.writeText(output)
          toast.success("Copied to clipboard")
      }
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="h-9 border-b px-4 flex items-center justify-between bg-muted/20 flex-none select-none">
        <div className="flex items-center gap-2">
            <TerminalIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Terminal</span>
        </div>
        <div className="flex items-center gap-3">
             {status === "success" && !isLoading && <span className="text-[10px] text-primary flex items-center shadow-primary/50 drop-shadow-[0_0_8px_var(--primary)] font-bold"><CheckCircle className="w-3 h-3 mr-1" /> Success</span>}
             {status === "error" && !isLoading && <span className="text-[10px] text-destructive flex items-center shadow-destructive/50 drop-shadow-[0_0_8px_var(--destructive)] font-bold"><AlertCircle className="w-3 h-3 mr-1" /> Error</span>}
             {isLoading && <span className="text-[10px] text-primary flex items-center animate-pulse drop-shadow-[0_0_8px_var(--primary)]">Running...</span>}
             
             {output && (
                 <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted/50 rounded-sm" onClick={handleCopy}>
                     <Copy className="w-3 h-3 text-muted-foreground" />
                 </Button>
             )}
        </div>
      </div>
      <ScrollArea className="flex-1 h-full font-mono text-sm bg-black/10">
        <div className="p-4 w-full h-full min-w-max">
            {isLoading ? (
                <div className="space-y-2 opacity-50">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
            ) : output ? (
              <div className="w-full">
                   <ObjectRenderer data={parsedOutput} />
              </div>
            ) : (
              <div className="text-muted-foreground italic opacity-50 flex flex-col items-center justify-center p-8 text-xs">
                <span>Run your query to see results...</span>
              </div>
            )}
        </div>
      </ScrollArea>
    </div>
  )
}
