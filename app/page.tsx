import React from "react"
import Chat from "@/components/Chat"

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DeepSeek Engineer</h1>
      <Chat />
    </div>
  )
}

