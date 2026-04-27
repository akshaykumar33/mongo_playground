// Uses IndexedDB for persistent caching (no extra thread)

"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { getQuestions, Question } from "@/data/questions"
import { collections } from "@/data/collections"
import { useIndexedDBQuery } from "@/hooks/use-indexed-query"
import { Play, RotateCcw, CheckCircle, AlertCircle, ArrowRight, List, Database, Check, ArrowUpDown, Menu, Zap, Trash2 } from "lucide-react"
import { useGameStore } from "@/hooks/use-game-store"
import { toast } from "sonner"
import { EditorConfig } from "@/app/playground/EditorConfig"
import { ModeToggle } from "@/components/mode-toggle"
import { EditorPanel } from "@/app/playground/components/EditorPanel"
import { TerminalPanel } from "@/app/playground/components/TerminalPanel"
import { ObjectRenderer } from "@/app/playground/components/ObjectRenderer"
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

interface Stats {
  totalExecutions: number;
  cacheHits: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  correctAnswers: number;
  queryResults: number;
  collections: number;
  executionRecords: number;
  estimatedSize: string;
}

export default function PlaygroundPageWithIndexedDB() {
  const params = useParams()
  const router = useRouter()
  const levelId = params.levelId as string
  const { theme } = useTheme()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  
  const allQuestions = useMemo(() => getQuestions(), [])
  const [currentQuestion, setCurrentQuestion] = useState<Question>(allQuestions[0])
  
  const [code, setCode] = useState(currentQuestion.defaultCode || currentQuestion.solution)
  const [output, setOutput] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isTerminalTop, setIsTerminalTop] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cacheHit, setCacheHit] = useState(false)
  const [executionTime, setExecutionTime] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [showStats, setShowStats] = useState(false)

  const { completeChallenge, addXp, completedChallenges } = useGameStore()
  
  // Use IndexedDB query executor
  const { executeQuery, isLoading, clearCache, getStats, clearAll } = useIndexedDBQuery()

  // Auto-close mobile menu on resize
  useEffect(() => {
    if (isDesktop) {
      setIsMobileMenuOpen(false)
    }
  }, [isDesktop])

  // Update code when question changes
  useEffect(() => {
    setCode(currentQuestion.defaultCode || `// Write your query for '${currentQuestion.collection}' collection\ndb.${currentQuestion.collection}.find({})`)
    setOutput(null)
    setStatus("idle")
    setCacheHit(false)
    setExecutionTime(0)
  }, [currentQuestion])

  // Load and update stats periodically
  useEffect(() => {
    const loadStats = async () => {
      const data = await getStats();
      setStats(data);
    };

    loadStats();
    const interval = setInterval(loadStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [getStats])

  const handleRun = async () => {
    setOutput(null)
    setStatus("idle")
    setCacheHit(false)
    setExecutionTime(0)

    const result = await executeQuery({
      code,
      solution: currentQuestion.solution,
      collections,
    });

    if (!result) {
      setOutput("Error: Failed to execute query")
      setStatus("error")
      toast.error("Execution Error", {
        description: "Failed to execute query",
      })
      return;
    }

    const { userResult, isCorrect, cacheHit: isCached, executionTime: execTime } = result;
    
    setOutput(JSON.stringify(userResult, null, 2))
    setCacheHit(isCached)
    setExecutionTime(execTime)

    if (isCorrect) {
      setStatus("success")
      
      if (!completedChallenges.includes(currentQuestion.id)) {
        completeChallenge(currentQuestion.id, levelId)
        addXp(100)
        const message = isCached 
          ? `Correct Answer! (${execTime.toFixed(0)}ms from cache)` 
          : `Correct Answer! (${execTime.toFixed(0)}ms)`;
        toast.success(message, { description: "+100 XP" })
      } else {
        const timeStr = isCached ? `${execTime.toFixed(0)}ms (cached)` : `${execTime.toFixed(0)}ms`;
        toast.success("Correct Answer!", { 
          description: timeStr
        })
      }
    } else {
      setStatus("error")
      toast.error("Incorrect Result", {
        description: "Your output doesn't match the expected solution.",
      })
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

  const handleClearCache = async () => {
    await clearCache();
    toast.success("Cache cleared", {
      description: "Expired entries removed from IndexedDB"
    });
  }

  const handleClearAll = async () => {
    if (confirm("Are you sure? This will delete all cached data and execution history.")) {
      await clearAll();
      toast.success("All data cleared", {
        description: "IndexedDB has been reset"
      });
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
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans p-2 md:p-4 lg:p-6 gap-3 md:gap-4">
      <EditorConfig />
      
      {/* Header */}
      <header className="flex-none h-14 backdrop-blur shadow-sm flex items-center justify-between px-4 z-10 w-full overflow-hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-muted-foreground hover:text-foreground hidden md:flex">
            &larr; Home
          </Button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate max-w-[200px] md:max-w-none">
              Mongo Playground
            </span>
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider border-primary text-primary hidden md:inline-flex">
              {levelId}
            </Badge>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {/* Collections Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex rounded-none border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors">
                <Database className="w-4 h-4 mr-2" />
                Collections
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[85vh]">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl text-primary">Database Collections</DialogTitle>
                <DialogDescription>
                  Collections are stored in IndexedDB for instant reuse.
                  <span className="text-xs text-muted-foreground ml-2">(Read-only view)</span>
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="users" className="h-full flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-2">
                  <TabsList className="bg-muted/50">
                    {Object.keys(collections).map(name => (
                      <TabsTrigger key={name} value={name} className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                    {Object.keys(collections).length} Collections
                  </Badge>
                </div>
                
                {Object.entries(collections).map(([name, data]) => (
                  <TabsContent key={name} value={name} className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0">
                    <ScrollArea className="flex-1 h-full rounded-none border bg-muted/10 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.slice(0, 20).map((doc: any, i: number) => (
                          <div key={i} className="bg-card text-card-foreground p-0 rounded-none border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow hover:border-primary/50">
                            <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ID</span>
                                <Badge variant="secondary" className="font-mono text-xs bg-primary/10 text-primary hover:bg-primary/20">{doc._id}</Badge>
                              </div>
                            </div>
                            
                            <div className="p-4 text-xs font-mono bg-background/50 h-full">
                              <ObjectRenderer data={doc} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {data.length > 20 && (
                        <div className="py-8 text-center">
                          <p className="text-sm text-muted-foreground font-medium">
                            Showing 20 of {data.length.toLocaleString()} records
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* Statistics Dialog */}
          <Dialog open={showStats} onOpenChange={setShowStats}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-none border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors">
                <Zap className="w-4 h-4 mr-2" />
                Stats
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Performance Stats</DialogTitle>
                <DialogDescription>
                  Last 7 days of query execution data
                </DialogDescription>
              </DialogHeader>
              
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Total Queries</div>
                      <div className="text-2xl font-bold">{stats.totalExecutions}</div>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded border border-green-300">
                      <div className="text-xs text-green-700 dark:text-green-300 mb-1">Cache Hits</div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {Math.round(stats.cacheHitRate)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Avg Execution</div>
                      <div className="text-2xl font-bold">{stats.averageExecutionTime.toFixed(0)}ms</div>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded border border-blue-300">
                      <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Correct</div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {Math.round((stats.correctAnswers / stats.totalExecutions) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cached Results</span>
                      <span className="font-mono">{stats.queryResults}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collections</span>
                      <span className="font-mono">{stats.collections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DB Size</span>
                      <span className="font-mono">{stats.estimatedSize}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs"
                      onClick={handleClearCache}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear Cache
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1 text-xs"
                      onClick={handleClearAll}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading statistics...</p>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Questions Sidebar */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-none border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors">
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
                              "w-full text-left px-3 py-2 rounded-none text-sm transition-colors flex items-center justify-between group",
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
          
          <ThemeCustomizer />
          <ModeToggle />
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0">
              <div className="flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="p-4 border-b">
                  <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Mongo Playground
                  </span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-2 p-4">
                    <Button variant="ghost" className="justify-start px-2 h-10 w-full" onClick={() => router.push("/")}>
                      <ArrowRight className="w-4 h-4 mr-2 rotate-180 text-primary" />
                      Back to Home
                    </Button>
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <div className={cn(
        "flex-1 w-full overflow-hidden flex border bg-card/50 shadow-sm", 
        isDesktop ? "flex-row" : "flex-col"
      )}>
        
        {/* Left Panel - Problem Description */}
        <div className={cn(
          "bg-muted/10 flex-none flex flex-col",
          isDesktop ? "w-[400px] h-full border-r" : "w-full h-[35%] border-b"
        )}>
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
                  className="h-full bg-primary transition-all duration-500 shadow-[0_0_5px_var(--primary)]" 
                  style={{ width: `${(completedChallenges.length / allQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Editor & Output */}
        <div className="flex-1 h-full min-w-0 flex flex-col">
          {/* Workspace Header */}
          <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/10 flex-none">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground/70 tracking-wide">Workspace</span>
              
              {/* Cache Hit Indicator */}
              {cacheHit && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-300 flex items-center gap-1.5 text-[10px]">
                  <Zap className="w-3 h-3" />
                  Cached {executionTime.toFixed(0)}ms
                </Badge>
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 animate-pulse text-[10px]">
                  Executing...
                </Badge>
              )}

              {/* Execution Time */}
              {executionTime > 0 && !cacheHit && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300 text-[10px]">
                  {executionTime.toFixed(0)}ms
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setIsTerminalTop(!isTerminalTop)}
              >
                <ArrowUpDown className="w-3 h-3" />
                Swap
              </Button>
            </div>
          </div>

          {/* Editor & Terminal with Resize */}
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

                <ResizableHandle withHandle className="h-px w-full" />

                {/* Bottom: Editor */}
                <ResizablePanel defaultSize={65} minSize={30}>
                  <EditorPanel 
                    code={code}
                    setCode={setCode}
                    currentQuestion={currentQuestion}
                    status={status}
                    isRunning={isLoading}
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
                    isRunning={isLoading}
                    handleRun={handleRun}
                    handleNext={handleNext}
                    theme={theme || 'dark'}
                  />
                </ResizablePanel>

                <ResizableHandle withHandle className="h-px w-full" />

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