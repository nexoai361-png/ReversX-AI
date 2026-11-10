import { BYOKConfig, AgentStep } from '../types/chat';

export interface DeepAgentResponse {
  text: string;
  steps?: AgentStep[];
  provider?: string;
  model?: string;
}

export async function generateChatResponse(
  prompt: string,
  byokConfig?: BYOKConfig | null,
  enableAgent: boolean = true
): Promise<DeepAgentResponse> {
  const res = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      byok: byokConfig?.enabled ? {
        service: byokConfig.service,
        baseUrl: byokConfig.baseUrl,
        apiKey: byokConfig.apiKey,
        defaultModel: byokConfig.defaultModel,
      } : undefined,
      enableAgent,
      systemInstruction: 'You are ReversX, a smart AI assistant powered by DeepAgents autonomous architecture. Use structured thinking, clean Markdown, code snippets, and LaTeX for mathematical formulas (use $...$ for inline and $$...$$ for blocks).'
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    text: data.text || 'I received your request!',
    steps: data.steps || [],
    provider: data.provider,
    model: data.model,
  };
}
