"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Database, Trophy, Zap, Github, Menu } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    if (isDesktop) {
      setIsMobileMenuOpen(false)
    }
  }, [isDesktop])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden selection:bg-primary/20 p-3 md:p-6">
      
      {/* Floating Main Container */}
      <div className="flex-1 flex flex-col  overflow-hidden relative">

      {/* Navigation */}
      <nav className="w-full z-50 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-background/20 sticky top-0">
        <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            <span>Mongo<span className="text-primary">Playground</span></span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
             <ThemeCustomizer />
             <ModeToggle />
             <Button variant="ghost" size="icon" asChild>
                <Link href="https://github.com/akshaykumar33/mongo_playground" target="_blank">
                    <Github className="w-5 h-5 text-primary" />
                </Link>
             </Button>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] sm:max-w-none pt-16 px-6">
                    <SheetHeader className="mb-6 text-left">
                        <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex flex-col gap-6">
                        {/* Appearance Section */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground px-1">Appearance</h4>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
                                    <span className="font-medium">Theme Color</span>
                                    <ThemeCustomizer />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
                                    <span className="font-medium">Display Mode</span>
                                    <ModeToggle />
                                </div>
                            </div>
                        </div>

                        {/* Links Section */}
                        <div className="space-y-3">
                             <h4 className="text-sm font-medium text-muted-foreground px-1">Community</h4>
                             <Button variant="secondary" className="w-full justify-start h-12 px-4 rounded-xl text-base font-medium" asChild>
                                <Link href="https://github.com/akshaykumar33/mongo_playground" target="_blank">
                                    <Github className="w-5 h-5 mr-3 text-primary" />
                                    Star on GitHub
                                </Link>
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-4">
        {/* Abstract Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-[128px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10 text-center space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center space-x-2 bg-muted/50 border border-border rounded-full px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>v1.0 Public Beta</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter">
            Master <span className="text-primary block md:inline">MongoDB</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The ultimate interactive playground. clear challenges, instant feedback, and gamified progress.
          </p>

          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          >
            <Link href="/levels">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                Start Coding
                <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50">
                View Leaderboard
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full z-10"
        >
          {[
            {
              icon: Database,
              title: "Real Interactions",
              desc: "Execute queries against a live in-memory database engine.",
            },
            {
              icon: Zap,
              title: "Instant Feedback",
              desc: "Get immediate results and validation for your solutions.",
            },
            {
              icon: Trophy,
              title: "Gamified Learning",
              desc: "Earn XP, complete daily streaks, and unlock new levels.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-8  bg-card/50 backdrop-blur-md hover:bg-card transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-3 w-fit rounded-xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

     <footer className="w-full py-6 text-center text-sm text-muted-foreground border-t border-border/50 bg-background/50 mt-2 backdrop-blur">
          <p>© 2024 Mongo Playground. Built for developers.</p>
       </footer>
       </div>
    </div>
  )
}
