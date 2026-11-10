import { formatMarkdown, escapeHtml } from './utils';

// Helper interface for rendering functions
export interface ReversXAppInstance {
  isDarkMode: boolean;
  selectedFont: string;
  userFontSize: number;
  aiFontSize: number;
  threads: any[];
  currentMessages: any[];
  expandedMessageIds: Set<string>;
  activeMsgActionMenuId: string | null;
  activeThreadMenuId: string | null;
  activeThreadId: string;
  isSidebarOpen: boolean;
  isAttachmentMenuOpen: boolean;
  isGenerating: boolean;
  isRenameModalOpen: boolean;
  renameThreadId: string | null;
  renameInputValue: string;
  isDeleteModalOpen: boolean;
  isPlusModalOpen: boolean;
  isVoiceModeActive: boolean;
  isFullScreenEditorOpen: boolean;
  isSettingsOpen: boolean;
  isGeneralSettingsOpen: boolean;
  isChooseFontScreenOpen: boolean;
  isFontSizeScreenOpen: boolean;
  isBYOKOpen: boolean;
  isAddProviderOpen: boolean;
  copiedToastVisible: boolean;
  toastMessageText: string;
  readingMessageId: string | null;
  likedMessageIds: Set<string>;
  dislikedMessageIds: Set<string>;
  userInputText: string;
}

// All render methods moved here, taking app instance as argument
export const renderEmptyState = (app: ReversXAppInstance) => `
  <div class="flex-1 flex flex-col items-center justify-center text-center p-6 pb-[10vh] select-none">
    <h1 class="text-3xl sm:text-4xl font-bold ${app.isDarkMode ? 'text-zinc-700' : 'text-zinc-400'} font-['JetBrains_Mono',monospace] tracking-tighter">ReversX</h1>
  </div>
`;

// ... I will fill this in the next steps ...

export function renderMessages(app: ReversXAppInstance): string {
    return `
      <div class="w-full max-w-3xl mx-auto space-y-6 pb-4">
        ${app.currentMessages.map(msg => {
          const isUser = msg.role === 'user';
          const isLong = isUser
            ? (msg.content.length > 140 || msg.content.split('\n').length > 3)
            : (msg.content.length > 350 || msg.content.split('\n').length > 6);
          const isExpanded = app.expandedMessageIds.has(msg.id);
          const isMenuOpen = app.activeMsgActionMenuId === msg.id;

          if (isUser) {
            return `
              <div class="w-full flex justify-end relative ${isMenuOpen ? 'mb-10' : ''}" data-user-msg-id="${msg.id}">
                <div class="max-w-[85%] sm:max-w-[75%] ${app.isDarkMode ? 'bg-[#2f2f2f] text-slate-100' : 'bg-[#f4f4f4] text-zinc-900'} rounded-[24px] px-4 py-3 user-message break-words flex flex-col items-start no-native-select relative group select-none" style="font-size: ${app.userFontSize}px; font-family: '${app.selectedFont}', sans-serif;">
                  
                  ${isMenuOpen ? `
                    <div class="absolute -bottom-10 right-1 z-30 flex items-center gap-1 p-1 rounded-xl ${app.isDarkMode ? 'bg-[#18181b] border-zinc-700 text-slate-200' : 'bg-white border-zinc-200 text-zinc-800'} border shadow-2xl animate-fade-in backdrop-blur-md">
                      <button data-action-copy="${msg.id}" class="px-3 py-1 rounded-lg ${app.isDarkMode ? 'hover:bg-zinc-800 active:bg-zinc-700 text-slate-200' : 'hover:bg-zinc-100 active:bg-zinc-200 text-zinc-800'} text-xs font-semibold cursor-pointer transition-colors">
                        Copy
                      </button>
                      <div class="w-px h-3.5 ${app.isDarkMode ? 'bg-zinc-700' : 'bg-zinc-200'}"></div>
                      <button data-action-edit="${msg.id}" class="px-3 py-1 rounded-lg ${app.isDarkMode ? 'hover:bg-zinc-800 active:bg-zinc-700 text-slate-200' : 'hover:bg-zinc-100 active:bg-zinc-200 text-zinc-800'} text-xs font-semibold cursor-pointer transition-colors">
                        Edit
                      </button>
                    </div>
                  ` : ''}

                  ${isLong && !isExpanded ? `
                    <div class="relative max-h-[76px] overflow-hidden w-full">
                      ${formatMarkdown(msg.content, app.isDarkMode, escapeHtml)}
                      <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t ${app.isDarkMode ? 'from-[#2f2f2f]' : 'from-[#f4f4f4]'} to-transparent pointer-events-none"></div>
                    </div>
                    <button data-toggle-msg="${msg.id}" class="mt-2 flex items-center gap-1 text-xs font-semibold ${app.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'} transition-colors cursor-pointer select-none py-0.5">
                      <span>Show more</span>
                      <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : `
                    <div class="w-full">
                      ${formatMarkdown(msg.content, app.isDarkMode, escapeHtml)}
                    </div>
                    ${isLong ? `
                      <button data-toggle-msg="${msg.id}" class="mt-2 flex items-center gap-1 text-xs font-semibold ${app.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'} transition-colors cursor-pointer select-none py-0.5">
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
              <div class="w-full pl-4 border-l-2 ${app.isDarkMode ? 'border-zinc-700 text-slate-200' : 'border-zinc-200 text-zinc-800'} assistant-message ai-message no-native-select flex flex-col items-start gap-1" style="font-size: ${app.aiFontSize}px; font-family: '${app.selectedFont}', sans-serif;">
                ${isLong && !isExpanded ? `
                  <div class="relative max-h-[140px] overflow-hidden w-full">
                    ${formatMarkdown(msg.content, app.isDarkMode, escapeHtml)}
                    <div class="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t ${app.isDarkMode ? 'from-black' : 'from-white'} to-transparent pointer-events-none"></div>
                  </div>
                  <button data-toggle-msg="${msg.id}" class="mt-2 flex items-center gap-1 text-xs font-semibold ${app.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'} transition-colors cursor-pointer select-none">
                    <span>Show more</span>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                  </button>
                ` : `
                  <div class="w-full">
                    ${formatMarkdown(msg.content, app.isDarkMode, escapeHtml)}
                  </div>
                  ${isLong ? `
                    <button data-toggle-msg="${msg.id}" class="mt-2 flex items-center gap-1 text-xs font-semibold ${app.isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'} transition-colors cursor-pointer select-none">
                      <span>Show less</span>
                      <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                `}
  
                <!-- AI Response Action Toolbar -->
                <div class="flex items-center gap-1 mt-2 pt-1 text-zinc-400">
                  <button data-ai-copy="${msg.id}" title="Copy" class="p-1.5 rounded-lg ${app.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200'} transition-colors cursor-pointer select-none">
                    <i data-lucide="copy" class="w-4 h-4"></i>
                  </button>
                  <button data-ai-like="${msg.id}" title="Like" class="p-1.5 rounded-lg ${app.likedMessageIds.has(msg.id) ? 'text-emerald-400 bg-emerald-500/10' : (app.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200')} transition-colors cursor-pointer select-none">
                    <i data-lucide="thumbs-up" class="w-4 h-4"></i>
                  </button>
                  <button data-ai-dislike="${msg.id}" title="Dislike" class="p-1.5 rounded-lg ${app.dislikedMessageIds.has(msg.id) ? 'text-rose-400 bg-rose-500/10' : (app.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200')} transition-colors cursor-pointer select-none">
                    <i data-lucide="thumbs-down" class="w-4 h-4"></i>
                  </button>
                  <button data-ai-read="${msg.id}" title="Mic / Read Aloud" class="p-1.5 rounded-lg ${app.readingMessageId === msg.id ? 'text-blue-400 bg-blue-500/10 animate-pulse' : (app.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200')} transition-colors cursor-pointer select-none">
                    <i data-lucide="mic" class="w-4 h-4"></i>
                  </button>
                  <button data-ai-share="${msg.id}" title="Share" class="p-1.5 rounded-lg ${app.isDarkMode ? 'hover:text-slate-100 hover:bg-zinc-800' : 'hover:text-zinc-900 hover:bg-zinc-200'} transition-colors cursor-pointer select-none">
                    <i data-lucide="share-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `;
          }
        }).join('')}
  
        ${app.isGenerating ? `
          <div class="w-full pl-4 border-l-2 ${app.isDarkMode ? 'border-zinc-800' : 'border-zinc-100'} flex items-center gap-1.5 h-8">
            <div class="w-1.5 h-1.5 ${app.isDarkMode ? 'bg-zinc-600' : 'bg-zinc-300'} rounded-full animate-pulse"></div>
            <div class="w-1.5 h-1.5 ${app.isDarkMode ? 'bg-zinc-600' : 'bg-zinc-300'} rounded-full animate-pulse [animation-delay:200ms]"></div>
            <div class="w-1.5 h-1.5 ${app.isDarkMode ? 'bg-zinc-600' : 'bg-zinc-300'} rounded-full animate-pulse [animation-delay:400ms]"></div>
          </div>
        ` : ''}
      </div>
    `;
}
