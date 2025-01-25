import { DeepSeekClient } from "../utils/deepseek-client"
import { FileOperations } from "../utils/file-operations"
import { ConversationManager } from "../utils/conversation-manager"
import { CommandProcessor } from "../utils/command-processor"
import { SYSTEM_PROMPT } from "../config/system-prompt"
import { z } from "zod"
import { createHandler } from "../utils/create-handler"

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

export const POST = createHandler(async (req, res) => {
  const { messages, useReasoning = false } = chatSchema.parse(await req.json())
  const lastMessage = messages[messages.length - 1].content

  if (lastMessage.startsWith("/")) {
    try {
      const result = await commandProcessor.processCommand(lastMessage)
      return res.json({ type: "command", message: result })
    } catch (error) {
      return res.status(400).json({ type: "error", message: error.message })
    }
  }

  conversationManager.addMessage("user", lastMessage)
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

  return res.json(response)
})

