
import { Button } from "@/components/ui/button"
import Editor from "@monaco-editor/react"
import { Play, RotateCcw, ArrowRight } from "lucide-react"

interface EditorPanelProps {
  code: string
  setCode: (code: string) => void
  currentQuestion: any
  status: "idle" | "success" | "error"
  isRunning: boolean
  handleRun: () => void
  handleNext: () => void
  theme: string
}

export function EditorPanel({
  code,
  setCode,
  currentQuestion,
  status,
  isRunning,
  handleRun,
  handleNext,
  theme
}: EditorPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="h-10 border-b flex items-center justify-between px-3 bg-muted/30 flex-none select-none">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">main.js</span>
        <div className="flex items-center gap-1.5">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
            onClick={() => setCode(currentQuestion.defaultCode || `db.${currentQuestion.collection}.find({})`)}
          >
            <RotateCcw className="w-3 h-3 mr-1.5" />
            Reset
          </Button>
          {status === "success" ? (
            <Button size="sm" onClick={handleNext} className="h-6 text-[10px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_-5px_var(--primary)]">
              Next
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={handleRun} 
              disabled={isRunning}
              className="h-6 text-[10px] px-2"
            >
              <Play className="w-3 h-3 mr-1.5" />
              Run
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 relative bg-[#1e1e1e]">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme={theme === "light" ? "light" : "vs-dark"}
          value={code}
          onChange={(val) => setCode(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  )
}
