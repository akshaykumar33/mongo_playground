
import { cn } from "@/lib/utils"

export function ObjectRenderer({ data, level = 0 }: { data: any, level?: number }) {
  if (data === null) return <span className="text-muted-foreground">null</span>
  if (data === undefined) return <span className="text-muted-foreground">undefined</span>
  
  // Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-muted-foreground">[]</span>
    return (
      <div className="flex flex-col gap-1 my-0.5">
        <span className="text-muted-foreground opacity-50 text-[10px] font-mono">[</span>
        <div className="pl-3 border-l-2 border-border/30 flex flex-col gap-2">
          {data.map((item, i) => (
            <div key={i} className="flex">
              <ObjectRenderer data={item} level={level + 1} />
              {i < data.length - 1 && <span className="text-muted-foreground opacity-50">,</span>}
            </div>
          ))}
        </div>
        <span className="text-muted-foreground opacity-50 text-[10px] font-mono">]</span>
      </div>
    )
  }

  // Objects
  if (typeof data === 'object') {
    if (Object.keys(data).length === 0) return <span className="text-muted-foreground">{"{}"}</span>
    return (
       <div className="flex flex-col gap-0.5 my-0.5 w-full">
          {level > 0 && <span className="text-muted-foreground opacity-50 text-[10px] font-mono">{'{'}</span>}
          <div className={cn("flex flex-col gap-1.5", level > 0 && "pl-3 border-l-2 border-border/30")}>
            {Object.entries(data).map(([key, value]) => {
                 if (key === "_id" && level === 0) return null // Skip _id at top level as it's shown in header usually
                 return (
                    <div key={key} className="flex gap-2 items-start hover:bg-muted/30 rounded px-1 -ml-1 transition-colors">
                        <span className="text-xs font-semibold text-sky-500/90 dark:text-sky-400 font-mono shrink-0 mt-0.5">{key}:</span>
                        <div className="text-xs font-mono break-all whitespace-pre-wrap min-w-0 flex-1">
                            <ObjectRenderer data={value} level={level + 1} />
                        </div>
                    </div>
                 )
            })}
          </div>
          {level > 0 && <span className="text-muted-foreground opacity-50 text-[10px] font-mono">{'}'}</span>}
       </div>
    )
  }

  // Primitives
  if (typeof data === 'string') return <span className="text-emerald-600 dark:text-emerald-400 break-words">"{data}"</span>
  if (typeof data === 'number') return <span className="text-orange-500 dark:text-orange-400">{data}</span>
  if (typeof data === 'boolean') return <span className="text-purple-500 dark:text-purple-400 font-bold">{data.toString()}</span>

  return <span>{String(data)}</span>
}
