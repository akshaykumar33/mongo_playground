import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ChallengeId = string

interface GameState {
    xp: number
    completedChallenges: ChallengeId[]
    unlockedLevels: string[]
    currentStreak: number
    lastLoginDate: string | null

    addXp: (amount: number) => void
    completeChallenge: (id: ChallengeId, levelId: string) => void
    unlockLevel: (levelId: string) => void
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            xp: 0,
            completedChallenges: [],
            unlockedLevels: ["basic"], // Basic unlocked by default
            currentStreak: 0,
            lastLoginDate: null,

            addXp: (amount) => set((state) => ({ xp: state.xp + amount })),

            completeChallenge: (id, levelId) => set((state) => {
                if (state.completedChallenges.includes(id)) return state // Already completed

                // Add XP for first completion
                const newXp = state.xp + 100
                const newCompleted = [...state.completedChallenges, id]

                // Logic to unlock next level could go here
                // For simplicity: if 2 challenges completed in "basic", unlock "intermediate"
                let unlocked = state.unlockedLevels
                // Example check: (This should be more robust in real app)
                if (levelId === "basic" && newCompleted.length >= 2 && !state.unlockedLevels.includes("intermediate")) {
                    unlocked = [...unlocked, "intermediate"]
                }

                return {
                    completedChallenges: newCompleted,
                    xp: newXp,
                    unlockedLevels: unlocked
                }
            }),

            unlockLevel: (levelId) => set((state) => ({
                unlockedLevels: state.unlockedLevels.includes(levelId)
                    ? state.unlockedLevels
                    : [...state.unlockedLevels, levelId]
            })),
        }),
        {
            name: 'mongo-playground-storage',
        }
    )
)
