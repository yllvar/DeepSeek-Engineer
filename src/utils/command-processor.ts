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
    console.log(`Attempting to add file: ${path}`)
    try {
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
    } catch (error) {
      console.error(`Error adding file: ${path}`, error)
      throw new Error(`Failed to add file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async listDirectory(path: string): Promise<string> {
    console.log(`Attempting to list directory: ${path}`)
    try {
      const files = await this.fileOps.readDirectory(path)
      return files.join("\n")
    } catch (error) {
      console.error(`Error listing directory: ${path}`, error)
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async catFile(path: string): Promise<string> {
    console.log(`Attempting to read file: ${path}`)
    try {
      return await this.fileOps.readLocalFile(path)
    } catch (error) {
      console.error(`Error reading file: ${path}`, error)
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async executeCommand(command: string): Promise<string> {
    console.log(`Attempting to execute command: ${command}`)
    try {
      return await this.fileOps.executeCommand(command)
    } catch (error) {
      console.error(`Error executing command: ${command}`, error)
      throw new Error(`Failed to execute command: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

