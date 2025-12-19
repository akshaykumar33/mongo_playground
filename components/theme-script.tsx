"use client"

import { useEffect } from "react"

export function ThemeScript() {
  useEffect(() => {
    const savedFlavor = localStorage.getItem("theme-flavor")
    if (savedFlavor) {
      document.documentElement.setAttribute("data-theme", savedFlavor)
    }
  }, [])

  return null
}
