
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TerminalPanelProps {
  output: string | null
  status: "idle" | "success" | "error"
}

export function TerminalPanel({ output, status }: TerminalPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="h-9 border-b px-4 flex items-center justify-between bg-muted/20 flex-none select-none">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Terminal</span>
        {status === "success" && <span className="text-[10px] text-green-500 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Success</span>}
        {status === "error" && <span className="text-[10px] text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Error</span>}
      </div>
      <ScrollArea className="flex-1 p-4 font-mono text-sm">
        {output ? (
          <pre className={cn("whitespace-pre-wrap", status === "error" ? "text-red-500" : "text-foreground")}>
            {output}
          </pre>
        ) : (
          <div className="text-muted-foreground italic">
            Run your query to see results...
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
