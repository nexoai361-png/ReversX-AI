import './index.css';
import { attachAllEventListeners } from './eventHandlers';
import { ChatMessage, ChatThread } from './types/chat';

declare const lucide: {
  createIcons: () => void;
};

class ReversXUIApp {
  private threads: ChatThread[] = [
    {
      id: 'thread-1',
      title: 'ReversX Interface Design',
      date: 'Today',
      messages: [
        {
          id: 'demo-msg-1',
          role: 'user',
          content: 'Hello! When submitting large paragraphs or detailed prompts in this application, we want to ensure the viewport does not stretch excessively on mobile devices. The text bubble should automatically collapse long paragraph text and render a clean "Show more" button with a smooth gradient fade mask, allowing users to toggle between expanded and collapsed views at any time.',
          timestamp: '10:15 AM'
        },
        {
          id: 'demo-msg-2',
          role: 'assistant',
          content: 'I have updated the chat message renderer to support automatic truncation for long paragraphs! Anytime a user or AI sends a lengthy message, it will be neatly collapsed with a gradient fade mask and a **Show more** / **Show less** button.',
          timestamp: '10:15 AM'
        }
      ]
    },
    {
      id: 'thread-2',
      title: 'Math & Logic Capabilities',
      date: 'Yesterday',
      messages: [
        { id: 'm1', role: 'user', content: 'Show me some complex math using KaTeX.', timestamp: '10:14 AM' },
        { id: 'm2', role: 'assistant', content: 'Certainly! ReversX supports advanced mathematical rendering. For example, the quadratic formula is:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nAnd here is a matrix example:\n\n$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$', timestamp: '10:14 AM' }
      ]
    },
    {
      id: 'thread-test',
      title: 'Math Rendering Test',
      date: 'Just now',
      messages: [
        {
          id: 'test-msg-1',
          role: 'assistant',
          content: 'Here is a very long and complex mathematical equation to test horizontal scrolling:\n\n$$f(x) = \\sum_{i=1}^{n} \\left( \\frac{a_i x^i + b_i}{c_i x^2 + d_i x + e_i} \\right) + \\int_{0}^{\\infty} \\frac{\\sin(t)}{t^2 + 1} dt + \\sqrt{\\frac{\\alpha^2 + \\beta^2}{\\gamma^2 + \\delta^2}} + \\prod_{j=1}^{m} \\frac{x_j + y_j}{x_j - y_j} + \\lim_{n \\to \\infty} \\left( 1 + \\frac{1}{n} \\right)^n + \\frac{\\partial^2 u}{\\partial x^2} + \\frac{\\partial^2 u}{\\partial y^2} = 0$$',
          timestamp: 'Now'
        }
      ]
    },
    {
      id: 'thread-3',
      title: 'Voice & Search Features',
      date: 'Previous 7 days',
      messages: []
    }
  ];

  private activeThreadId: string = 'thread-1';
  private currentMessages: ChatMessage[] = [];
  private expandedMessageIds: Set<string> = new Set();
  private activeMsgActionMenuId: string | null = null;
  private activeThreadMenuId: string | null = null;
  private isRenameModalOpen: boolean = false;
  private renameThreadId: string | null = null;
  private renameInputValue: string = '';
  private isDeleteModalOpen: boolean = false;
  private threadToDeleteId: string | null = null;
  private isGeneralSettingsOpen: boolean = false;
  private isChooseFontScreenOpen: boolean = false;
  private selectedFont: string = 'Cabin';
  private isFontSizeScreenOpen: boolean = false;
  private userFontSize: number = 15;
  private aiFontSize: number = 15;
  private sidebarLongPressTimer: number | null = null;
  private copiedToastVisible: boolean = false;
  private toastMessageText: string = 'Copied to clipboard';
  private likedMessageIds: Set<string> = new Set();
  private dislikedMessageIds: Set<string> = new Set();
  private readingMessageId: string | null = null;
  private longPressTimer: number | null = null;
  private isSidebarOpen: boolean = false;
  private isPlusModalOpen: boolean = false;
  private isAttachmentMenuOpen: boolean = false;
  private isVoiceModeActive: boolean = false;
  private isGenerating: boolean = false;
  private isReasoningActive: boolean = false;
  private isWebSearchActive: boolean = false;
  private userInputText: string = '';
  private isFullScreenEditorOpen: boolean = false;
  private isSettingsOpen: boolean = false;
  private isBYOKOpen: boolean = false;
  private isAddProviderOpen: boolean = false;
  private isDarkMode: boolean = true;
  private byokConfig: {
    service: string;
    baseUrl: string;
    apiKey: string;
    defaultModel: string;
    enabled: boolean;
  } = {
    service: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    defaultModel: "google/gemini-2.5-flash",
    enabled: false
  };

  constructor() {
    try {
      const savedByok = localStorage.getItem("reversx_byok_config");
      if (savedByok) {
        this.byokConfig = JSON.parse(savedByok);
      }
    } catch (e) {
      console.warn("Could not load BYOK config", e);
    }
    const defaultThread = this.threads.find(t => t.id === this.activeThreadId);
    if (defaultThread) {
      this.currentMessages = [...defaultThread.messages];
    }
    this.render();
  }

  private render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    // Sync body theme
    document.body.className = `h-full ${this.isDarkMode ? 'bg-black text-slate-100' : 'bg-white text-zinc-900'} font-['Source_Sans_3',sans-serif] antialiased overflow-hidden selection:bg-zinc-800 selection:text-white`;

    appEl.innerHTML = `
      <div class="relative w-full h-full flex flex-col ${this.isDarkMode ? 'bg-black text-slate-100' : 'bg-white text-zinc-900'} overflow-hidden font-['Source_Sans_3',sans-serif]">
        
        <!-- Header Fog Effect Gradient Layer -->
        <div class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${this.isDarkMode ? 'from-black via-black/80 to-transparent' : 'from-white via-white/80 to-transparent'} z-10 pointer-events-none"></div>

        <!-- Floating Top Navigation Bar (Matches Screenshot) -->
        <header class="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 pointer-events-none select-none">
          <!-- Left: Floating Circular Hamburger / Sidebar Menu Button -->
          <button id="btn-sidebar-toggle" class="pointer-events-auto w-12 h-12 rounded-full ${this.isDarkMode ? 'bg-[#212121] hover:bg-[#2c2c2e] text-slate-100' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'} active:scale-95 flex items-center justify-center transition-all shadow-md cursor-pointer" title="Open Drawer">
            <i data-lucide="menu" class="w-5.5 h-5.5"></i>
          </button>

          <!-- Right: Floating Pill Container with New Chat & More Options Buttons -->
          <div class="pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 rounded-full ${this.isDarkMode ? 'bg-[#212121] text-slate-100' : 'bg-zinc-100 text-zinc-800'} shadow-md">
            <button id="btn-new-chat" class="hover:text-zinc-300 transition-colors cursor-pointer active:scale-95 flex items-center justify-center" title="New Chat">
              <i data-lucide="square-pen" class="w-5 h-5"></i>
            </button>
            <button id="btn-header-more" class="hover:text-zinc-300 transition-colors cursor-pointer active:scale-95 flex items-center justify-center" title="More Options">
              <i data-lucide="more-vertical" class="w-5 h-5"></i>
            </button>
          </div>
        </header>

        <!-- Main Workspace / Chat Body -->
        <main class="flex-1 flex flex-col min-h-0 relative overflow-y-auto px-4 pt-20 pb-4 scroll-smooth">
          ${this.currentMessages.length === 0 ? this.renderEmptyState() : this.renderMessages()}
        </main>

        <!-- Attachment Menu Popover -->
        ${this.isAttachmentMenuOpen ? this.renderAttachmentMenu() : ''}

        <!-- Bottom Prompt Bar -->
        <footer class="p-3 ${this.isDarkMode ? 'bg-black' : 'bg-white'} shrink-0 relative z-10">
          <form id="chat-form" class="w-full max-w-3xl mx-auto">
            <div class="relative flex items-end ${this.isDarkMode ? 'bg-[#18181b] border-zinc-700/50' : 'bg-[#f4f4f4] border-zinc-300'} border rounded-3xl px-3 py-2 shadow-sm transition-all gap-1.5">
              
              <!-- Left: Plus Button -->
              <button type="button" id="btn-attachment-toggle" class="w-8 h-8 rounded-full bg-transparent ${this.isDarkMode ? 'hover:bg-[#2c2c2e] text-slate-300' : 'hover:bg-zinc-200 text-zinc-600'} active:scale-95 flex items-center justify-center transition-all shrink-0 cursor-pointer">
                <i data-lucide="plus" class="w-5 h-5"></i>
              </button>

              <!-- Center: Textarea -->
              <div class="flex-1 flex items-center relative min-w-0">
                <textarea 
                  id="user-input" 
                  rows="1"
                  placeholder="Ask ReversX" 
                  class="w-full bg-transparent border-0 outline-none ${this.isDarkMode ? 'text-slate-100 placeholder-zinc-400' : 'text-zinc-900 placeholder-zinc-400'} text-base resize-none max-h-[60vh] font-['Source_Sans_3',sans-serif] focus:ring-0 leading-relaxed py-0.5 min-h-[24px] px-1 placeholder:font-semibold"
                >${this.escapeHtml(this.userInputText)}</textarea>
              </div>

              <!-- Right: Mic & Audio Buttons -->
              <div class="flex items-center gap-1 shrink-0">
                <!-- Microphone Icon -->
                <button type="button" id="btn-mic-toggle" class="w-8 h-8 rounded-full bg-transparent ${this.isDarkMode ? 'hover:bg-[#2c2c2e] text-slate-300' : 'hover:bg-zinc-200 text-zinc-600'} active:scale-95 flex items-center justify-center transition-all cursor-pointer" title="Voice Input">
                  <i data-lucide="mic" class="w-5 h-5"></i>
                </button>

                <!-- Dynamic Send/Voice Button Container -->
                <div id="dynamic-button-container" class="flex items-center">
                  ${this.userInputText.trim() === '' ? `
                    <button type="button" id="btn-voice-mode" class="w-8 h-8 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] active:scale-95 flex items-center justify-center text-white shadow-none transition-all shrink-0 cursor-pointer" title="Live Voice Mode">
                      <i data-lucide="audio-lines" class="w-5 h-5 text-white"></i>
                    </button>
                  ` : `
                    <button type="submit" id="btn-send-message" class="w-8 h-8 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] active:scale-95 flex items-center justify-center text-white shadow-none transition-all shrink-0 cursor-pointer" title="Send Message">
                      <i data-lucide="arrow-up" class="w-5 h-5 text-white"></i>
                    </button>
                  `}
                </div>
              </div>

            </div>
          </form>
        </footer>

        <!-- Copied Toast Banner -->
        ${this.copiedToastVisible ? `
          <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-2xl bg-zinc-800 text-white text-xs font-semibold shadow-2xl border border-zinc-700/60 backdrop-blur-md flex items-center gap-2 animate-fade-in pointer-events-none select-none">
            <i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>
            <span>${this.toastMessageText}</span>
          </div>
        ` : ''}

        <!-- Sidebar Drawer Overlay -->
        ${this.isSidebarOpen ? this.renderSidebar() : ''}

        <!-- Rename Chat Title Modal -->
        ${this.isRenameModalOpen ? this.renderRenameModal() : ''}

        <!-- Delete Chat Confirmation Modal -->
        ${this.isDeleteModalOpen ? this.renderDeleteConfirmationModal() : ''}

        <!-- Get Plus Subscription Modal -->
        ${this.isPlusModalOpen ? this.renderPlusModal() : ''}

        <!-- Live Voice Mode Screen Overlay -->
        ${this.isVoiceModeActive ? this.renderVoiceModeOverlay() : ''}

        <!-- Full Screen Paragraph Editor Modal -->
        ${this.isFullScreenEditorOpen ? this.renderFullScreenEditor() : ''}

        <!-- Settings Overlay -->
        ${this.isSettingsOpen ? this.renderSettings() : ''}

        <!-- General Settings Overlay -->
        ${this.isGeneralSettingsOpen ? this.renderGeneralSettings() : ''}

        <!-- Choose Font Screen Overlay -->
        ${this.isChooseFontScreenOpen ? this.renderChooseFontScreen() : ''}

        <!-- Font Size Screen Overlay -->
        ${this.isFontSizeScreenOpen ? this.renderFontSizeScreen() : ''}

        <!-- BYOK Overlay -->
        ${this.isBYOKOpen ? this.renderBYOKScreen() : ''}

        <!-- Add Provider Overlay -->
        ${this.isAddProviderOpen ? this.renderAddProviderScreen() : ''}

      </div>
    `;

    this.attachEventListeners();
    this.initLucideIcons();
    
    // Auto-render KaTeX math
    if (appEl && (window as any).renderMathInElement) {
      (window as any).renderMathInElement(appEl, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
    }
  }

  private initLucideIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  private renderEmptyState(): string {
    return `
      <div class="flex-1 flex flex-col items-center justify-center text-center p-6 pb-[10vh] select-none">
        <h1 class="text-3xl sm:text-4xl font-bold ${this.isDarkMode ? 'text-zinc-700' : 'text-zinc-400'} font-['JetBrains_Mono',monospace] tracking-tighter">ReversX</h1>
      </div>
    `;
  }

  private renderMessages(): string {
    return `
      <div class="w-full max-w-3xl mx-auto space-y-6 pb-4">
        ${this.currentMessages.map(msg => {
          const isUser = msg.role === 'user';
          const isLong = isUser
            ? (msg.content.length > 140 || msg.content.split('\n').length > 3)
            : (msg.content.length > 350 || msg.content.split('\n').length > 6);
          const isExpanded = this.expandedMessageIds.has(msg.id);
          const isMenuOpen = this.activeMsgActionMenuId === msg.id;

          if (isUser) {
            return `
              <div class="w-full flex justify-end relative ${isMenuOpen ? 'mb-10' : ''}" data-user-msg-id="${msg.id}">
                <div class="max-w-[85%] sm:max-w-[75%] ${this.isDarkMode ? 'bg-[#2f2f2f] text-slate-100' : 'bg-[#f4f4f4] text-zinc-900'} rounded-[24px] px-4 py-3 user-message break-words flex flex-col items-start no-native-select relative group select-none" style="font-size: ${this.userFontSize}px; font-family: '${this.selectedFont}', sans-serif;">
                  
                  ${isMenuOpen ? `
                    <div class="absolute -bottom-10 right-1 z-30 flex items-center gap-1 p-1 rounded-xl ${this.isDarkMode ? 'bg-[#18181b] border-zinc-700 text-slate-200' : 'bg-white border-zinc-200 text-zinc-800'} border shadow-2xl animate-fade-in backdrop-blur-md">
                      <button data-action-copy="${msg.id}" class="px-3 py-1 rounded-lg ${this.isDarkMode ? 'hover:bg-zinc-800 active:bg-zinc-700 text-slate-200' : 'hover:bg-zinc-100 active:bg-zinc-200 text-zinc-800'} text-xs font-semibold cursor-pointer transition-colors">
                        Copy
                      </button>
                      <div class="w-px h-3.5 ${this.isDarkMode ? 'bg-zinc-700' : 'bg-zinc-200'}"></div>
                      <button data-action-edit="${msg.id}" class="px-3 py-1 rounded-lg ${this.isDarkMode ? 'hover:bg-zinc-800 active:bg-zinc-700 text-slate-200' : 'hover:bg-zinc-100 active:bg-zinc-200 text-zinc-800'} text-xs font-semibold cursor-pointer transition-colors">
                        Edit
                      </button>
                    </div>
                  ` : ''}

                  ${isLong && !isExpanded ? `
                    <div class="relative max-h-[76px] overflow-hidden w-full">
                      ${this.formatMarkdown(msg.content)}
                      <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t ${this.isDarkMode ? 'from-[#2f2f2f]' : 'from-[#f4f4f4]'} to-transparent pointer-events-none"></div>
                    </div>
                    <button data-toggle-msg="${msg.id}" class="mt-2 flex items-center gap-1 text-xs font-semibold ${this.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'} transition-colors cursor-pointer select-none py-0.5">
                      <span>Show more</span>
                      <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : `
                    <div class="w-full">
                      ${this.formatMarkdown(msg.content)}
                    </div>
                    ${isLong ? `
                      <button data-toggle-msg="${msg.id}" class="mt-2 flex items-center gap-1 text-xs font-semibold ${this.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'} transition-colors cursor-pointer select-none py-0.5">
                        <span>Show less</span>
                        <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                      </button>
                    ` : ''}
                  `}
                </div>
              </div>
            `;
          } else {
            return `
              <div class="w-full pl-4 border-l-2 ${this.isDarkMode ? 'border-zinc-700 text-slate-200' : 'border-zinc-200 text-zinc-800'} assistant-message ai-message no-native-select flex flex-col items-start gap-1" style="font-size: ${this.aiFontSize}px; font-family: '${this.selectedFont}', sans-serif;">
                ${msg.providerUsed || (msg.agentSteps && msg.agentSteps.length > 0) ? `
                  <div class="mb-2 flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <i data-lucide="cpu" class="w-3 h-3"></i>
                      <span>DeepAgents ${msg.providerUsed ? `(${msg.providerUsed}` + (msg.modelUsed ? `: ${msg.modelUsed}` : '') + `)` : ''}</span>
                    </span>
                  </div>
                  ${msg.agentSteps && msg.agentSteps.length > 0 ? `
                    <details class="w-full mb-2 group text-xs select-none">
                      <summary class="cursor-pointer inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg ${this.isDarkMode ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800/50' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border-zinc-200'} border transition-all">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5 text-zinc-400"></i>
                        <span class="font-medium text-[11px]">Thought for ${msg.agentSteps.length} step${msg.agentSteps.length > 1 ? 's' : ''}</span>
                        <i data-lucide="chevron-down" class="w-3 h-3 text-zinc-500 transition-transform duration-200 group-open:rotate-180"></i>
                      </summary>
                      <div class="mt-2 space-y-1 pl-1 font-sans">
                        ${msg.agentSteps.map(step => `
                          <div class="flex items-start gap-2 text-[11px] py-1 px-2 rounded-md ${this.isDarkMode ? 'bg-zinc-900/40 text-zinc-300' : 'bg-zinc-50 text-zinc-700'}">
                            <i data-lucide="${step.type === 'plan' ? 'compass' : step.type === 'subagent' ? 'users' : 'terminal'}" class="w-3 h-3 mt-0.5 text-zinc-400 shrink-0"></i>
                            <div class="flex-1 min-w-0">
                              <div class="font-medium text-zinc-300">${this.escapeHtml(step.title)}</div>
                              ${step.detail ? `<div class="text-[10px] text-zinc-500 font-mono break-all mt-0.5">${this.escapeHtml(step.detail)}</div>` : ''}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </details>
                  ` : ''}
                ` : ''}
                ${isLong && !isExpanded ? `
                  <div class="relative max-h-[140px] overflow-hidden w-full">
                    ${this.formatMarkdown(msg.content)}
                    <div class="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t ${this.isDarkMode ? 'from-black' : 'from-white'} to-transparent pointer-events-none"></div>
                  </div>
                  <button data-toggle-msg="${msg.id}" class="mt-2 flex items-center gap-1 text-xs font-semibold ${this.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'} transition-colors cursor-pointer select-none">
                    <span>Show more</span>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </button>
                ` : `
                  <div class="w-full">
                    ${this.formatMarkdown(msg.content)}
                  </div>
                  ${isLong ? `
                    <button data-toggle-msg="${msg.id}" class="mt-2 flex items-center gap-1 text-xs font-semibold ${this.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'} transition-colors cursor-pointer select-none">
                      <span>Show less</span>
                      <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                `}

                <!-- AI Response Action Toolbar (Copy, Like, Dislike, Mic, Share) -->
                <div class="flex items-center gap-1 mt-2 pt-1 text-zinc-400">
                  <button data-ai-copy="${msg.id}" title="Copy" class="p-1.5 rounded-lg ${this.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200'} transition-colors cursor-pointer select-none">
                    <i data-lucide="copy" class="w-4 h-4"></i>
                  </button>
                  <button data-ai-like="${msg.id}" title="Like" class="p-1.5 rounded-lg ${this.likedMessageIds.has(msg.id) ? 'text-emerald-400 bg-emerald-500/10' : (this.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200')} transition-colors cursor-pointer select-none">
                    <i data-lucide="thumbs-up" class="w-4 h-4"></i>
                  </button>
                  <button data-ai-dislike="${msg.id}" title="Dislike" class="p-1.5 rounded-lg ${this.dislikedMessageIds.has(msg.id) ? 'text-rose-400 bg-rose-500/10' : (this.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200')} transition-colors cursor-pointer select-none">
                    <i data-lucide="thumbs-down" class="w-4 h-4"></i>
                  </button>
                  <button data-ai-read="${msg.id}" title="Mic / Read Aloud" class="p-1.5 rounded-lg ${this.readingMessageId === msg.id ? 'text-blue-400 bg-blue-500/10 animate-pulse' : (this.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200')} transition-colors cursor-pointer select-none">
                    <i data-lucide="mic" class="w-4 h-4"></i>
                  </button>
                  <button data-ai-share="${msg.id}" title="Share" class="p-1.5 rounded-lg ${this.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200'} transition-colors cursor-pointer select-none">
                    <i data-lucide="share-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `;
          }
        }).join('')}

        ${this.isGenerating ? `
          <div class="w-full pl-4 border-l-2 ${this.isDarkMode ? 'border-zinc-800' : 'border-zinc-100'} flex items-center gap-1.5 h-8">
            <div class="w-1.5 h-1.5 ${this.isDarkMode ? 'bg-zinc-600' : 'bg-zinc-300'} rounded-full animate-pulse"></div>
            <div class="w-1.5 h-1.5 ${this.isDarkMode ? 'bg-zinc-600' : 'bg-zinc-300'} rounded-full animate-pulse [animation-delay:200ms]"></div>
            <div class="w-1.5 h-1.5 ${this.isDarkMode ? 'bg-zinc-600' : 'bg-zinc-300'} rounded-full animate-pulse [animation-delay:400ms]"></div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private formatMarkdown(text: string): string {
    // Preserve math blocks by formatting them first
    let formatted = text.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
      return `<div class="math-container my-1 overflow-x-auto overflow-y-hidden text-sm">
          $$${math}$$
      </div>`;
    });

    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    formatted = formatted.replace(codeBlockRegex, (_, lang, code) => {
      return `<div class="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0d0e]">
        <div class="bg-[#18181b] px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800">
          <span>${lang || 'code'}</span>
          <button onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)" class="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
            <span>Copy</span>
          </button>
        </div>
        <pre class="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed"><code>${this.escapeHtml(code.trim())}</code></pre>
      </div>`;
    });

    formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="font-semibold text-white my-2">$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="font-semibold text-white my-2">$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gim, '<h1 class="font-semibold text-white my-3">$1</h1>');

    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300">$1</code>');
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  }

  private renderAttachmentMenu(): string {
    const isDark = this.isDarkMode;
    const bgContainer = isDark ? '#1c1c1e' : '#ffffff';
    const bgIconBox = isDark ? '#2c2c2e' : '#f4f4f4';
    const textMain = isDark ? '#ffffff' : '#000000';
    const textSub = isDark ? '#8e8e93' : '#666666';

    return `
      <div class="absolute bottom-20 left-4 z-50 w-full max-w-[360px] ${isDark ? 'bg-[#1c1c1e]' : 'bg-[#ffffff]'} rounded-[20px] p-4 shadow-2xl border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} font-['Source_Sans_3',sans-serif]">
        
        <!-- Top Icons Grid -->
        <div class="grid grid-cols-3 gap-2 mb-5">
          <div class="flex flex-col items-center justify-center p-3 rounded-[16px] ${isDark ? 'bg-[#2c2c2e] border-zinc-700' : 'bg-[#f4f4f4] border-zinc-200'} border cursor-pointer aspect-square">
            <i data-lucide="camera" style="color: ${textMain}; stroke-width: 1.8; width: 20px; height: 20px; margin-bottom: 6px;"></i>
            <span style="color: ${textMain}; font-size: 11px; font-weight: 500;">Camera</span>
          </div>
          <div class="flex flex-col items-center justify-center p-3 rounded-[16px] ${isDark ? 'bg-[#2c2c2e] border-zinc-700' : 'bg-[#f4f4f4] border-zinc-200'} border cursor-pointer aspect-square">
            <i data-lucide="image" style="color: ${textMain}; stroke-width: 1.8; width: 20px; height: 20px; margin-bottom: 6px;"></i>
            <span style="color: ${textMain}; font-size: 11px; font-weight: 500;">Photos</span>
          </div>
          <div class="flex flex-col items-center justify-center p-3 rounded-[16px] ${isDark ? 'bg-[#2c2c2e] border-zinc-700' : 'bg-[#f4f4f4] border-zinc-200'} border cursor-pointer aspect-square">
            <i data-lucide="folder-up" style="color: ${textMain}; stroke-width: 1.8; width: 20px; height: 20px; margin-bottom: 6px;"></i>
            <span style="color: ${textMain}; font-size: 11px; font-weight: 500;">Local file</span>
          </div>
        </div>

        <!-- List Section -->
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between cursor-pointer">
            <div class="flex items-start gap-3 flex-1">
              <i data-lucide="plug-2" style="color: ${textMain}; stroke-width: 1.8; width: 20px; height: 20px; margin-top: 2px;"></i>
              <div class="flex flex-col gap-0.5">
                <span style="color: ${textMain}; font-size: 15px; font-weight: 500;">Plugins</span>
                <span style="color: ${textSub}; font-size: 13px; line-height: 1.3;">Connect apps and databases to automate actions</span>
              </div>
            </div>
            <i data-lucide="chevron-right" style="color: #666; stroke-width: 2; width: 16px; height: 16px; margin-top: 2px;"></i>
          </div>

          <div class="flex items-start justify-between cursor-pointer">
            <div class="flex items-start gap-3 flex-1">
              <i data-lucide="book-open" style="color: ${textMain}; stroke-width: 1.8; width: 20px; height: 20px; margin-top: 2px;"></i>
              <div class="flex flex-col gap-0.5">
                <span style="color: ${textMain}; font-size: 15px; font-weight: 500;">Skills</span>
                <span style="color: ${textSub}; font-size: 13px; line-height: 1.3;">Reuse specialized skills to handle specific tasks</span>
              </div>
            </div>
            <i data-lucide="chevron-right" style="color: #666; stroke-width: 2; width: 16px; height: 16px; margin-top: 2px;"></i>
          </div>

          <div class="flex items-start justify-between cursor-pointer">
            <div class="flex items-start gap-3 flex-1">
              <i data-lucide="target" style="color: ${textMain}; stroke-width: 1.8; width: 20px; height: 20px; margin-top: 2px;"></i>
              <div class="flex flex-col gap-0.5">
                <span style="color: ${textMain}; font-size: 15px; font-weight: 500;">Goal</span>
                <span style="color: ${textSub}; font-size: 13px; line-height: 1.3;">ReversX keeps working until your goal is done</span>
              </div>
            </div>
            <i data-lucide="chevron-right" style="color: #666; stroke-width: 2; width: 16px; height: 16px; margin-top: 2px;"></i>
          </div>
        </div>
      </div>
    `;
  }

  private renderSidebar(): string {
    const sidebarBg = this.isDarkMode ? 'bg-black border-zinc-900' : 'bg-white border-zinc-200';
    const itemHover = this.isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-zinc-100';
    const textColor = this.isDarkMode ? 'text-slate-200' : 'text-zinc-800';
    const titleColor = this.isDarkMode ? 'text-white' : 'text-zinc-900';

    return `
      <div class="fixed inset-0 z-40 flex">
        <div id="sidebar-backdrop" class="fixed inset-0 bg-black/70 backdrop-blur-xs"></div>
        
        <div class="relative w-80 max-w-[80vw] h-full ${sidebarBg} border-r flex flex-col p-4 z-50 ${textColor} font-['Source_Sans_3',sans-serif]">
          <!-- Top Header -->
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-xl font-semibold ${titleColor}">ReversX</h2>
            <button id="btn-close-sidebar" class="p-2 text-zinc-400 hover:text-white rounded-lg cursor-pointer">
              <i data-lucide="search" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Menu Items -->
          <div class="space-y-1 mb-8">
            ${[
              { icon: 'image', label: 'Gallery' },
              { icon: 'library', label: 'Knowledge Base' },
              { icon: 'folder', label: 'My Projects' },
              { icon: 'calendar', label: 'Task Scheduler' },
              { icon: 'plug', label: 'Extensions' }
            ].map(item => `
              <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${itemHover} text-sm ${this.isDarkMode ? 'text-zinc-300' : 'text-zinc-600'} hover:${this.isDarkMode ? 'text-white' : 'text-black'} transition-all cursor-pointer">
                <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                <span>${item.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Thread List -->
          <div class="flex-1 overflow-y-auto space-y-1">
            <div class="text-xs font-semibold text-zinc-500 px-3 py-2">Recents</div>
            ${(() => {
              const sortedThreads = [...this.threads].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
              return sortedThreads.map(t => {
                const activeClass = this.isDarkMode ? 'bg-zinc-900 font-semibold text-white' : 'bg-zinc-100 font-semibold text-black';
                const inactiveClass = this.isDarkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50' : 'text-zinc-600 hover:text-black hover:bg-zinc-50';
                const isMenuOpen = this.activeThreadMenuId === t.id;

                return `
                  <div class="relative w-full ${isMenuOpen ? 'z-50' : ''}" data-sidebar-thread-container="${t.id}">
                    <button data-thread-id="${t.id}" data-sidebar-thread-id="${t.id}" class="w-full text-left px-3 py-2.5 rounded-xl text-sm truncate transition-all cursor-pointer flex items-center justify-between no-native-select ${this.activeThreadId === t.id ? activeClass : inactiveClass}">
                      <span class="truncate flex-1 font-medium">${this.escapeHtml(t.title)}</span>
                      ${t.isPinned ? `<i data-lucide="pin" class="w-4 h-4 text-blue-400 ml-2 shrink-0"></i>` : ''}
                    </button>

                    ${isMenuOpen ? `
                      <div class="absolute right-2 top-full mt-1.5 z-50 w-48 py-2 px-1.5 rounded-2xl ${this.isDarkMode ? 'bg-[#18181b] border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border shadow-2xl animate-fade-in backdrop-blur-md flex flex-col gap-1">
                        <button data-thread-action-pin="${t.id}" class="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold ${this.isDarkMode ? 'hover:bg-zinc-800 active:bg-zinc-700' : 'hover:bg-zinc-100 active:bg-zinc-200'} transition-colors cursor-pointer text-left rounded-xl">
                          <i data-lucide="pin" class="w-4.5 h-4.5 ${t.isPinned ? 'text-blue-400' : 'text-zinc-400'}"></i>
                          <span>${t.isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button data-thread-action-edit="${t.id}" class="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold ${this.isDarkMode ? 'hover:bg-zinc-800 active:bg-zinc-700' : 'hover:bg-zinc-100 active:bg-zinc-200'} transition-colors cursor-pointer text-left rounded-xl">
                          <i data-lucide="pencil" class="w-4.5 h-4.5 text-amber-400"></i>
                          <span>Rename</span>
                        </button>
                        <div class="h-px ${this.isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'} my-1"></div>
                        <button data-thread-action-delete="${t.id}" class="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-rose-400 ${this.isDarkMode ? 'hover:bg-zinc-800 active:bg-zinc-700' : 'hover:bg-zinc-100 active:bg-zinc-200'} transition-colors cursor-pointer text-left rounded-xl">
                          <i data-lucide="trash-2" class="w-4.5 h-4.5 text-rose-400"></i>
                          <span>Delete</span>
                        </button>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('');
            })()}
            <button class="w-full text-left px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 cursor-pointer">See all...</button>
          </div>

          <!-- Bottom Action -->
          <div class="pt-4 border-t ${this.isDarkMode ? 'border-zinc-900' : 'border-zinc-200'} flex items-center justify-between gap-3">
            <button id="sidebar-new-chat" class="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#007acc] hover:bg-[#005f9e] text-sm font-semibold text-white transition-all cursor-pointer">
              <i data-lucide="pencil" class="w-4 h-4"></i>
              <span>Chat</span>
            </button>
            <div id="btn-open-settings" class="w-10 h-10 rounded-full ${this.isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'} flex items-center justify-center font-bold ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} text-sm cursor-pointer hover:opacity-80 transition-colors">U</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderDeleteConfirmationModal(): string {
    const cardBg = this.isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-zinc-900 border border-zinc-200';
    const textColor = this.isDarkMode ? 'text-white' : 'text-zinc-900';
    const subTextColor = this.isDarkMode ? 'text-zinc-400' : 'text-zinc-500';

    return `
      <div class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-['Source_Sans_3',sans-serif]">
        <div class="relative w-[400px] max-w-[90vw] ${cardBg} rounded-[20px] p-[24px_28px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] box-border">
          <h3 class="text-[18px] font-semibold mb-2 ${textColor}">Delete chat?</h3>
          <p class="text-[14px] ${subTextColor} mb-6">This chat will be permanently deleted and cannot be undone.</p>
          
          <div class="flex justify-end items-center gap-4">
            <button id="btn-cancel-delete" class="px-4 py-2 text-[14px] font-semibold ${textColor} hover:opacity-80 transition-opacity">
              Cancel
            </button>
            <button id="btn-confirm-delete" class="px-4 py-2 text-[14px] font-semibold text-rose-500 hover:text-rose-400 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderRenameModal(): string {
    const thread = this.threads.find(t => t.id === this.renameThreadId);
    if (!thread) return '';

    const isNonEmpty = this.renameInputValue.trim().length > 0;
    const cardBg = this.isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-zinc-900 border border-zinc-200';
    const borderColor = this.isDarkMode ? 'border-white text-white' : 'border-zinc-900 text-zinc-900';
    const cancelTextColor = this.isDarkMode ? 'text-white' : 'text-zinc-900';
    const renameTextColor = isNonEmpty 
      ? (this.isDarkMode ? 'text-white' : 'text-zinc-900') 
      : (this.isDarkMode ? 'text-[#555555]' : 'text-zinc-400');

    return `
      <div class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-['Source_Sans_3',sans-serif]">
        <div class="relative w-[440px] max-w-[90vw] ${cardBg} rounded-[20px] p-[24px_28px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] box-border">
          <form id="form-rename-thread">
            <div class="flex flex-col gap-2 mb-6">
              <div class="text-[15px] font-normal pl-[2px] ${this.isDarkMode ? 'text-white' : 'text-zinc-800'}">New name</div>
              <input 
                type="text" 
                id="rename-modal-input" 
                value="${this.escapeHtml(this.renameInputValue)}" 
                class="w-full bg-transparent border-2 ${borderColor} rounded-lg text-[20px] font-['Source_Sans_3',sans-serif] outline-none px-[14px] py-[10px] box-border selection:bg-zinc-600 selection:text-white"
                autocomplete="off"
              >
            </div>

            <div class="flex justify-end items-center gap-6 pr-1 mt-2.5">
              <button type="button" id="btn-cancel-rename-modal" class="bg-none border-0 font-['Source_Sans_3',sans-serif] text-[16px] font-semibold cursor-pointer p-1 ${cancelTextColor} hover:opacity-80 transition-opacity">
                Cancel
              </button>
              <button 
                type="submit" 
                id="btn-rename-submit" 
                class="bg-none border-0 font-['Source_Sans_3',sans-serif] text-[16px] font-semibold p-1 ${renameTextColor} ${isNonEmpty ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}" 
                ${!isNonEmpty ? 'disabled' : ''}
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private renderPlusModal(): string {
    const modalBg = this.isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200';
    const textColor = this.isDarkMode ? 'text-slate-200' : 'text-zinc-800';
    const titleColor = this.isDarkMode ? 'text-white' : 'text-zinc-900';
    const cardBg = this.isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100';

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="relative w-full max-w-lg ${modalBg} border rounded-3xl p-6 sm:p-8 shadow-2xl ${textColor}">
          <button id="btn-close-plus-modal" class="absolute top-6 right-6 text-zinc-400 hover:text-zinc-500 text-lg cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            ReversX Plus
          </div>
          <h2 class="text-2xl font-bold ${titleColor} mb-2">Upgrade your plan</h2>
          <p class="text-xs text-zinc-500 mb-6 leading-relaxed">Get unlimited access to our flagship intelligence models, real-time voice mode, and creative tools.</p>

          <div class="space-y-3 mb-8">
            <div class="flex items-start gap-3 p-3 rounded-2xl ${cardBg} border">
              <i data-lucide="check" class="w-4 h-4 text-indigo-400 mt-0.5 shrink-0"></i>
              <div>
                <div class="text-xs font-bold ${titleColor}">Access to GPT-4o & o1 Reasoning</div>
                <div class="text-[11px] text-zinc-500">Our smartest models for complex coding, math, and analysis.</div>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-2xl ${cardBg} border">
              <i data-lucide="check" class="w-4 h-4 text-indigo-400 mt-0.5 shrink-0"></i>
              <div>
                <div class="text-xs font-bold ${titleColor}">Real-Time Advanced Voice Mode</div>
                <div class="text-[11px] text-zinc-500">Natural, human-like voice conversation with low latency.</div>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-2xl ${cardBg} border">
              <i data-lucide="check" class="w-4 h-4 text-indigo-400 mt-0.5 shrink-0"></i>
              <div>
                <div class="text-xs font-bold ${titleColor}">DALL-E 3 Image Generation</div>
                <div class="text-[11px] text-zinc-500">Create photorealistic images from text prompts.</div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t ${this.isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}">
            <div>
              <div class="text-2xl font-extrabold ${titleColor} font-mono">$20 <span class="text-xs font-normal text-zinc-500">/ month</span></div>
            </div>
            <button id="btn-confirm-upgrade" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-none transition-all active:scale-95 cursor-pointer">
              Upgrade to Plus
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderVoiceModeOverlay(): string {
    const bgColor = this.isDarkMode ? 'bg-black' : 'bg-zinc-50';
    const textColor = this.isDarkMode ? 'text-white' : 'text-zinc-900';
    const subTextColor = this.isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
    const accentColor = 'bg-blue-600';

    return `
      <div class="fixed inset-0 z-50 ${bgColor} flex flex-col items-center justify-between p-8">
        <div class="w-full flex items-center justify-between text-xs ${subTextColor} font-mono">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ReversX Voice Mode
          </span>
          <span>Connected</span>
        </div>

        <div class="flex flex-col items-center justify-center space-y-8">
          <div class="relative w-40 h-40 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full bg-blue-600/20 animate-ping"></div>
            <div class="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 blur-md opacity-80 animate-pulse"></div>
            <div class="relative w-24 h-24 rounded-full ${accentColor} shadow-none flex items-center justify-center text-white">
              <i data-lucide="mic" class="w-10 h-10"></i>
            </div>
          </div>
          <div class="text-center space-y-2">
            <div class="text-lg font-bold ${textColor}">Listening...</div>
            <div class="text-xs ${subTextColor} font-mono">Speak naturally into your device</div>
          </div>

          <div class="flex items-center gap-1.5 h-8">
            <span class="w-1 bg-blue-400 rounded-full animate-pulse-wave-1"></span>
            <span class="w-1 bg-blue-400 rounded-full animate-pulse-wave-2"></span>
            <span class="w-1 bg-indigo-400 rounded-full animate-pulse-wave-3"></span>
            <span class="w-1 bg-indigo-400 rounded-full animate-pulse-wave-4"></span>
            <span class="w-1 bg-blue-400 rounded-full animate-pulse-wave-2"></span>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <button id="btn-mute-voice" class="w-14 h-14 rounded-full ${this.isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'} ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer">
            <i data-lucide="mic-off" class="w-6 h-6"></i>
          </button>
          <button id="btn-end-voice" class="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 shadow-none transition-all cursor-pointer">
            <i data-lucide="x" class="w-8 h-8"></i>
          </button>
        </div>
      </div>
    `;
  }

  private renderFullScreenEditor(): string {
    const bgColor = this.isDarkMode ? 'bg-black' : 'bg-white';
    const textColor = this.isDarkMode ? 'text-slate-100' : 'text-zinc-900';
    const borderColor = this.isDarkMode ? 'border-zinc-900' : 'border-zinc-100';
    return `
      <div class="fixed inset-0 z-50 ${bgColor} flex flex-col">
        <div class="flex items-center justify-between px-4 h-16 shrink-0 border-b ${borderColor}">
          <button id="btn-close-editor" class="p-2 ${this.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-800'} transition-colors cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
          <button id="btn-save-editor" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer">
            Done
          </button>
        </div>
        <div class="flex-1 p-6">
          <textarea id="full-editor-textarea" class="w-full h-full bg-transparent border-0 outline-none ${textColor} text-lg resize-none font-['Source_Sans_3',sans-serif] focus:ring-0 leading-relaxed">${this.escapeHtml(this.userInputText)}</textarea>
        </div>
      </div>
    `;
  }



  private renderBYOKScreen(): string {
    const sectionHeaderClass = "text-[12px] font-bold text-zinc-500 uppercase tracking-wide px-4 mb-2 mt-4 font-['Source_Sans_3',sans-serif]";
    const groupContainerClass = `${this.isDarkMode ? 'bg-[#212121]' : 'bg-zinc-100'} rounded-[28px] overflow-hidden mb-6`;
    const rowClass = `w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer ${this.isDarkMode ? 'border-white/5' : 'border-zinc-200'} border-b last:border-b-0 text-left`;
    const iconCircleClass = `w-10 h-10 rounded-full ${this.isDarkMode ? 'bg-zinc-800 text-slate-200' : 'bg-zinc-200 text-zinc-600'} flex items-center justify-center`;

    const isConnected = this.byokConfig.enabled && this.byokConfig.apiKey.trim().length > 0;
    const activeProvider = this.byokConfig.service || "OpenRouter";
    const activeModel = this.byokConfig.defaultModel || "google/gemini-2.5-flash";

    return `
      <div class="fixed inset-0 z-[70] ${this.isDarkMode ? 'bg-black text-slate-100' : 'bg-white text-zinc-900'} flex flex-col font-['Source_Sans_3',sans-serif] animate-fade-in">
        <!-- Header -->
        <div class="p-6 flex flex-col items-center relative shrink-0">
          <button id="btn-close-byok" class="absolute top-6 left-6 w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-zinc-200'} border flex items-center justify-center ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} hover:scale-95 transition-all cursor-pointer">
            <i data-lucide="arrow-left" class="w-6 h-6"></i>
          </button>
          <div class="mt-4 mb-2 flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <i data-lucide="key-round" class="w-5 h-5 text-blue-500"></i>
             </div>
             <h2 class="text-sm font-bold ${this.isDarkMode ? 'text-white' : 'text-zinc-900'} uppercase tracking-[0.1em]">BYOK</h2>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-12 max-w-2xl mx-auto w-full">
          <!-- AI Providers Section -->
          <div class="${sectionHeaderClass}">Providers</div>
          <div class="${groupContainerClass}">
            <div id="btn-provider-openrouter" class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="zap" class="w-5 h-5 ${isConnected ? 'text-emerald-500' : 'text-amber-500'}"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">OpenRouter</span>
                  <span class="text-[11px] text-zinc-500">${isConnected ? 'API Key Configured' : 'Tap to enter API Key'}</span>
                </div>
              </div>
              <span class="text-[12px] ${isConnected ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'}">${isConnected ? 'Connected' : 'Configure'}</span>
            </div>
            <div class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="google" class="w-5 h-5 text-emerald-500"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Google AI</span>
              </div>
              <span class="text-[12px] text-zinc-500 font-medium">Active</span>
            </div>
            <div class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="bot" class="w-5 h-5 text-zinc-500"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Anthropic</span>
              </div>
              <span class="text-[12px] text-zinc-500">Disconnected</span>
            </div>
          </div>

          <!-- Default Model Section -->
          <div class="${sectionHeaderClass}">Default Configuration</div>
          <div class="${groupContainerClass}">
            <div class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="server" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Source</span>
                  <span class="text-[12px] text-zinc-500 font-roboto-mono">${this.escapeHtml(activeProvider)}</span>
                </div>
              </div>
            </div>
            <div class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="box" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Model</span>
                  <span class="text-[12px] text-zinc-500 font-roboto-mono">${this.escapeHtml(activeModel)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Provider Button -->
          <button id="btn-open-add-provider" class="w-full py-4 rounded-[28px] ${this.isDarkMode ? 'bg-[#212121] border-white/5' : 'bg-zinc-100 border-zinc-200'} border hover:opacity-80 transition-all text-sm font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer ${this.isDarkMode ? 'text-white' : 'text-zinc-900'}">
            <i data-lucide="plus" class="w-5 h-5"></i>
            <span>Add Provider</span>
          </button>
        </div>
      </div>
    `;
  }

  private renderAddProviderScreen(): string {
    const sectionHeaderClass = "text-[12px] font-bold text-zinc-500 uppercase tracking-wide px-4 mb-2 mt-4 font-['Source_Sans_3',sans-serif]";
    const groupContainerClass = `${this.isDarkMode ? 'bg-[#212121]' : 'bg-zinc-100'} rounded-[28px] overflow-hidden mb-6`;
    const rowClass = `w-full flex items-center justify-between p-4 ${this.isDarkMode ? 'border-white/5' : 'border-zinc-200'} border-b last:border-b-0 text-left`;
    const iconCircleClass = `w-10 h-10 rounded-full ${this.isDarkMode ? 'bg-zinc-800 text-slate-200' : 'bg-zinc-200 text-zinc-600'} flex items-center justify-center`;
    const inputClass = `w-full bg-transparent border-0 outline-none ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'} text-[15px] focus:ring-0 py-1 font-roboto-mono`;

    return `
      <div class="fixed inset-0 z-[80] ${this.isDarkMode ? 'bg-black text-slate-100' : 'bg-white text-zinc-900'} flex flex-col font-['Source_Sans_3',sans-serif] animate-fade-in">
        <!-- Header -->
        <div class="p-6 flex flex-col items-center relative shrink-0">
          <button id="btn-close-add-provider" class="absolute top-6 left-6 w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-zinc-200'} border flex items-center justify-center ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} hover:scale-95 transition-all cursor-pointer">
            <i data-lucide="arrow-left" class="w-6 h-6"></i>
          </button>
          <div class="mt-4 mb-2 flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <i data-lucide="plus" class="w-5 h-5 text-blue-500"></i>
             </div>
             <h2 class="text-sm font-bold ${this.isDarkMode ? 'text-white' : 'text-zinc-900'} uppercase tracking-[0.1em]">New Provider</h2>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-12 max-w-2xl mx-auto w-full pt-4">
          <div class="px-4 mb-6">
            <p class="text-[12px] text-zinc-500 leading-relaxed font-['Source_Sans_3',sans-serif]">
              Your API keys are encrypted and stored locally. We never transmit your credentials to our servers.
            </p>
          </div>

          <form id="form-save-byok-provider">
            <div class="${sectionHeaderClass}">Service Configuration</div>
            <div class="${groupContainerClass}">
              <div class="${rowClass}">
                <div class="flex items-center gap-4 w-full">
                  <div class="${iconCircleClass}"><i data-lucide="sparkles" class="w-5 h-5"></i></div>
                  <div class="flex-1 flex flex-col">
                    <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-['Source_Sans_3',sans-serif]">Service</span>
                    <select id="byok-service-select" class="${inputClass} cursor-pointer appearance-none">
                      <option value="OpenRouter" ${this.byokConfig.service === "OpenRouter" ? "selected" : ""}>OpenRouter</option>
                      <option value="Google AI" ${this.byokConfig.service === "Google AI" ? "selected" : ""}>Google AI</option>
                      <option value="Anthropic" ${this.byokConfig.service === "Anthropic" ? "selected" : ""}>Anthropic</option>
                      <option value="OpenAI" ${this.byokConfig.service === "OpenAI" ? "selected" : ""}>OpenAI</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="${rowClass}">
                <div class="flex items-center gap-4 w-full">
                  <div class="${iconCircleClass}"><i data-lucide="link" class="w-5 h-5"></i></div>
                  <div class="flex-1 flex flex-col">
                    <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-['Source_Sans_3',sans-serif]">Base URL</span>
                    <input type="text" id="byok-base-url" class="${inputClass}" value="${this.escapeHtml(this.byokConfig.baseUrl || "https://openrouter.ai/api/v1")}">
                  </div>
                </div>
              </div>

              <div class="${rowClass}">
                <div class="flex items-center gap-4 w-full">
                  <div class="${iconCircleClass}"><i data-lucide="key" class="w-5 h-5"></i></div>
                  <div class="flex-1 flex flex-col relative">
                    <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-['Source_Sans_3',sans-serif]">API Key</span>
                    <input type="password" id="byok-api-key" class="${inputClass}" value="${this.escapeHtml(this.byokConfig.apiKey || "")}">
                    <button type="button" id="btn-toggle-key-visibility" class="absolute right-0 bottom-1 text-zinc-500 hover:text-zinc-300 cursor-pointer">
                      <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="${sectionHeaderClass}">Model Selection</div>
            <div class="${groupContainerClass}">
              <div class="${rowClass}">
                <div class="flex items-center gap-4 w-full">
                  <div class="${iconCircleClass}"><i data-lucide="box" class="w-5 h-5"></i></div>
                  <div class="flex-1 flex flex-col">
                    <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-['Source_Sans_3',sans-serif]">Default Model</span>
                    <input 
                      type="text" 
                      id="byok-default-model" 
                      class="${inputClass}" 
                      value="${this.escapeHtml(this.byokConfig.defaultModel || "google/gemini-2.5-flash")}" 
                      placeholder="e.g. google/gemini-2.5-flash or any model name"
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 mt-8">
              <button type="submit" id="btn-save-byok-profile" class="w-full py-4 rounded-[28px] bg-[#34a8e0] text-white text-sm font-bold hover:bg-[#2998cc] transition-all cursor-pointer shadow-lg shadow-blue-500/10 font-['Source_Sans_3',sans-serif]">
                Save Profile
              </button>
              <button type="button" id="btn-cancel-add-provider" class="w-full py-4 rounded-[28px] border ${this.isDarkMode ? 'border-zinc-800 hover:bg-zinc-900' : 'border-zinc-200 hover:bg-zinc-50'} text-sm font-bold transition-all cursor-pointer ${this.isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} font-['Source_Sans_3',sans-serif]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private renderSettings(): string {
    const sectionHeaderClass = "text-[12px] font-bold text-zinc-500 uppercase tracking-wide px-4 mb-2 mt-4";
    const groupContainerClass = `${this.isDarkMode ? 'bg-[#212121]' : 'bg-zinc-100'} rounded-[28px] overflow-hidden mb-6`;
    const rowClass = `w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer ${this.isDarkMode ? 'border-white/5' : 'border-zinc-200'} border-b last:border-b-0 text-left`;
    const iconCircleClass = `w-10 h-10 rounded-full ${this.isDarkMode ? 'bg-zinc-800 text-slate-200' : 'bg-zinc-200 text-zinc-600'} flex items-center justify-center`;

    return `
      <div class="fixed inset-0 z-[60] ${this.isDarkMode ? 'bg-black text-slate-100' : 'bg-white text-zinc-900'} flex flex-col font-['Source_Sans_3',sans-serif] overflow-y-auto">
        <!-- Header -->
        <div class="p-6 flex flex-col items-center relative shrink-0">
          <button id="btn-close-settings" class="absolute top-6 left-6 w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-zinc-200'} border flex items-center justify-center ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} hover:scale-95 transition-all cursor-pointer">
            <i data-lucide="arrow-left" class="w-6 h-6"></i>
          </button>
          
          <div class="relative mb-3 mt-4">
            <div class="w-24 h-24 rounded-full bg-[#94a3b8] flex items-center justify-center text-white text-4xl font-bold">
              S
            </div>
            <div class="absolute bottom-0 right-0 w-8 h-8 rounded-full ${this.isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'} border-2 ${this.isDarkMode ? 'border-black' : 'border-white'} flex items-center justify-center ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} cursor-pointer shadow-lg">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </div>
          </div>
          <h2 class="text-sm font-bold ${this.isDarkMode ? 'text-white' : 'text-zinc-900'} uppercase tracking-[0.1em]">Saptak Mandal</h2>
        </div>

        <!-- Scrollable List -->
        <div class="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
          <!-- My ReversX Section -->
          <div class="${sectionHeaderClass}">My ReversX</div>
          <div class="${groupContainerClass}">
            <button class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="smile" class="w-5 h-5"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Personalization</span>
              </div>
            </button>
            <button class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="book-open" class="w-5 h-5"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Memory</span>
              </div>
            </button>
            <button class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="layout-grid" class="w-5 h-5"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Plugins</span>
              </div>
            </button>
          </div>

          <!-- Account Section -->
          <div class="${sectionHeaderClass}">Account</div>
          <div class="${groupContainerClass}">
            <button class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="briefcase" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Workspace</span>
                  <span class="text-[12px] text-zinc-500">Personal</span>
                </div>
              </div>
            </button>
            <button id="btn-open-byok" class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass} text-blue-400"><i data-lucide="key-round" class="w-5 h-5"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">BYOK [ Bring Your Own Key ]</span>
              </div>
            </button>
            <button class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="bar-chart-3" class="w-5 h-5"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Usage and limits</span>
              </div>
            </button>
            <button class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="heart" class="w-5 h-5"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Parental controls</span>
              </div>
            </button>
            <button class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="mail" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Email</span>
                  <span class="text-[12px] text-zinc-500">nexoai361@gmail.com</span>
                </div>
              </div>
            </button>
            <button class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="shield-check" class="w-5 h-5"></i></div>
                <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Age verification</span>
              </div>
            </button>
          </div>

          <!-- Appearance & General Section -->
          <div class="${this.isDarkMode ? 'bg-[#212121]' : 'bg-zinc-100'} rounded-[28px] overflow-hidden mb-8">
            <button id="btn-toggle-theme" class="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer text-left border-b ${this.isDarkMode ? 'border-white/5' : 'border-zinc-200'}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="${this.isDarkMode ? 'moon' : 'sun'}" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Appearance</span>
                  <span class="text-[12px] text-zinc-500">${this.isDarkMode ? 'Dark' : 'Light'}</span>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-5 h-5 text-zinc-500"></i>
            </button>
            <button id="btn-open-general-settings" class="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer text-left">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="sliders" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">General</span>
                  <span class="text-[12px] text-zinc-500">Fonts, sizes & preferences</span>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-5 h-5 text-zinc-500"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderGeneralSettings(): string {
    const sectionHeaderClass = "text-[12px] font-bold text-zinc-500 uppercase tracking-wide px-4 mb-2 mt-4 font-['Source_Sans_3',sans-serif]";
    const groupContainerClass = `${this.isDarkMode ? 'bg-[#212121]' : 'bg-zinc-100'} rounded-[28px] overflow-hidden mb-6`;
    const rowClass = `w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer ${this.isDarkMode ? 'border-white/5' : 'border-zinc-200'} border-b last:border-b-0 text-left`;
    const iconCircleClass = `w-10 h-10 rounded-full ${this.isDarkMode ? 'bg-zinc-800 text-slate-200' : 'bg-zinc-200 text-zinc-600'} flex items-center justify-center`;

    return `
      <div class="fixed inset-0 z-[70] ${this.isDarkMode ? 'bg-black text-slate-100' : 'bg-white text-zinc-900'} flex flex-col font-['Source_Sans_3',sans-serif] animate-fade-in overflow-y-auto">
        <!-- Header -->
        <div class="p-6 flex flex-col items-center relative shrink-0">
          <button id="btn-close-general-settings" class="absolute top-6 left-6 w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-zinc-200'} border flex items-center justify-center ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} hover:scale-95 transition-all cursor-pointer">
            <i data-lucide="arrow-left" class="w-6 h-6"></i>
          </button>
          <div class="mt-4 mb-2 flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <i data-lucide="sliders" class="w-5 h-5 text-blue-500"></i>
             </div>
             <h2 class="text-sm font-bold ${this.isDarkMode ? 'text-white' : 'text-zinc-900'} uppercase tracking-[0.1em]">General Settings</h2>
          </div>
        </div>

        <div class="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
          <div class="${sectionHeaderClass}">Typography & Customization</div>
          <div class="${groupContainerClass}">
            <button id="btn-open-choose-font" class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="type" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Choose Fonts</span>
                  <span class="text-[12px] text-zinc-500">Selected: ${this.selectedFont}</span>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-5 h-5 text-zinc-500"></i>
            </button>

            <button id="btn-open-font-settings" class="${rowClass}">
              <div class="flex items-center gap-4">
                <div class="${iconCircleClass}"><i data-lucide="scaling" class="w-5 h-5"></i></div>
                <div class="flex flex-col">
                  <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">Font Size</span>
                  <span class="text-[12px] text-zinc-500">User: ${this.userFontSize}px • AI: ${this.aiFontSize}px</span>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-5 h-5 text-zinc-500"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderChooseFontScreen(): string {
    const sectionHeaderClass = "text-[12px] font-bold text-zinc-500 uppercase tracking-wide px-4 mb-2 mt-4 font-['Source_Sans_3',sans-serif]";
    const groupContainerClass = `${this.isDarkMode ? 'bg-[#212121]' : 'bg-zinc-100'} rounded-[28px] overflow-hidden mb-6`;
    const rowClass = `w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer ${this.isDarkMode ? 'border-white/5' : 'border-zinc-200'} border-b last:border-b-0 text-left`;

    const fonts = [
      { name: 'Cabin', desc: 'Modern & Balanced Sans', sample: 'The quick brown fox jumps over the lazy dog' },
      { name: 'Figtree', desc: 'Clean & Geometric Sans', sample: 'The quick brown fox jumps over the lazy dog' },
      { name: 'Geist', desc: 'Minimalist Modern Tech', sample: 'The quick brown fox jumps over the lazy dog' },
      { name: 'Lato', desc: 'Friendly & Versatile Sans', sample: 'The quick brown fox jumps over the lazy dog' },
      { name: 'Open Sans', desc: 'Clean & Neutral Legibility', sample: 'The quick brown fox jumps over the lazy dog' },
      { name: 'IBM Plex Sans', desc: 'Technical & Professional', sample: 'The quick brown fox jumps over the lazy dog' },
      { name: 'Source Sans 3', desc: 'Classic UI Typography', sample: 'The quick brown fox jumps over the lazy dog' },
      { name: 'Inter', desc: 'SaaS Standard Interface', sample: 'The quick brown fox jumps over the lazy dog' }
    ];

    return `
      <div class="fixed inset-0 z-[80] ${this.isDarkMode ? 'bg-black text-slate-100' : 'bg-white text-zinc-900'} flex flex-col font-['Source_Sans_3',sans-serif] animate-fade-in overflow-y-auto">
        <!-- Header -->
        <div class="p-6 flex flex-col items-center relative shrink-0">
          <button id="btn-close-choose-font" class="absolute top-6 left-6 w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-zinc-200'} border flex items-center justify-center ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} hover:scale-95 transition-all cursor-pointer">
            <i data-lucide="arrow-left" class="w-6 h-6"></i>
          </button>
          <div class="mt-4 mb-2 flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <i data-lucide="type" class="w-5 h-5 text-indigo-400"></i>
             </div>
             <h2 class="text-sm font-bold ${this.isDarkMode ? 'text-white' : 'text-zinc-900'} uppercase tracking-[0.1em]">Choose Fonts</h2>
          </div>
        </div>

        <div class="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
          <div class="${sectionHeaderClass}">Select Primary Typography (${fonts.length})</div>
          <div class="${groupContainerClass}">
            ${fonts.map(font => {
              const isSelected = this.selectedFont === font.name;
              return `
                <button data-select-font="${font.name}" class="${rowClass}">
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-2">
                      <span class="text-[15px] font-bold ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-900'}">${font.name}</span>
                      ${isSelected ? `<span class="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold uppercase">Active</span>` : ''}
                    </div>
                    <span class="text-[11px] text-zinc-500 font-medium">${font.desc}</span>
                    <span class="text-[13px] ${this.isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} mt-1" style="font-family: '${font.name}', sans-serif;">${font.sample}</span>
                  </div>
                  <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : (this.isDarkMode ? 'border-zinc-700' : 'border-zinc-300')}">
                    ${isSelected ? `<i data-lucide="check" class="w-3.5 h-3.5"></i>` : ''}
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderFontSizeScreen(): string {
    const sectionHeaderClass = "text-[12px] font-bold text-zinc-500 uppercase tracking-wide px-4 mb-2 mt-4 font-['Source_Sans_3',sans-serif]";
    const groupContainerClass = `${this.isDarkMode ? 'bg-[#212121]' : 'bg-zinc-100'} rounded-[28px] overflow-hidden mb-6 p-4`;

    return `
      <div class="fixed inset-0 z-[80] ${this.isDarkMode ? 'bg-black text-slate-100' : 'bg-white text-zinc-900'} flex flex-col font-['Source_Sans_3',sans-serif] animate-fade-in overflow-y-auto">
        <!-- Header -->
        <div class="p-6 flex flex-col items-center relative shrink-0">
          <button id="btn-close-font-settings" class="absolute top-6 left-6 w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-zinc-100 border-zinc-200'} border flex items-center justify-center ${this.isDarkMode ? 'text-white' : 'text-zinc-600'} hover:scale-95 transition-all cursor-pointer">
            <i data-lucide="arrow-left" class="w-6 h-6"></i>
          </button>
          <div class="mt-4 mb-2 flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <i data-lucide="type" class="w-5 h-5 text-indigo-400"></i>
             </div>
             <h2 class="text-sm font-bold ${this.isDarkMode ? 'text-white' : 'text-zinc-900'} uppercase tracking-[0.1em]">Font Size Customization</h2>
          </div>
        </div>

        <div class="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
          <!-- Preset Options -->
          <div class="${sectionHeaderClass}">Preset Sizes</div>
          <div class="flex items-center gap-2 mb-6">
            <button data-font-preset="small" class="flex-1 py-2.5 rounded-2xl ${this.userFontSize === 13 && this.aiFontSize === 13 ? 'bg-indigo-600 text-white font-bold' : (this.isDarkMode ? 'bg-[#212121] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200')} text-xs font-semibold transition-all cursor-pointer">
              Small (13px)
            </button>
            <button data-font-preset="default" class="flex-1 py-2.5 rounded-2xl ${this.userFontSize === 15 && this.aiFontSize === 15 ? 'bg-indigo-600 text-white font-bold' : (this.isDarkMode ? 'bg-[#212121] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200')} text-xs font-semibold transition-all cursor-pointer">
              Default (15px)
            </button>
            <button data-font-preset="large" class="flex-1 py-2.5 rounded-2xl ${this.userFontSize === 18 && this.aiFontSize === 18 ? 'bg-indigo-600 text-white font-bold' : (this.isDarkMode ? 'bg-[#212121] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200')} text-xs font-semibold transition-all cursor-pointer">
              Large (18px)
            </button>
            <button data-font-preset="xl" class="flex-1 py-2.5 rounded-2xl ${this.userFontSize === 21 && this.aiFontSize === 21 ? 'bg-indigo-600 text-white font-bold' : (this.isDarkMode ? 'bg-[#212121] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200')} text-xs font-semibold transition-all cursor-pointer">
              XL (21px)
            </button>
          </div>

          <!-- User Question Font Size Control -->
          <div class="${sectionHeaderClass}">User Question Font Size</div>
          <div class="${groupContainerClass} flex items-center justify-between p-4">
            <div class="flex flex-col">
              <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">User Prompt Text</span>
              <span class="text-[12px] text-zinc-500">Range: 12px – 24px</span>
            </div>
            
            <div class="flex items-center gap-3">
              <button 
                id="btn-user-font-minus" 
                class="w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-slate-200' : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-800'} flex items-center justify-center transition-all cursor-pointer select-none active:scale-90 ${this.userFontSize <= 12 ? 'opacity-40 cursor-not-allowed' : ''}"
                title="Decrease Font Size"
              >
                <i data-lucide="chevron-left" class="w-6 h-6"></i>
              </button>

              <span class="w-12 text-center text-indigo-400 font-mono text-base font-bold select-none">${this.userFontSize}px</span>

              <button 
                id="btn-user-font-plus" 
                class="w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-slate-200' : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-800'} flex items-center justify-center transition-all cursor-pointer select-none active:scale-90 ${this.userFontSize >= 24 ? 'opacity-40 cursor-not-allowed' : ''}"
                title="Increase Font Size"
              >
                <i data-lucide="chevron-right" class="w-6 h-6"></i>
              </button>
            </div>
          </div>

          <!-- AI Answer Font Size Control -->
          <div class="${sectionHeaderClass}">AI Answer Font Size</div>
          <div class="${groupContainerClass} flex items-center justify-between p-4">
            <div class="flex flex-col">
              <span class="text-[15px] font-medium ${this.isDarkMode ? 'text-slate-100' : 'text-zinc-800'}">AI Response Text</span>
              <span class="text-[12px] text-zinc-500">Range: 12px – 24px</span>
            </div>
            
            <div class="flex items-center gap-3">
              <button 
                id="btn-ai-font-minus" 
                class="w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-slate-200' : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-800'} flex items-center justify-center transition-all cursor-pointer select-none active:scale-90 ${this.aiFontSize <= 12 ? 'opacity-40 cursor-not-allowed' : ''}"
                title="Decrease Font Size"
              >
                <i data-lucide="chevron-left" class="w-6 h-6"></i>
              </button>

              <span class="w-12 text-center text-indigo-400 font-mono text-base font-bold select-none">${this.aiFontSize}px</span>

              <button 
                id="btn-ai-font-plus" 
                class="w-11 h-11 rounded-full ${this.isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-slate-200' : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-800'} flex items-center justify-center transition-all cursor-pointer select-none active:scale-90 ${this.aiFontSize >= 24 ? 'opacity-40 cursor-not-allowed' : ''}"
                title="Increase Font Size"
              >
                <i data-lucide="chevron-right" class="w-6 h-6"></i>
              </button>
            </div>
          </div>

          <!-- Live Preview Box -->
          <div class="${sectionHeaderClass}">Live Preview</div>
          <div class="${this.isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-zinc-50 border-zinc-200'} border rounded-[28px] p-5 space-y-4">
            
            <!-- User Sample Bubble -->
            <div class="flex justify-end">
              <div class="max-w-[85%] ${this.isDarkMode ? 'bg-[#2f2f2f] text-slate-100' : 'bg-[#f4f4f4] text-zinc-900'} rounded-[24px] px-4 py-3 user-message" style="font-size: ${this.userFontSize}px; font-family: '${this.selectedFont}', sans-serif;">
                How can I customize the font size in ReversX?
              </div>
            </div>

            <!-- AI Sample Bubble -->
            <div class="pl-4 border-l-2 ${this.isDarkMode ? 'border-zinc-700 text-slate-200' : 'border-zinc-200 text-zinc-800'} ai-message space-y-1" style="font-size: ${this.aiFontSize}px; font-family: '${this.selectedFont}', sans-serif;">
              <p>You can adjust the font size for user prompts and AI responses independently using the sliders or preset buttons above.</p>
            </div>

          </div>
        </div>
      </div>
    `;
  }


  private updateButtonState() {
    const container = document.getElementById('dynamic-button-container');
    if (!container) return;

    if (this.userInputText.trim() === '') {
      container.innerHTML = `
        <button type="button" id="btn-voice-mode" class="w-8 h-8 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] active:scale-95 flex items-center justify-center text-white shadow-none transition-all shrink-0 cursor-pointer" title="Live Voice Mode">
          <i data-lucide="audio-lines" class="w-5 h-5 text-white"></i>
        </button>
      `;
    } else {
      container.innerHTML = `
        <button type="submit" id="btn-send-message" class="w-8 h-8 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] active:scale-95 flex items-center justify-center text-white shadow-none transition-all shrink-0 cursor-pointer" title="Send Message">
          <i data-lucide="arrow-up" class="w-5 h-5 text-white"></i>
        </button>
      `;
    }
    this.initLucideIcons();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private clearLongPress() {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private showCopiedToast(msgText: string = 'Copied to clipboard') {
    this.toastMessageText = msgText;
    this.copiedToastVisible = true;
    this.render();
    setTimeout(() => {
      this.copiedToastVisible = false;
      this.render();
    }, 2000);
  }

  private clearSidebarLongPress() {
    if (this.sidebarLongPressTimer !== null) {
      clearTimeout(this.sidebarLongPressTimer);
      this.sidebarLongPressTimer = null;
    }
  }

  private attachEventListeners() {
    attachAllEventListeners(this as any);
  }

  private closeSidebar() {
    this.isSidebarOpen = false;
    this.render();
  }

  private openPlusModal() {
    this.isPlusModalOpen = true;
    this.render();
  }

  private startNewChat() {
    this.currentMessages = [];
    this.render();
  }

  private async handleSendMessage(text: string) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    this.currentMessages.push({
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: time
    });
    this.isGenerating = true;
    this.render();

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          byok: (this.byokConfig && this.byokConfig.apiKey && this.byokConfig.apiKey.trim().length > 0 && this.byokConfig.apiKey.trim() !== 'undefined' && this.byokConfig.apiKey.trim() !== 'null') ? {
            service: this.byokConfig.service || "OpenRouter",
            baseUrl: this.byokConfig.baseUrl || "https://openrouter.ai/api/v1",
            apiKey: this.byokConfig.apiKey.trim(),
            defaultModel: this.byokConfig.defaultModel || "google/gemini-2.5-flash",
          } : undefined,
          enableAgent: true,
          systemInstruction: "You are ReversX, powered by DeepAgents autonomous architecture. Provide concise, clear, and elegant responses using clean Markdown, code snippets, and LaTeX for mathematical formulas (use $...$ for inline and $$...$$ for blocks)."
        })
      });

      const data = await res.json();
      const answer = data.text || "I received your request!";
      const assistantMsgId = (Date.now() + 1).toString();
      
      // Push message shell for live text streaming
      this.currentMessages.push({
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        agentSteps: data.steps || [],
        providerUsed: data.provider,
        modelUsed: data.model,
      });

      // Stream tokens progressively into UI
      const targetMsg = this.currentMessages.find(m => m.id === assistantMsgId);
      if (targetMsg) {
        const chunks = answer.match(/.\s*|\S+\s*/g) || [answer];
        for (let i = 0; i < chunks.length; i++) {
          targetMsg.content += chunks[i];
          if (i % 3 === 0 || i === chunks.length - 1) {
            this.render();
            await new Promise(r => setTimeout(r, 12));
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      this.currentMessages.push({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but an error occurred while processing your request with DeepAgents.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    } finally {
      this.isGenerating = false;
      this.render();
    }
  }
}

new ReversXUIApp();
