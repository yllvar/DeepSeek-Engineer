export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ConversationHistory {
  messages: Message[]
  fileContext: Map<string, string>
}

export interface FileToCreate {
  path: string
  content: string
}

export interface FileToEdit {
  path: string
  replacements: {
    oldSnippet: string
    newSnippet: string
  }[]
}

export interface AssistantResponse {
  response: string
  files?: {
    create?: FileToCreate[]
    edit?: FileToEdit[]
  }
}

