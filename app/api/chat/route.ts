import { type NextRequest, NextResponse } from "next/server"
import { DeepSeekClient } from "@/utils/deepseek-client"
import { FileOperations } from "@/utils/file-operations"
import { ConversationManager } from "@/utils/conversation-manager"
import { CommandProcessor } from "@/utils/command-processor"
import { SYSTEM_PROMPT } from "@/config/system-prompt"
import { z } from "zod"

const deepseek = new DeepSeekClient(SYSTEM_PROMPT)
const fileOps = new FileOperations()
const conversationManager = new ConversationManager()
const commandProcessor = new CommandProcessor(fileOps, conversationManager)

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  useReasoning: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, useReasoning = false } = chatSchema.parse(body)
    const lastMessage = messages[messages.length - 1].content

    if (lastMessage.startsWith("/")) {
      try {
        const result = await commandProcessor.processCommand(lastMessage)
        return NextResponse.json({ type: "command", message: result })
      } catch (error) {
        return NextResponse.json({ type: "error", message: error.message }, { status: 400 })
      }
    }

    conversationManager.addMessage("user", lastMessage)

    try {
      const response = await deepseek.streamResponse(conversationManager.getHistory(), useReasoning)

      if (response.files) {
        for (const file of response.files) {
          if (file.type === "create") {
            await fileOps.createFile(file)
          } else {
            const patch = await fileOps.applyDiffEdit(file)
            response.response += `\n\nChanges applied to ${file.path}:\n${patch}`
          }
        }
      }

      conversationManager.addMessage("assistant", response.response)

      if (useReasoning && response.reasoning) {
        response.response = `Reasoning:\n${response.reasoning}\n\nResponse:\n${response.response}`
      }

      return NextResponse.json(response)
    } catch (error) {
      if (error instanceof Error && error.message.includes("DeepSeek API key")) {
        return NextResponse.json({ type: "error", message: error.message }, { status: 402 })
      }
      throw error // Re-throw other errors to be caught by the outer try-catch
    }
  } catch (error) {
    console.error("Error in chat handler:", error)
    return NextResponse.json(
      { type: "error", message: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    )
  }
}

