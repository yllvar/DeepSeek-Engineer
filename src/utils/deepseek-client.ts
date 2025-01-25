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
      console.log("Preparing to send request to DeepSeek API")
      const model = useReasoning ? "deepseek-chat" : "deepseek-coder"
      const fullPrompt = `${this.systemPrompt}\n\nContext:\n${this.getSystemContext(history)}`

      console.log("Sending request to DeepSeek API with model:", model)
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

      console.log("Received response from DeepSeek API:", JSON.stringify(response.data, null, 2))

      if (response.data && typeof response.data === "object") {
        if (Array.isArray(response.data.choices) && response.data.choices.length > 0) {
          const content = response.data.choices[0].message?.content
          if (content) {
            try {
              console.log("Parsing content as JSON:", content)
              const parsedContent = JSON.parse(content)
              console.log("Parsed content:", JSON.stringify(parsedContent, null, 2))
              return {
                response: parsedContent.assistant_reply || parsedContent.response || "No response content",
                files:
                  parsedContent.files_to_create || parsedContent.files_to_edit
                    ? {
                        create: parsedContent.files_to_create,
                        edit: parsedContent.files_to_edit,
                      }
                    : undefined,
              }
            } catch (parseError) {
              console.error("Error parsing content as JSON:", parseError)
              return { response: content }
            }
          }
        }
      }

      console.warn("Unexpected response structure:", JSON.stringify(response.data, null, 2))
      return { response: "Unexpected response structure from API" }
    } catch (error) {
      console.error("Error streaming response:", error)
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        if (axiosError.response?.status === 402) {
          throw new Error("DeepSeek API key has insufficient credits or has expired. Please check your account.")
        }
        console.error("Axios error details:", axiosError.response?.data)
      }
      throw error
    }
  }

  private getSystemContext(history: ConversationHistory): string {
    return Array.from(history.fileContext.entries())
      .map(([path, content]) => `File: ${path}\n${content}`)
      .join("\n\n")
  }
}

