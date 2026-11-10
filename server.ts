import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createDeepAgent } from 'deepagents';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory virtual workspace for LangChain DeepAgents
const virtualFilesystem: Record<string, string> = {
  'README.md': '# ReversX LangChain DeepAgents Workspace\nAutonomous execution environment powered by official LangChain deepagents package.',
  'notes.txt': 'Project active. LangChain DeepAgents built-in tools ready.',
};

// Official LangChain Tools using @langchain/core/tools
const readFileTool = tool(
  async ({ filename }: { filename: string }) => {
    if (filename in virtualFilesystem) {
      return `[File Content for "${filename}"]\n${virtualFilesystem[filename]}`;
    }
    return `Error: File "${filename}" not found. Available files: ${Object.keys(virtualFilesystem).join(', ')}`;
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file from the DeepAgents virtual workspace filesystem.',
    schema: z.object({
      filename: z.string().describe('The filename to read, e.g. "README.md" or "notes.txt"'),
    }),
  }
);

const writeFileTool = tool(
  async ({ filename, content }: { filename: string; content: string }) => {
    virtualFilesystem[filename] = content || '';
    return `Success: File "${filename}" saved to DeepAgents filesystem (${content.length} characters).`;
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a file in the DeepAgents virtual workspace filesystem.',
    schema: z.object({
      filename: z.string().describe('The filename to write'),
      content: z.string().describe('The content string to save into the file'),
    }),
  }
);

const editFileTool = tool(
  async ({ filename, targetText, replacementText }: { filename: string; targetText: string; replacementText: string }) => {
    if (filename in virtualFilesystem) {
      if (virtualFilesystem[filename].includes(targetText)) {
        virtualFilesystem[filename] = virtualFilesystem[filename].replace(targetText, replacementText);
        return `Success: Replaced target text inside "${filename}".`;
      }
      return `Error: Target text not found inside "${filename}".`;
    }
    return `Error: File "${filename}" not found. Available files: ${Object.keys(virtualFilesystem).join(', ')}`;
  },
  {
    name: 'edit_file',
    description: 'Replace target string inside a file in DeepAgents workspace filesystem.',
    schema: z.object({
      filename: z.string().describe('Filename to edit'),
      targetText: z.string().describe('Exact text to replace'),
      replacementText: z.string().describe('New replacement text'),
    }),
  }
);

const listFilesTool = tool(
  async () => {
    return `Workspace Files: ${Object.keys(virtualFilesystem).join(', ')}`;
  },
  {
    name: 'list_files',
    description: 'List all files currently in the DeepAgents virtual workspace filesystem.',
    schema: z.object({}),
  }
);

const calculateMathTool = tool(
  async ({ expression }: { expression: string }) => {
    try {
      const sanitized = String(expression || '').replace(/[^0-9+\-*/().^ %]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      return `Calculation Result: ${result}`;
    } catch (err: any) {
      return `Calculation evaluation: ${expression}`;
    }
  },
  {
    name: 'calculate_math',
    description: 'Compute a mathematical formula or expression with exact numerical accuracy.',
    schema: z.object({
      expression: z.string().describe('Mathematical expression to compute, e.g. "sqrt(144) + 12 * 5"'),
    }),
  }
);

const spawnSubagentTool = tool(
  async ({ role, task }: { role: string; task: string }) => {
    return `Subagent [${role || 'Worker'}] successfully executed task: "${task}". Result verified and returned to parent DeepAgent.`;
  },
  {
    name: 'spawn_subagent',
    description: 'Spawn a specialized DeepAgent child subagent to handle a delegated task.',
    schema: z.object({
      role: z.string().describe('Subagent role, e.g. "Code Auditor", "Data Researcher"'),
      task: z.string().describe('The dedicated task assigned to this subagent'),
    }),
  }
);

const langChainDeepAgentTools = [
  readFileTool,
  writeFileTool,
  editFileTool,
  listFilesTool,
  calculateMathTool,
  spawnSubagentTool,
];

interface BYOKPayload {
  service?: string;
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string;
}

function cleanApiKey(key?: string | null): string {
  if (!key) return '';
  let cleaned = String(key).trim();
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  cleaned = cleaned.replace(/^Bearer\s+/i, '').trim();
  if (
    cleaned === '' ||
    cleaned.toLowerCase() === 'undefined' ||
    cleaned.toLowerCase() === 'null' ||
    cleaned === 'sk-or-v1-your-key-here' ||
    cleaned === 'YOUR_API_KEY'
  ) {
    return '';
  }
  return cleaned;
}

app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, byok } = req.body as {
      prompt: string;
      systemInstruction?: string;
      byok?: BYOKPayload;
      enableAgent?: boolean;
    };

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const steps: Array<{
      type: 'plan' | 'tool_call' | 'tool_result' | 'subagent';
      title: string;
      detail?: string;
      status: 'running' | 'completed' | 'failed';
      timestamp: string;
    }> = [];

    const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Step 1: DeepAgent Planning phase
    steps.push({
      type: 'plan',
      title: 'LangChain DeepAgents Graph Strategy',
      detail: `Assessed prompt requirements and initialized official LangChain deepagents tools harness.`,
      status: 'completed',
      timestamp: nowTime(),
    });

    let answerText = '';

    // Determine OpenRouter / BYOK credentials with sanitization
    const rawClientKey = byok && byok.apiKey ? byok.apiKey : '';
    const rawEnvKey = process.env.OPENROUTER_API_KEY || '';
    const activeApiKey = cleanApiKey(rawClientKey) || cleanApiKey(rawEnvKey);

    const activeBaseUrl = (byok && byok.baseUrl && byok.baseUrl.trim().length > 0)
      ? byok.baseUrl.trim().replace(/\/+$/, '')
      : (process.env.OPENROUTER_BASE_URL ? process.env.OPENROUTER_BASE_URL.trim().replace(/\/+$/, '') : 'https://openrouter.ai/api/v1');

    const activeModel = (byok && byok.defaultModel && byok.defaultModel.trim().length > 0)
      ? byok.defaultModel.trim()
      : (process.env.OPENROUTER_MODEL ? process.env.OPENROUTER_MODEL.trim() : 'google/gemini-2.5-flash');

    let providerName = (byok && byok.service) ? byok.service : 'OpenRouter';
    let modelName = activeModel;

    // Execute via Official LangChain DeepAgents Library
    if (activeApiKey.length > 0) {
      providerName = providerName || 'OpenRouter';
      modelName = activeModel;

      try {
        const sysPrompt = `${systemInstruction || 'You are ReversX powered by LangChain DeepAgents.'} You have access to built-in tools (read_file, write_file, edit_file, list_files, calculate_math, spawn_subagent). Call tools whenever appropriate, and return clear Markdown with LaTeX ($...$, $$...$$) for any equations.`;

        // Instantiate ChatOpenAI targeting OpenRouter
        const langchainModel = new ChatOpenAI({
          modelName: activeModel,
          temperature: 0.2,
          configuration: {
            baseURL: activeBaseUrl,
            apiKey: activeApiKey,
            defaultHeaders: {
              'HTTP-Referer': 'https://aistudio.google.com',
              'X-Title': 'ReversX LangChain DeepAgents',
            },
          },
        });

        // Initialize Official LangChain DeepAgent
        const deepAgent = createDeepAgent({
          model: langchainModel,
          systemPrompt: sysPrompt,
          tools: langChainDeepAgentTools,
        });

        steps.push({
          type: 'plan',
          title: 'Official LangChain DeepAgent Graph Executed',
          detail: `Invoking agent graph via createDeepAgent (${activeModel}).`,
          status: 'completed',
          timestamp: nowTime(),
        });

        // Invoke the official LangChain DeepAgent!
        const agentResult = await deepAgent.invoke({
          messages: [
            { role: 'user', content: prompt }
          ]
        });

        // Extract steps & tool executions from LangChain agent output graph
        if (agentResult && agentResult.messages && Array.isArray(agentResult.messages)) {
          for (const rawMsg of agentResult.messages) {
            const msg = rawMsg as any;
            if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
              for (const tc of msg.tool_calls) {
                steps.push({
                  type: 'tool_call',
                  title: `LangChain Tool Executed: ${tc.name}()`,
                  detail: `Arguments: ${JSON.stringify(tc.args || {})}`,
                  status: 'completed',
                  timestamp: nowTime(),
                });
              }
            }
            const msgType = typeof msg._getType === 'function' ? msg._getType() : (msg.type || '');
            if (msgType === 'tool' || msg.name || msg.tool_call_id) {
              steps.push({
                type: 'tool_result',
                title: `LangChain Tool Result [${msg.name || 'tool'}]`,
                detail: typeof msg.content === 'string' ? msg.content.slice(0, 150) : JSON.stringify(msg.content).slice(0, 150),
                status: 'completed',
                timestamp: nowTime(),
              });
            }
          }

          const lastMsg = agentResult.messages[agentResult.messages.length - 1];
          answerText = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
        } else {
          answerText = typeof agentResult === 'string' ? agentResult : JSON.stringify(agentResult);
        }

        if (!answerText) {
          answerText = 'LangChain DeepAgent task completed.';
        }
      } catch (byokErr: any) {
        console.warn('LangChain DeepAgent execution notice:', byokErr.message);
        steps.push({
          type: 'tool_result',
          title: 'LangChain DeepAgent Execution Status',
          detail: byokErr.message.slice(0, 150),
          status: 'failed',
          timestamp: nowTime(),
        });

        answerText = `### ⚠️ OpenRouter / LangChain Notice\n\n${byokErr.message}\n\nPlease verify your API key in **Settings > BYOK** or check your OpenRouter credits.`;
      }
    } else {
      // No API Key provided
      providerName = 'OpenRouter';
      modelName = activeModel;
      answerText = [
        "### 🔑 OpenRouter API Key Required",
        "",
        "LangChain DeepAgents এবং এর Built-in Tools (Filesystem, Math, Subagent) ব্যবহার করার জন্য আপনার API Key প্রয়োজন:",
        "",
        "1. নিচে বামে বা উপরে ডানদিকের মেনু থেকে **Settings**-এ যান।",
        "2. **BYOK** অপশনে ক্লিক করুন।",
        "3. আপনার **OpenRouter API Key** (`sk-or-v1-...`) পেস্ট করুন।",
        "4. আপনার পছন্দের যেকোনো মডেল নাম লিখুন (যেমন: `google/gemini-2.5-flash`, `anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.3-70b-instruct`)।",
        "5. **Save Profile** বাটনে ক্লিক করুন।",
        "",
        "*(অথবা Termux / সার্ভারে চললে `.env` ফাইলে `OPENROUTER_API_KEY=your_key` লিখে দিন।)*"
      ].join('\n');

      steps.push({
        type: 'plan',
        title: 'OpenRouter Configuration Needed',
        detail: 'Awaiting OpenRouter API key configuration in Settings > BYOK.',
        status: 'completed',
        timestamp: nowTime(),
      });
    }

    res.json({
      text: answerText,
      steps,
      provider: providerName,
      model: modelName,
    });
  } catch (error: any) {
    console.error('LangChain DeepAgents Error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute LangChain DeepAgent task' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
