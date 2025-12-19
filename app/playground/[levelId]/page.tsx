"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { getQuestions, Question } from "@/data/questions"
import { collections } from "@/data/collections"
import { MongoEngine } from "@/lib/mongo-engine"
import { Play, RotateCcw, CheckCircle, AlertCircle, ArrowRight, List, Database, Check, ArrowUpDown, Menu } from "lucide-react"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { completeChallenge, addXp, completedChallenges } = useGameStore()
  
  // Initialize Engine
  const engine = useMemo(() => new MongoEngine(), [])

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
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans p-2 md:p-4 lg:p-6 gap-3 md:gap-4">
      <EditorConfig />
      
      {/* Header */}
      <header className="flex-none h-14 backdrop-blur shadow-sm flex items-center justify-between px-4 z-10 w-full overflow-hidden">
         {/* Desktop & Mobile Title / Home */}
         <div className="flex items-center gap-4">
             {/* Desktop Home Button */}
             <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-muted-foreground hover:text-foreground hidden md:flex">
                 &larr; Home
             </Button>
             
             {/* Logo/Title */}
             <div className="flex items-center gap-2 md:gap-3">
                 <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate max-w-[200px] md:max-w-none">
                    Mongo Playground
                 </span>
                 {/* Desktop Badge */}
                 <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider border-primary text-primary hidden md:inline-flex">
                    {levelId}
                 </Badge>
             </div>
         </div>

         {/* Desktop Navigation Group */}
         <div className="hidden md:flex items-center gap-2">
            
            {/* Collections Viewer */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:flex rounded-none border-primary/50 hover:bg-primary/10  hover:text-primary transition-colors">
                        <Database className="w-4 h-4 mr-2" />
                        Collections
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl h-[85vh]">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-xl text-primary">Database Collections</DialogTitle>
                        <DialogDescription>
                            Browse the mock data available for your queries. 
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
                                                {/* Card Header */}
                                                <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ID</span>
                                                        <Badge variant="secondary" className="font-mono text-xs bg-primary/10 text-primary hover:bg-primary/20">{doc._id}</Badge>
                                                    </div>
                                                    <div className="flex gap-1.5 shrink-0">
                                                        {doc.role && <Badge variant="outline" className="text-[10px] capitalize bg-background border-primary/30 text-primary/80">{doc.role}</Badge>}
                                                        {doc.category && <Badge variant="outline" className="text-[10px] capitalize bg-background border-primary/30 text-primary/80">{doc.category}</Badge>}
                                                        {doc.status && (
                                                            <Badge 
                                                                variant="outline" 
                                                                className={cn(
                                                                    "text-[10px] capitalize bg-background",
                                                                    doc.status === 'completed' && "text-primary border-primary",
                                                                    doc.status === 'pending' && "text-yellow-500 border-yellow-200",
                                                                    doc.status === 'cancelled' && "text-red-500 border-red-200",
                                                                )}
                                                            >
                                                                {doc.status}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Card Content */}
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
                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                Use queries to explore the full dataset
                                            </p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        ))}
                    </Tabs>
                </DialogContent>
            </Dialog>

             {/* Questions Sidebar Trigger */}
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

         {/* Mobile Hamburger Menu (md:hidden) */}
         <div className="md:hidden flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0">
                    <div className="flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        {/* Mobile Header Title */}
                         <div className="p-4 border-b">
                             <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                Mongo Playground
                            </span>
                            <div className="mt-1 flex gap-2">
                                <Badge variant="outline" className="font-mono text-xs border-primary text-primary">
                                    {levelId}
                                </Badge>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="flex flex-col gap-2 p-4">
                                {/* Mobile Nav Items */}
                                <Button variant="ghost" className="justify-start px-2 h-10 w-full" onClick={() => router.push("/")}>
                                    <ArrowRight className="w-4 h-4 mr-2 rotate-180 text-primary" />
                                    Back to Home
                                </Button>
                                
                                {/* Mobile Questions Trigger */}
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" className="justify-start px-2 h-10 w-full">
                                            <List className="w-4 h-4 mr-2 text-primary" />
                                            Questions List
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[100vw] sm:w-[400px] p-0 z-[60]">
                                         <div className="p-4 border-b flex items-center justify-between">
                                             <h2 className="font-bold text-lg">Questions</h2>
                                             {/* Optional close button or something could go here if needed, but default cross works */}
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

                                 {/* Mobile Collections Trigger */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="justify-start px-2 h-10 w-full">
                                            <Database className="w-4 h-4 mr-2 text-primary" />
                                            View Collections
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[95vw] h-[85vh] p-0 z-[60] gap-0">
                                        <DialogHeader className="p-4 border-b">
                                            <DialogTitle className="text-xl text-primary">Collections</DialogTitle>
                                        </DialogHeader>
                                        <Tabs defaultValue="users" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                            <div className="px-4 py-2 border-b bg-muted/20">
                                                <ScrollArea className="w-full whitespace-nowrap">
                                                    <TabsList className="bg-transparent p-0 gap-2 h-auto">
                                                        {Object.keys(collections).map(name => (
                                                            <TabsTrigger key={name} value={name} className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 h-auto text-xs sm:text-sm">
                                                                {name}
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                </ScrollArea>
                                            </div>
                                            
                                             {Object.entries(collections).map(([name, data]) => (
                                                <TabsContent key={name} value={name} className="flex-1 min-h-0 overflow-hidden flex flex-col mt-0">
                                                    <ScrollArea className="flex-1 h-full bg-muted/10 p-4">
                                                        <div className="space-y-4">
                                                            {data.slice(0, 20).map((doc: any, i: number) => (
                                                                <div key={i} className="bg-card text-card-foreground p-0 rounded-none border shadow-sm overflow-hidden flex flex-col">
                                                                    <div className="px-3 py-2 border-b bg-muted/20 flex items-center justify-between gap-2">
                                                                         <div className="flex items-center gap-2 overflow-hidden">
                                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ID</span>
                                                                            <Badge variant="secondary" className="font-mono text-[10px] bg-primary/10 text-primary truncate max-w-[100px]">{doc._id}</Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-3 text-[10px] sm:text-xs font-mono bg-background/50">
                                                                         <ObjectRenderer data={doc} />
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
                            </div>
                        </ScrollArea>
                        
                        {/* Footer Controls */}
                        <div className="border-t p-4 bg-muted/10">
                             <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-muted-foreground">Appearance</span>
                                 <div className="flex gap-2">
                                     <ThemeCustomizer />
                                     <ModeToggle />
                                 </div>
                             </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
         </div>
      </header>

      {/* Main Content Fixed Layout */}
      <div className={cn(
        "flex-1 w-full overflow-hidden flex border bg-card/50 shadow-sm", 
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
                            className="h-full bg-primary transition-all duration-500 shadow-[0_0_5px_var(--primary)]" 
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
