import { diffLines } from "diff"
import chalk from "chalk"

export function createDiffTable(oldContent: string, newContent: string): string {
  const differences = diffLines(oldContent, newContent)

  return differences
    .map((part) => {
      if (part.added) {
        return chalk.green(`+ ${part.value}`)
      }
      if (part.removed) {
        return chalk.red(`- ${part.value}`)
      }
      return ` ${part.value}`
    })
    .join("")
}

