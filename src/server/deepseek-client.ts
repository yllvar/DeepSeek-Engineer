import { createDeepSeek } from "@ai-sdk/deepseek"
import type { AssistantResponse, ConversationHistory } from "../types/assistant"

export class DeepSeekClient {
  private client: ReturnType<typeof createDeepSeek>
  private systemPrompt: string

  constructor(systemPrompt: string) {
    this.client = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    })
    this.systemPrompt = systemPrompt
  }

  async streamResponse(history: ConversationHistory, useReasoning = false) {
    try {
      const model = useReasoning ? "deepseek-reasoner" : "deepseek-chat"
      const fullPrompt = `${this.systemPrompt}\n\nContext:\n${history.getSystemContext()}`

      const response = await this.client.streamText({
        model,
        prompt: history.messages[history.messages.length - 1].content,
        system: fullPrompt,
      })

      // Parse the response as JSON
      const jsonResponse = JSON.parse(response.text) as AssistantResponse
      return jsonResponse
    } catch (error) {
      console.error("Error streaming response:", error)
      throw error
    }
  }
}

