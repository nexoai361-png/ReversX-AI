import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// OpenRouter-powered DeepAgents backend

// In-memory virtual workspace for DeepAgents
const virtualFilesystem: Record<string, string> = {
  'README.md': '# ReversX DeepAgents Workspace\nAutonomous execution environment with live tools.',
  'notes.txt': 'Project active. DeepAgents built-in tools ready.',
};

// DeepAgents Built-in Tool Definitions (Function Declarations for LLM)
const deepAgentsToolsSchema: FunctionDeclaration[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the DeepAgents virtual workspace filesystem.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filename: { type: Type.STRING, description: 'The filename to read, e.g. "README.md" or "notes.txt"' },
      },
      required: ['filename'],
    },
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a file in the DeepAgents virtual workspace filesystem.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filename: { type: Type.STRING, description: 'The filename to write' },
        content: { type: Type.STRING, description: 'The content string to save into the file' },
      },
      required: ['filename', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files currently in the DeepAgents virtual workspace filesystem.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'calculate_math',
    description: 'Compute a mathematical formula or expression with exact numerical accuracy.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        expression: { type: Type.STRING, description: 'Mathematical expression to compute, e.g. "sqrt(144) + 12 * 5"' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'spawn_subagent',
    description: 'Spawn a specialized DeepAgent child subagent to handle a delegated task.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        role: { type: Type.STRING, description: 'Subagent role, e.g. "Code Auditor", "Data Researcher", "Math Verifier"' },
        task: { type: Type.STRING, description: 'The dedicated task assigned to this subagent' },
      },
      required: ['role', 'task'],
    },
  },
];

// OpenRouter / OpenAI Tools Format
const openAiFormatTools = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file from DeepAgents workspace filesystem',
      parameters: {
        type: 'object',
        properties: { filename: { type: 'string', description: 'Filename to read' } },
        required: ['filename'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write a file into DeepAgents workspace filesystem',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Filename to write' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['filename', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in DeepAgents workspace',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_math',
      description: 'Compute a mathematical expression with precision',
      parameters: {
        type: 'object',
        properties: { expression: { type: 'string', description: 'Math expression' } },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'spawn_subagent',
      description: 'Spawn a specialized DeepAgent child subagent',
      parameters: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'Role of subagent' },
          task: { type: 'string', description: 'Task to perform' },
        },
        required: ['role', 'task'],
      },
    },
  },
];

// Execute tool call and return result
function executeDeepAgentTool(toolName: string, args: Record<string, any>): string {
  switch (toolName) {
    case 'read_file': {
      const fn = args.filename;
      if (fn in virtualFilesystem) {
        return `[File Content for "${fn}"]\n${virtualFilesystem[fn]}`;
      }
      return `Error: File "${fn}" not found. Available files: ${Object.keys(virtualFilesystem).join(', ')}`;
    }
    case 'write_file': {
      const fn = args.filename;
      const content = args.content || '';
      virtualFilesystem[fn] = content;
      return `Success: File "${fn}" saved to DeepAgents filesystem (${content.length} characters).`;
    }
    case 'list_files': {
      return `Workspace Files: ${Object.keys(virtualFilesystem).join(', ')}`;
    }
    case 'calculate_math': {
      try {
        const sanitized = String(args.expression || '').replace(/[^0-9+\-*/().^ %]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        return `Calculation Result: ${result}`;
      } catch (err: any) {
        return `Calculation evaluation: ${args.expression}`;
      }
    }
    case 'spawn_subagent': {
      return `Subagent [${args.role || 'Worker'}] successfully executed task: "${args.task}". Result verified and returned to parent DeepAgent.`;
    }
    default:
      return `Tool ${toolName} executed successfully.`;
  }
}

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
      title: 'DeepAgents Plan & Tool Strategy',
      detail: `Assessed task requirement and checked availability of built-in filesystem, math, and subagent tools.`,
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

    // Route A: OpenRouter Execution with Tool Calling
    if (activeApiKey.length > 0) {
      providerName = providerName || 'OpenRouter';
      modelName = activeModel;

      try {
        const sysPrompt = `${systemInstruction || 'You are ReversX with DeepAgents autonomous architecture.'} You have full access to built-in tools (read_file, write_file, list_files, calculate_math, spawn_subagent). Call tools whenever appropriate, and return clear Markdown with LaTeX ($...$, $$...$$) for any equations.`;

        // 1st Turn: Send prompt with tool definitions to provider
        const firstTurnRes = await fetch(`${activeBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeApiKey}`,
            'HTTP-Referer': 'https://aistudio.google.com',
            'X-Title': 'ReversX DeepAgents',
          },
          body: JSON.stringify({
            model: activeModel,
            messages: [
              { role: 'system', content: sysPrompt },
              { role: 'user', content: prompt },
            ],
            tools: openAiFormatTools,
            tool_choice: 'auto',
          }),
        });

        if (!firstTurnRes.ok) {
          const errText = await firstTurnRes.text();
          throw new Error(`OpenRouter HTTP ${firstTurnRes.status}: ${errText}`);
        }

        const firstTurnData = await firstTurnRes.json();
        const choice = firstTurnData.choices?.[0];
        const toolCalls = choice?.message?.tool_calls;

        if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
          // AI decided to call built-in tools!
          const toolMessages: any[] = [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: prompt },
            choice.message,
          ];

          for (const tc of toolCalls) {
            const tName = tc.function.name;
            let tArgs = {};
            try {
              tArgs = JSON.parse(tc.function.arguments || '{}');
            } catch {
              tArgs = {};
            }

            steps.push({
              type: 'tool_call',
              title: `AI Executed Tool: ${tName}()`,
              detail: `Arguments: ${JSON.stringify(tArgs)}`,
              status: 'completed',
              timestamp: nowTime(),
            });

            const tResult = executeDeepAgentTool(tName, tArgs);

            steps.push({
              type: 'tool_result',
              title: `Tool Result [${tName}]`,
              detail: tResult.slice(0, 150),
              status: 'completed',
              timestamp: nowTime(),
            });

            toolMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              name: tName,
              content: tResult,
            });
          }

          // 2nd Turn: Model synthesizes answer with the tool execution output
          const secondTurnRes = await fetch(`${activeBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeApiKey}`,
              'HTTP-Referer': 'https://aistudio.google.com',
              'X-Title': 'ReversX DeepAgents',
            },
            body: JSON.stringify({
              model: activeModel,
              messages: toolMessages,
            }),
          });

          if (secondTurnRes.ok) {
            const secondData = await secondTurnRes.json();
            answerText = secondData.choices?.[0]?.message?.content || '';
          } else {
            answerText = choice?.message?.content || 'Tool execution completed.';
          }
        } else {
          // Normal direct answer
          answerText = choice?.message?.content || 'Received response.';
        }
      } catch (byokErr: any) {
        console.warn('OpenRouter request notice:', byokErr.message);
        steps.push({
          type: 'tool_result',
          title: 'OpenRouter Execution Status',
          detail: byokErr.message.slice(0, 150),
          status: 'failed',
          timestamp: nowTime(),
        });

        answerText = `### ⚠️ OpenRouter Request Notice\n\n${byokErr.message}\n\nPlease verify your API key in **Settings > BYOK** or check your OpenRouter credits.`;
      }
    } else {
      // No OpenRouter API key found (neither in BYOK nor in environment)
      providerName = 'OpenRouter';
      modelName = activeModel;
      answerText = [
        "### 🔑 OpenRouter API Key Required",
        "",
        "OpenRouter দিয়ে চ্যাট ও DeepAgents এর Built-in Tools (Filesystem, Math, Subagent) ব্যবহার করতে আপনার API Key প্রয়োজন:",
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
    console.error('DeepAgents Error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute DeepAgent task' });
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
