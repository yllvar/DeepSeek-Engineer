import { useState, useCallback } from "react"
import type { Message } from "../types/assistant"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = useCallback((text: string) => {
    setInput(text)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim()) return

      setIsLoading(true)
      const userMessage: Message = { role: "user", content: input }
      setMessages((prevMessages) => [...prevMessages, userMessage])
      setInput("")

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch response")
        }

        const data = await response.json()
        const assistantMessage: Message = { role: "assistant", content: data.response }
        setMessages((prevMessages) => [...prevMessages, assistantMessage])
      } catch (error) {
        console.error("Error sending message:", error)
        // Handle error (e.g., show an error message to the user)
      } finally {
        setIsLoading(false)
      }
    },
    [input, messages],
  )

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  }
}

