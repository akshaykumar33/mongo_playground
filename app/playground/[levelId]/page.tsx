"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { getQuestions, Question } from "@/data/questions"
import { collections } from "@/data/collections"
import { MongoEngine } from "@/lib/mongo-engine"
import { Play, RotateCcw, CheckCircle, AlertCircle, ArrowRight, List, Database, Check, ArrowUpDown } from "lucide-react"
import { useGameStore } from "@/hooks/use-game-store"
import { toast } from "sonner"
import { EditorConfig } from "@/app/playground/EditorConfig"
import { ModeToggle } from "@/components/mode-toggle"
import { EditorPanel } from "@/app/playground/components/EditorPanel"
import { TerminalPanel } from "@/app/playground/components/TerminalPanel"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { useTheme } from "next-themes"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { useMediaQuery } from "@/hooks/use-media-query"

export default function PlaygroundPage() {
  const params = useParams()
  const router = useRouter()
  // We can ignore levelId for strict filtering if we want to show all, or use it 
  // to filter the sidebar. For now, let's show all questions but maybe highlight current level.
  const levelId = params.levelId as string
  const { theme } = useTheme()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  
  const allQuestions = useMemo(() => getQuestions(), [])
  const [currentQuestion, setCurrentQuestion] = useState<Question>(allQuestions[0])
  
  const [code, setCode] = useState(currentQuestion.defaultCode || currentQuestion.solution)
  const [output, setOutput] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isRunning, setIsRunning] = useState(false)
  const [isTerminalTop, setIsTerminalTop] = useState(false)

  const { completeChallenge, addXp, completedChallenges } = useGameStore()
  
  // Initialize Engine
  const engine = useMemo(() => new MongoEngine(), [])

  // Update code when question changes
  useEffect(() => {
    setCode(currentQuestion.defaultCode || `// Write your query for '${currentQuestion.collection}' collection\ndb.${currentQuestion.collection}.find({})`)
    setOutput(null)
    setStatus("idle")
  }, [currentQuestion])

  const handleRun = async () => {
    setIsRunning(true)
    setOutput(null)
    setStatus("idle")

    try {
      // 1. Execute User Code
      const userResult = await engine.execute(code)
      
      // 2. Execute Solution Code (to get expected result)
      const expectedResult = await engine.execute(currentQuestion.solution)

      // 3. Compare Results
      // improved comparison: check if JSON stringified results match
      const normalize = (val: any) => JSON.stringify(val)
      const isCorrect = normalize(userResult) === normalize(expectedResult)

      if (isCorrect) {
        setOutput(JSON.stringify(userResult, null, 2))
        setStatus("success")
        
        if (!completedChallenges.includes(currentQuestion.id)) {
            completeChallenge(currentQuestion.id, levelId)
            addXp(100)
            toast.success("Correct Answer!", { description: "+100 XP" })
        } else {
            toast.success("Correct Answer!", { description: "You've already mastered this one." })
        }
      } else {
        setOutput(JSON.stringify(userResult, null, 2))
        setStatus("error")
        toast.error("Incorrect Result", {
             description: "Your output doesn't match the expected solution.",
        })
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`)
      setStatus("error")
    } finally {
        setIsRunning(false)
    }
  }

  const handleNext = () => {
      const idx = allQuestions.findIndex(q => q.id === currentQuestion.id)
      if (idx < allQuestions.length - 1) {
          setCurrentQuestion(allQuestions[idx + 1])
      } else {
          toast.info("All questions completed!")
      }
  }

  // Group questions by category
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Question[]> = {}
    allQuestions.forEach(q => {
      if (!groups[q.category]) groups[q.category] = []
      groups[q.category].push(q)
    })
    return groups
  }, [allQuestions])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
      <EditorConfig />
      
      {/* Header */}
      <header className="flex-none h-14 border-b border-border flex items-center justify-between px-4 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 z-10">
         <div className="flex items-center gap-4">
             <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-muted-foreground hover:text-foreground">
                 &larr; Home
             </Button>
             <div className="flex items-center gap-3">
                 <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-600">
                    Mongo Playground
                 </span>
                 <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
                    {currentQuestion.difficulty}
                 </Badge>
             </div>
         </div>

         <div className="flex items-center gap-2">
            <ThemeCustomizer />
            <ModeToggle />
            
            {/* Collections Viewer */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:flex">
                        <Database className="w-4 h-4 mr-2" />
                        Collections
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Database Collections</DialogTitle>
                        <DialogDescription>Inspect the available mock data.</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="users" className="h-full flex flex-col">
                        <TabsList className="w-full justify-start">
                            {Object.keys(collections).map(name => (
                                <TabsTrigger key={name} value={name}>
                                    {name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                         {Object.entries(collections).map(([name, data]) => (
                            <TabsContent key={name} value={name} className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                <ScrollArea className="flex-1 h-full rounded-md border p-4 bg-muted/20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {data.map((doc: any, i: number) => (
                                            <div key={i} className="bg-card text-card-foreground p-4 rounded-lg border shadow-sm text-xs font-mono">
                                                <div className="flex justify-between items-start mb-2 border-b pb-2 border-border/50">
                                                    <span className="font-bold text-primary">_id: {doc._id}</span>
                                                    {doc.role && <Badge variant="outline" className="text-[10px]">{doc.role}</Badge>}
                                                    {doc.category && <Badge variant="outline" className="text-[10px]">{doc.category}</Badge>}
                                                </div>
                                                <div className="space-y-1 text-muted-foreground break-all">
                                                    {Object.entries(doc).map(([key, value]) => {
                                                        if (key === "_id" || key === "role" || key === "category") return null
                                                        return (
                                                            <div key={key} className="flex gap-2">
                                                                <span className="font-semibold text-foreground/80">{key}:</span>
                                                                <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        ))}
                    </Tabs>
                </DialogContent>
            </Dialog>

             {/* Questions Sidebar Trigger */}
             <Sheet>
                 <SheetTrigger asChild>
                     <Button variant="outline" size="sm">
                         <List className="w-4 h-4 mr-2" />
                         Questions
                     </Button>
                 </SheetTrigger>
                 <SheetContent side="left" className="w-[400px] p-0">
                     <div className="p-4 border-b">
                         <h2 className="font-bold text-lg">Questions</h2>
                         <p className="text-xs text-muted-foreground">Select a challenge to start.</p>
                     </div>
                     <ScrollArea className="h-[calc(100vh-80px)]">
                         <div className="p-4 space-y-6">
                             {Object.entries(groupedQuestions).map(([category, questions]) => (
                                 <div key={category}>
                                     <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{category}</h3>
                                     <div className="space-y-1">
                                         {questions.map(q => (
                                             <button
                                                 key={q.id}
                                                 onClick={() => setCurrentQuestion(q)}
                                                 className={cn(
                                                     "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                                                     currentQuestion.id === q.id 
                                                        ? "bg-primary/10 text-primary font-medium" 
                                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                 )}
                                             >
                                                 <span className="truncate mr-2">{q.title}</span>
                                                 {completedChallenges.includes(q.id) && (
                                                     <Check className="w-3 h-3 text-green-500 shrink-0" />
                                                 )}
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </ScrollArea>
                 </SheetContent>
             </Sheet>
         </div>
      </header>

      {/* Main Content Fixed Layout */}
      <div className={cn(
        "flex-1 w-full border-t overflow-hidden flex", 
        isDesktop ? "flex-row" : "flex-col"
      )}>
        
        {/* Left: Problem & Description (Fixed) */}
        <div className={cn(
            "bg-muted/10 flex-none flex flex-col",
            isDesktop ? "w-[400px] h-full border-r" : "w-full h-[35%] border-b"
        )}>
            {/* Question Content */}
            <div className="h-full flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{currentQuestion.title}</h1>
                            <div className="flex gap-2 mb-4">
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {currentQuestion.collection}
                                </Badge>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {currentQuestion.category}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                {currentQuestion.description}
                            </p>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <h3 className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide mb-2 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-2" />
                                Hints
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-600/90 dark:text-yellow-200/70">
                                {currentQuestion.hints.map((hint, i) => (
                                    <li key={i}>{hint}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
                
                <div className="p-4 border-t bg-background/50 flex-none">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{completedChallenges.length} / {allQuestions.length} Solved</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 transition-all duration-500" 
                            style={{ width: `${(completedChallenges.length / allQuestions.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Editor & Output (Flexible) */}
        <div className="flex-1 h-full min-w-0 flex flex-col">
             
             {/* Unified Right Panel Header */}
             <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/10 flex-none">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground/70 tracking-wide">Workspace</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-muted-foreground hover:text-foreground gap-1.5"
                    onClick={() => setIsTerminalTop(!isTerminalTop)}
                >
                    <ArrowUpDown className="w-3 h-3" />
                    Swap View
                </Button>
             </div>

             <ResizablePanelGroup 
                key={isDesktop ? `desktop-${isTerminalTop ? "t" : "b"}` : `mobile-${isTerminalTop ? "t" : "b"}`}
                direction="vertical" 
                className="flex-1 flex flex-col h-full"
             >
                 
                 {isTerminalTop ? (
                    <>
                        {/* Top: Terminal */}
                        <ResizablePanel defaultSize={35} minSize={20} className="bg-muted/5">
                            <TerminalPanel output={output} status={status} />
                        </ResizablePanel>

                        <ResizableHandle 
                            withHandle 
                            className="h-px w-full after:h-4 after:w-full after:left-0 after:translate-x-0 after:-translate-y-1/2" 
                        />

                        {/* Bottom: Editor */}
                        <ResizablePanel defaultSize={65} minSize={30}>
                            <EditorPanel 
                                code={code}
                                setCode={setCode}
                                currentQuestion={currentQuestion}
                                status={status}
                                isRunning={isRunning}
                                handleRun={handleRun}
                                handleNext={handleNext}
                                theme={theme || 'dark'}
                            />
                        </ResizablePanel>
                    </>
                 ) : (
                    <>
                        {/* Top: Editor */}
                        <ResizablePanel defaultSize={65} minSize={30}>
                             <EditorPanel 
                                code={code}
                                setCode={setCode}
                                currentQuestion={currentQuestion}
                                status={status}
                                isRunning={isRunning}
                                handleRun={handleRun}
                                handleNext={handleNext}
                                theme={theme || 'dark'}
                            />
                        </ResizablePanel>

                        <ResizableHandle 
                            withHandle 
                            className="h-px w-full after:h-4 after:w-full after:left-0 after:translate-x-0 after:-translate-y-1/2" 
                        />

                        {/* Bottom: Terminal */}
                        <ResizablePanel defaultSize={35} minSize={20} className="bg-muted/5">
                            <TerminalPanel output={output} status={status} />
                        </ResizablePanel>
                    </>
                 )}

             </ResizablePanelGroup>
        </div>
        
      </div>
    </div>
  )
}
