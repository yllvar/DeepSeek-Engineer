import fs from "fs/promises"
import path from "path"
import type { FileToCreate, FileToEdit } from "@/types/assistant"
import { createPatch } from "diff"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export class FileOperations {
  async readLocalFile(filePath: string): Promise<string> {
    try {
      const stats = await fs.stat(filePath)

      if (!stats.isFile()) {
        throw new Error("Not a valid file")
      }

      if (stats.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 10MB limit")
      }

      return await fs.readFile(filePath, "utf-8")
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      throw error
    }
  }

  async isDirectory(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath)
      return stats.isDirectory()
    } catch (error) {
      return false
    }
  }

  async readDirectory(dirPath: string, recursive = false): Promise<string[]> {
    const files = await fs.readdir(dirPath, { withFileTypes: true })
    const result: string[] = []

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name)
      if (file.isDirectory() && recursive) {
        result.push(...(await this.readDirectory(fullPath, recursive)))
      } else if (file.isFile()) {
        result.push(fullPath)
      }
    }

    return result
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
      const originalContent = await this.readLocalFile(fileEdit.path)
      let newContent = originalContent

      for (const replacement of fileEdit.replacements) {
        newContent = newContent.replace(replacement.oldSnippet, replacement.newSnippet)
      }

      const patch = createPatch(fileEdit.path, originalContent, newContent)
      await fs.writeFile(fileEdit.path, newContent)
      return patch
    } catch (error) {
      console.error(`Error applying diff edit to ${fileEdit.path}:`, error)
      throw error
    }
  }

  async executeCommand(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(command)
      if (stderr) {
        console.error(`Command execution error: ${stderr}`)
      }
      return stdout
    } catch (error) {
      console.error(`Error executing command: ${command}`, error)
      throw error
    }
  }
}

