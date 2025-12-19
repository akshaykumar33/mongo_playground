"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { BookOpen, Brain, Rocket, Lock } from "lucide-react"
import Link from "next/link"
import { useGameStore } from "@/hooks/use-game-store"

const levels = [
  {
    id: "basic",
    title: "Novice Explorer",
    desc: "Start here. Learn CRUD operations like Insert, Find, Update, and Delete.",
    icon: BookOpen,
    difficulty: "Basic",
  },
  {
    id: "intermediate",
    title: "Data Architect",
    desc: "Master Aggregations, Indexing, and complex queries.",
    icon: Brain,
    difficulty: "Intermediate",
  },
  {
    id: "expert",
    title: "Grandmaster",
    desc: "Performance tuning, sharding concepts, and advanced pipelines.",
    icon: Rocket,
    difficulty: "Expert",
  },
]

export default function LevelsPage() {
  const { unlockedLevels, xp } = useGameStore()

  return (
    <div className="min-h-screen pt-24 px-4 pb-10 bg-background text-foreground flex flex-col items-center">
      <div className="max-w-5xl w-full space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="absolute top-6 right-6 flex items-center space-x-2 bg-accent px-4 py-2 rounded-full border border-border">
             <span className="text-primary font-bold">{xp} XP</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold">Select Difficulty</h1>
          <p className="text-muted-foreground text-lg">
            Choose your current skill level to begin the challenges.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {levels.map((level, i) => {
            const isUnlocked = unlockedLevels.includes(level.id)
            return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={isUnlocked ? `/playground/${level.id}` : "#"}>
                <div
                  className={`relative h-full p-8 rounded-3xl border border-border bg-card/50 backdrop-blur transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
                    isUnlocked ? "hover:border-primary/50" : "opacity-50 cursor-not-allowed grayscale"
                  }`}
                >
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-3xl z-10">
                      <Lock className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center space-y-6">
                    <div className={`p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform`}>
                      <level.icon className="w-10 h-10" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">
                        {level.title}
                      </h3>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-background border border-border text-muted-foreground">
                        {level.difficulty}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm">
                      {level.desc}
                    </p>
                    
                    {isUnlocked && (
                      <Button className="w-full mt-4" variant="secondary">
                        Enter Zone
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
          )}
        </div>
      </div>
    </div>
  )
}
