"use client"

import { useMonaco } from "@monaco-editor/react"
import { useEffect } from "react"
import { collections } from "@/data/collections"

export function EditorConfig() {
  const monaco = useMonaco()

  useEffect(() => {
    if (!monaco) return

    // Register completion item provider
    const disposable = monaco.languages.registerCompletionItemProvider("javascript", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const suggestions = [
          // Collections
          ...Object.keys(collections).map(name => ({
            label: `db.${name}`,
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: `db.${name}`,
            detail: "Collection",
            range,
          })),
          // Common Methods
          {
            label: "find",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "find({})",
            detail: "Find documents",
            range,
          },
          {
            label: "aggregate",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "aggregate([])",
            detail: "Aggregation Pipeline",
            range,
          },
          {
            label: "sort",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "sort({})",
            detail: "Sort results",
            range,
          },
          // Operators
          ...["$gt", "$lt", "$gte", "$lte", "$in", "$nin", "$eq", "$ne"].map(op => ({
            label: op,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: `'${op}': `,
            detail: "Comparison Operator",
            range,
          })),
          ...["$sum", "$avg", "$group", "$match", "$project", "$sort"].map(op => ({
            label: op,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: op,
            detail: "Aggregation Operator",
            range,
          }))
        ]

        return { suggestions }
      }
    })

    return () => disposable.dispose()
  }, [monaco])

  return null
}
