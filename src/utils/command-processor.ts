import type { FileOperations } from "./file-operations"
import type { ConversationManager } from "./conversation-manager"

export class CommandProcessor {
  private fileOps: FileOperations
  private conversationManager: ConversationManager

  constructor(fileOps: FileOperations, conversationManager: ConversationManager) {
    this.fileOps = fileOps
    this.conversationManager = conversationManager
  }

  async processCommand(command: string): Promise<string> {
    const [cmd, ...args] = command.split(" ")

    switch (cmd) {
      case "/add":
        return this.addFile(args.join(" "))
      case "/ls":
        return this.listDirectory(args.join(" "))
      case "/cat":
        return this.catFile(args.join(" "))
      case "/exec":
        return this.executeCommand(args.join(" "))
      default:
        throw new Error(`Unknown command: ${cmd}`)
    }
  }

  private async addFile(path: string): Promise<string> {
    if (await this.fileOps.isDirectory(path)) {
      const files = await this.fileOps.readDirectory(path, true)
      for (const file of files) {
        const content = await this.fileOps.readLocalFile(file)
        this.conversationManager.addFileContext(file, content)
      }
      return `Added ${files.length} files from directory ${path} to context`
    } else {
      const content = await this.fileOps.readLocalFile(path)
      this.conversationManager.addFileContext(path, content)
      return `Added file ${path} to context`
    }
  }

  private async listDirectory(path: string): Promise<string> {
    const files = await this.fileOps.readDirectory(path)
    return files.join("\n")
  }

  private async catFile(path: string): Promise<string> {
    return await this.fileOps.readLocalFile(path)
  }

  private async executeCommand(command: string): Promise<string> {
    // IMPORTANT: This should be used with caution and proper security measures
    return await this.fileOps.executeCommand(command)
  }
}

