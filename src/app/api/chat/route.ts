import { DeepSeekClient } from "@/server/deepseek-client"
import { FileOperations } from "@/server/file-operations"
import { ConversationManager } from "@/server/conversation-manager"
import { SYSTEM_PROMPT } from "@/config/system-prompt"
import { StreamingTextResponse } from "ai"

const deepseek = new DeepSeekClient(SYSTEM_PROMPT)
const fileOps = new FileOperations()
const conversationManager = new ConversationManager()

export async function POST(req: Request) {
  const { messages, useReasoning = false } = await req.json()
  const lastMessage = messages[messages.length - 1].content

  if (lastMessage.startsWith("/add ")) {
    const path = lastMessage.slice(5)
    try {
      if ((await fs.stat(path)).isDirectory()) {
        const files = await fileOps.readDirectory(path)
        for (const file of files) {
          const content = await fileOps.readLocalFile(file)
          conversationManager.addFileContext(file, content)
        }
      } else {
        const content = await fileOps.readLocalFile(path)
        conversationManager.addFileContext(path, content)
      }
      return new Response(JSON.stringify({ type: "file", message: "File(s) added to context" }))
    } catch (error) {
      return new Response(JSON.stringify({ type: "error", message: "Error reading file(s)" }))
    }
  }

  conversationManager.addMessage("user", lastMessage)
  const response = await deepseek.streamResponse(conversationManager.getHistory(), useReasoning)

  if (response.files) {
    for (const file of response.files) {
      if (file.type === "create") {
        await fileOps.createFile(file)
      } else {
        const diffTable = await fileOps.applyDiffEdit(file)
        response.response += `\n\nChanges applied to ${file.path}:\n${diffTable}`
      }
    }
  }

  conversationManager.addMessage("assistant", response.response)

  // If using reasoning model, include the reasoning process
  if (useReasoning && response.reasoning) {
    response.response = `Reasoning:\n${response.reasoning}\n\nResponse:\n${response.response}`
  }

  return new StreamingTextResponse(
    new ReadableStream({
      start(controller) {
        controller.enqueue(response.response)
        controller.close()
      },
    }),
  )
}

