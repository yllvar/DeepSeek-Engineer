import type { ConversationHistory, Message } from "../types/assistant"

export class ConversationManager {
  private history: ConversationHistory = {
    messages: [],
    fileContext: new Map(),
  }

  addMessage(role: Message["role"], content: string) {
    this.history.messages.push({ role, content })
  }

  addFileContext(path: string, content: string) {
    this.history.fileContext.set(path, content)
    this.addMessage("system", `File contents of ${path}:\n${content}`)
  }

  getHistory(): ConversationHistory {
    return this.history
  }

  clearHistory() {
    this.history = {
      messages: [],
      fileContext: new Map(),
    }
  }

  getSystemContext(): string {
    return Array.from(this.history.fileContext.entries())
      .map(([path, content]) => `File: ${path}\n${content}`)
      .join("\n\n")
  }
}

