import { promises as fs } from "fs"
import path from "path"
import type { FileToCreate, FileToEdit } from "../types/assistant"
import { createDiffTable } from "../utils/diff"

export class FileOperations {
  async readLocalFile(filePath: string): Promise<string> {
    try {
      const stats = await fs.stat(filePath)

      // Skip binary files
      if (!stats.isFile() || path.extname(filePath) === ".exe") {
        throw new Error("Not a valid text file")
      }

      return await fs.readFile(filePath, "utf-8")
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      throw error
    }
  }

  async readDirectory(dirPath: string): Promise<string[]> {
    const files = await fs.readdir(dirPath, { withFileTypes: true })
    const textFiles = files
      .filter((file) => file.isFile() && !file.name.startsWith("."))
      .map((file) => path.join(dirPath, file.name))
    return textFiles
  }

  async createFile(fileInfo: FileToCreate): Promise<void> {
    try {
      const dirPath = path.dirname(fileInfo.path)
      await fs.mkdir(dirPath, { recursive: true })
      await fs.writeFile(fileInfo.path, fileInfo.content)
    } catch (error) {
      console.error(`Error creating file ${fileInfo.path}:`, error)
      throw error
    }
  }

  async applyDiffEdit(fileEdit: FileToEdit): Promise<string> {
    try {
      let content = await this.readLocalFile(fileEdit.path)
      const originalContent = content

      for (const replacement of fileEdit.replacements) {
        content = content.replace(replacement.oldSnippet, replacement.newSnippet)
      }

      // Generate diff table before applying changes
      const diffTable = createDiffTable(originalContent, content)

      await fs.writeFile(fileEdit.path, content)
      return diffTable
    } catch (error) {
      console.error(`Error applying diff edit to ${fileEdit.path}:`, error)
      throw error
    }
  }
}

