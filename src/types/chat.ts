export interface AgentStep {
  type: 'plan' | 'tool_call' | 'tool_result' | 'subagent';
  title: string;
  detail?: string;
  status: 'running' | 'completed' | 'failed';
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentSteps?: AgentStep[];
  providerUsed?: string;
  modelUsed?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
  isPinned?: boolean;
}

export interface BYOKConfig {
  service: string;       // e.g., 'OpenRouter', 'Google AI', 'Anthropic', 'OpenAI', 'Custom'
  baseUrl: string;       // e.g., 'https://openrouter.ai/api/v1'
  apiKey: string;        // User-provided API Key
  defaultModel: string;  // e.g., 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-2.5-flash'
  enabled: boolean;
}
