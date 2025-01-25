import React, { useState } from "react"
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native"
import { useChat } from "ai/react"

export default function ChatScreen() {
  const [fileCommand, setFileCommand] = useState("")
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  const onSend = (e: any) => {
    e.preventDefault()
    if (input.trim()) {
      handleSubmit(e)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.message, message.role === "user" ? styles.userMessage : styles.assistantMessage]}
          >
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={handleInputChange}
          placeholder="Type a message or /add path/to/file..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  message: {
    padding: 12,
    marginVertical: 4,
    maxWidth: "80%",
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  assistantMessage: {
    backgroundColor: "#E9E9EB",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9E9EB",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

