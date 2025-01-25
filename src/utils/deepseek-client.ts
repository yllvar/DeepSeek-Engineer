import axios, { type AxiosError } from "axios"
import type { AssistantResponse, ConversationHistory } from "@/types/assistant"
import { RateLimiter } from "limiter"

export class DeepSeekClient {
  private apiKey: string
  private baseUrl: string
  private systemPrompt: string
  private rateLimiter: RateLimiter

  constructor(systemPrompt: string) {
    this.apiKey = process.env.DEEPSEEK_API_KEY || ""
    this.baseUrl = "https://api.deepseek.com/v1"
    this.systemPrompt = systemPrompt
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 50,
      interval: "minute",
    })
  }

  async streamResponse(history: ConversationHistory, useReasoning = false): Promise<AssistantResponse> {
    await this.rateLimiter.removeTokens(1)
    try {
      const model = useReasoning ? "deepseek-chat" : "deepseek-coder"
      const fullPrompt = `${this.systemPrompt}\n\nContext:\n${this.getSystemContext(history)}`

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: model,
          messages: [
            { role: "system", content: fullPrompt },
            ...history.messages.map((msg) => ({ role: msg.role, content: msg.content })),
          ],
          stream: false,
          max_tokens: 4096,
          temperature: 0.7,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      )

      return response.data as AssistantResponse
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        if (axiosError.response?.status === 402) {
          throw new Error("DeepSeek API key has insufficient credits or has expired. Please check your account.")
        }
      }
      console.error("Error streaming response:", error)
      throw error
    }
  }

  private getSystemContext(history: ConversationHistory): string {
    return Array.from(history.fileContext.entries())
      .map(([path, content]) => `File: ${path}\n${content}`)
      .join("\n\n")
  }
}

