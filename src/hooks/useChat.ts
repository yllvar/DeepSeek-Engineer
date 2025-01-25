"use client"

import { useState, useCallback } from "react"
import type { Message } from "@/types/assistant"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = useCallback((value: string) => {
    setInput(value)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!input.trim() || isLoading) return

      setIsLoading(true)
      const userMessage: Message = { role: "user", content: input }

      setMessages((prev) => [...prev, userMessage])
      setInput("")

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Received API response:", data)

        if (data.type === "error") {
          throw new Error(data.message || "Unknown error occurred")
        }

        const assistantMessage: Message = {
          role: "assistant",
          content: data.response || "No response received from the server.",
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Error sending message:", error)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, messages, isLoading],
  )

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
  }
}

