import { type NextRequest, NextResponse } from "next/server"
import { DeepSeekClient } from "@/utils/deepseek-client"
import { FileOperations } from "@/utils/file-operations"
import { ConversationManager } from "@/utils/conversation-manager"
import { CommandProcessor } from "@/utils/command-processor"
import { SYSTEM_PROMPT } from "@/config/system-prompt"

const deepseek = new DeepSeekClient(SYSTEM_PROMPT)
const fileOps = new FileOperations()
const conversationManager = new ConversationManager()
const commandProcessor = new CommandProcessor(fileOps, conversationManager)

export async function POST(req: NextRequest) {
  console.log("API route handler started")
  try {
    const body = await req.json()
    console.log("Received chat request:", JSON.stringify(body))
    const { messages } = body

    if (!Array.isArray(messages)) {
      console.error("Invalid request format: messages is not an array")
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1].content
    console.log("Processing message:", lastMessage)

    if (lastMessage.startsWith("/")) {
      try {
        const result = await commandProcessor.processCommand(lastMessage)
        console.log("Command processed successfully:", result)
        return NextResponse.json({ type: "command", message: result })
      } catch (error) {
        console.error("Command processing error:", error)
        return NextResponse.json(
          { type: "error", message: error instanceof Error ? error.message : "Command processing failed" },
          { status: 400 },
        )
      }
    }

    // Add the user message to conversation history
    conversationManager.addMessage("user", lastMessage)

    try {
      console.log("Sending request to DeepSeekClient")
      const response = await deepseek.streamResponse(conversationManager.getHistory())
      console.log("Received response from DeepSeekClient:", JSON.stringify(response))

      if (response.files) {
        console.log("Processing file operations")
        if (response.files.create) {
          for (const file of response.files.create) {
            await fileOps.createFile(file)
            console.log(`File created: ${file.path}`)
          }
        }
        if (response.files.edit) {
          for (const file of response.files.edit) {
            const patch = await fileOps.applyDiffEdit(file)
            response.response += `\n\nChanges applied to ${file.path}:\n${patch}`
            console.log(`File edited: ${file.path}`)
          }
        }
      }

      if (!response.response) {
        console.warn("No response content received from DeepSeekClient")
        return NextResponse.json({ type: "error", message: "No response content received from AI" }, { status: 500 })
      }

      conversationManager.addMessage("assistant", response.response)
      console.log("Sending chat response:", {
        type: "chat",
        response: response.response,
      })
      return NextResponse.json({
        type: "chat",
        response: response.response,
      })
    } catch (error) {
      console.error("Error processing chat:", error)
      return NextResponse.json(
        {
          type: "error",
          message: error instanceof Error ? error.message : "Failed to process chat message",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in chat handler:", error)
    return NextResponse.json({ type: "error", message: "Internal server error" }, { status: 500 })
  } finally {
    console.log("API route handler finished")
  }
}

