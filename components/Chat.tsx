import type React from "react"
import { useState, useCallback } from "react"
import { useChat } from "../hooks/useChat"

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  const onSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (input.trim()) {
        handleSubmit(e)
      }
    },
    [input, handleSubmit],
  )

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg ${message.role === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"} max-w-[70%]`}
          >
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={onSend} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type a message or /add path/to/file..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" disabled={isLoading}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

