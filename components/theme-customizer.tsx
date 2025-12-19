"use client"

import * as React from "react"
import { Check, Paintbrush } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"

const themes = [
  { name: "Zinc", value: "zinc", color: "bg-zinc-500" },
  { name: "Blue", value: "blue", color: "bg-blue-500" },
  { name: "Green", value: "green", color: "bg-green-500" },
  { name: "Rose", value: "rose", color: "bg-rose-500" },
  { name: "Orange", value: "orange", color: "bg-orange-500" },
  { name: "Neon", value: "neon", color: "bg-purple-500" },
]

export function ThemeCustomizer() {
  const [flavor, setFlavor] = React.useState("zinc")

  // On mount, check if there's a stored theme
  React.useEffect(() => {
    const savedFlavor = localStorage.getItem("theme-flavor")
    if (savedFlavor) {
      setFlavor(savedFlavor)
      document.documentElement.setAttribute("data-theme", savedFlavor)
    }
  }, [])

  const handleSetFlavor = (newFlavor: string) => {
    setFlavor(newFlavor)
    localStorage.setItem("theme-flavor", newFlavor)
    // We set a data attribute on the HTML element which our globals.css matches
    document.documentElement.setAttribute("data-theme", newFlavor)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Paintbrush className="h-4 w-4 text-primary" />
          <span className="sr-only">Customize theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => handleSetFlavor(t.value)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${t.color}`} />
              <span>{t.name}</span>
            </div>
            {flavor === t.value && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
