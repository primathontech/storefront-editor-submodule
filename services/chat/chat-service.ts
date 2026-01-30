import {
  ChatMessage,
  ChatMessageFactory,
  Conversation,
  createConversation,
} from "../../models/chat-types";
import {
  ConversationRepository,
  LocalStorageConversationRepository,
} from "./conversation-repository";
import { ClaudeClient, LLMClient } from "./llm-client";

export interface SendMessageParams {
  conversationId: string;
  userInput: string;
  currentHtml: string;
  imageFile?: File | null;
}

export interface SendMessageResult {
  conversation: Conversation;
  assistant: ChatMessage;
  html: string;
}

/**
 * Orchestrates chat flow:
 * - Load or create conversation
 * - Append user message
 * - Call LLM client with full context
 * - Append assistant message
 * - Persist conversation
 */
export class ChatService {
  private readonly repository: ConversationRepository;
  private readonly llmClient: LLMClient;

  constructor(options?: {
    repository?: ConversationRepository;
    llmClient?: LLMClient;
  }) {
    this.repository =
      options?.repository ?? new LocalStorageConversationRepository();
    this.llmClient = options?.llmClient ?? new ClaudeClient();
  }

  getConversation(conversationId: string): Conversation {
    return (
      this.repository.get(conversationId) ??
      createConversation(conversationId, [])
    );
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const { conversationId, userInput, currentHtml, imageFile } = params;

    let conversation =
      this.repository.get(conversationId) ??
      createConversation(conversationId, []);

    const userMessage = ChatMessageFactory.user(userInput);
    conversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage],
    };

    const { assistant, html } = await this.llmClient.generateResponse({
      context: conversation.messages,
      currentHtml,
      imageFile,
    });

    const updatedConversation: Conversation = {
      ...conversation,
      messages: [...conversation.messages, assistant],
    };

    this.repository.save(updatedConversation);

    return {
      conversation: updatedConversation,
      assistant,
      html,
    };
  }
}

// Shared chat service instance for HTML generation.
export const htmlChatService = new ChatService();
