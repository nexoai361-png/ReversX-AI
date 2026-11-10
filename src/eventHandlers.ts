import { ChatMessage, ChatThread } from './types/chat';

export interface AppHandlerContext {
  threads: ChatThread[];
  activeThreadId: string;
  currentMessages: ChatMessage[];
  expandedMessageIds: Set<string>;
  activeMsgActionMenuId: string | null;
  activeThreadMenuId: string | null;
  isRenameModalOpen: boolean;
  renameThreadId: string | null;
  renameInputValue: string;
  isDeleteModalOpen: boolean;
  threadToDeleteId: string | null;
  isGeneralSettingsOpen: boolean;
  isChooseFontScreenOpen: boolean;
  selectedFont: string;
  isFontSizeScreenOpen: boolean;
  userFontSize: number;
  aiFontSize: number;
  sidebarLongPressTimer: number | null;
  copiedToastVisible: boolean;
  toastMessageText: string;
  likedMessageIds: Set<string>;
  dislikedMessageIds: Set<string>;
  readingMessageId: string | null;
  longPressTimer: number | null;
  isSidebarOpen: boolean;
  isPlusModalOpen: boolean;
  isAttachmentMenuOpen: boolean;
  isVoiceModeActive: boolean;
  isGenerating: boolean;
  isReasoningActive: boolean;
  isWebSearchActive: boolean;
  userInputText: string;
  isFullScreenEditorOpen: boolean;
  isSettingsOpen: boolean;
  isBYOKOpen: boolean;
  isAddProviderOpen: boolean;
  isDarkMode: boolean;
  byokConfig: {
    service: string;
    baseUrl: string;
    apiKey: string;
    defaultModel: string;
    enabled: boolean;
  };

  render(): void;
  updateButtonState(): void;
  showCopiedToast(msgText?: string): void;
  clearLongPress(): void;
  clearSidebarLongPress(): void;
  closeSidebar(): void;
  openPlusModal(): void;
  startNewChat(): void;
  handleSendMessage(text: string): Promise<void>;
}

export function attachAllEventListeners(ctx: AppHandlerContext) {
  // Outside click to close user message action menu or sidebar thread action menu
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (ctx.activeMsgActionMenuId && !target.closest('[data-user-msg-id]')) {
      ctx.activeMsgActionMenuId = null;
      ctx.render();
    }
    if (ctx.activeThreadMenuId && !target.closest('[data-sidebar-thread-container]')) {
      ctx.activeThreadMenuId = null;
      ctx.render();
    }
  });

  // Sidebar Thread Long Press / Context Menu
  document.querySelectorAll('[data-sidebar-thread-id]').forEach((el) => {
    const threadId = el.getAttribute('data-sidebar-thread-id');
    if (!threadId) return;

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      ctx.clearSidebarLongPress();
      ctx.activeThreadMenuId = threadId;
      ctx.render();
    });

    const startHold = () => {
      ctx.clearSidebarLongPress();
      ctx.sidebarLongPressTimer = window.setTimeout(() => {
        ctx.activeThreadMenuId = threadId;
        ctx.render();
      }, 450);
    };

    const cancelHold = () => {
      ctx.clearSidebarLongPress();
    };

    el.addEventListener('touchstart', startHold, { passive: true });
    el.addEventListener('touchend', cancelHold, { passive: true });
    el.addEventListener('touchcancel', cancelHold, { passive: true });
    el.addEventListener('touchmove', cancelHold, { passive: true });
    el.addEventListener('mousedown', startHold);
    el.addEventListener('mouseup', cancelHold);
    el.addEventListener('mouseleave', cancelHold);
  });

  // Sidebar Thread Pin / Unpin
  document.querySelectorAll('[data-thread-action-pin]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const threadId = (e.currentTarget as HTMLElement).getAttribute('data-thread-action-pin');
      const thread = ctx.threads.find((t) => t.id === threadId);
      if (thread) {
        thread.isPinned = !thread.isPinned;
        ctx.activeThreadMenuId = null;
        ctx.showCopiedToast(thread.isPinned ? 'Chat pinned' : 'Chat unpinned');
      }
    });
  });

  // Sidebar Thread Edit / Rename
  document.querySelectorAll('[data-thread-action-edit]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const threadId = (e.currentTarget as HTMLElement).getAttribute('data-thread-action-edit');
      const thread = ctx.threads.find((t) => t.id === threadId);
      if (thread) {
        ctx.renameThreadId = threadId;
        ctx.renameInputValue = thread.title;
        ctx.isRenameModalOpen = true;
        ctx.activeThreadMenuId = null;
        ctx.isSidebarOpen = false;
        ctx.render();
        setTimeout(() => {
          const input = document.getElementById('rename-modal-input') as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
          }
        }, 50);
      }
    });
  });

  // Main Screen Rename Modal handlers
  const closeRenameModal = document.getElementById('btn-close-rename-modal');
  const cancelRenameModal = document.getElementById('btn-cancel-rename-modal');
  if (closeRenameModal) closeRenameModal.addEventListener('click', () => {
    ctx.isRenameModalOpen = false;
    ctx.render();
  });
  if (cancelRenameModal) cancelRenameModal.addEventListener('click', () => {
    ctx.isRenameModalOpen = false;
    ctx.render();
  });

  const renameModalInput = document.getElementById('rename-modal-input') as HTMLInputElement;
  const renameSubmitBtn = document.getElementById('btn-rename-submit') as HTMLButtonElement;
  if (renameModalInput) {
    renameModalInput.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      ctx.renameInputValue = val;
      const isNonEmpty = val.trim().length > 0;
      if (renameSubmitBtn) {
        renameSubmitBtn.disabled = !isNonEmpty;
        const renameTextColor = isNonEmpty
          ? (ctx.isDarkMode ? 'text-white' : 'text-zinc-900')
          : (ctx.isDarkMode ? 'text-[#555555]' : 'text-zinc-400');
        renameSubmitBtn.className = `bg-none border-0 font-['Source_Sans_3',sans-serif] text-[16px] font-semibold p-1 ${renameTextColor} ${isNonEmpty ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`;
      }
    });
  }

  const renameForm = document.getElementById('form-rename-thread');
  if (renameForm) {
    renameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('rename-modal-input') as HTMLInputElement;
      if (ctx.renameThreadId && input) {
        const thread = ctx.threads.find((t) => t.id === ctx.renameThreadId);
        const val = input.value.trim();
        if (thread && val) {
          thread.title = val;
          ctx.showCopiedToast('Chat title updated');
        }
      }
      ctx.isRenameModalOpen = false;
      ctx.render();
    });
  }

  // Sidebar Thread Delete
  document.querySelectorAll('[data-thread-action-delete]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const threadId = (e.currentTarget as HTMLElement).getAttribute('data-thread-action-delete');
      if (threadId) {
        ctx.threadToDeleteId = threadId;
        ctx.isDeleteModalOpen = true;
        ctx.activeThreadMenuId = null;
        ctx.render();
      }
    });
  });

  const cancelDeleteBtn = document.getElementById('btn-cancel-delete');
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
      ctx.threadToDeleteId = null;
      ctx.isDeleteModalOpen = false;
      ctx.render();
    });
  }

  const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (ctx.threadToDeleteId) {
        ctx.threads = ctx.threads.filter((t) => t.id !== ctx.threadToDeleteId);
        if (ctx.activeThreadId === ctx.threadToDeleteId) {
          if (ctx.threads.length > 0) {
            ctx.activeThreadId = ctx.threads[0].id;
            ctx.currentMessages = [...ctx.threads[0].messages];
          } else {
            ctx.activeThreadId = '';
            ctx.currentMessages = [];
          }
        }
        ctx.showCopiedToast('Chat deleted');
      }
      ctx.threadToDeleteId = null;
      ctx.isDeleteModalOpen = false;
      ctx.render();
    });
  }

  // Expand / Collapse message toggle
  document.querySelectorAll('[data-toggle-msg]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const msgId = (e.currentTarget as HTMLElement).getAttribute('data-toggle-msg');
      if (msgId) {
        if (ctx.expandedMessageIds.has(msgId)) {
          ctx.expandedMessageIds.delete(msgId);
        } else {
          ctx.expandedMessageIds.add(msgId);
        }
        ctx.render();
      }
    });
  });

  // Copy action button
  document.querySelectorAll('[data-action-copy]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const msgId = (e.currentTarget as HTMLElement).getAttribute('data-action-copy');
      const msg = ctx.currentMessages.find((m) => m.id === msgId);
      if (msg) {
        navigator.clipboard.writeText(msg.content);
        ctx.activeMsgActionMenuId = null;
        ctx.showCopiedToast();
      } else {
        ctx.activeMsgActionMenuId = null;
        ctx.render();
      }
    });
  });

  // Edit action button
  document.querySelectorAll('[data-action-edit]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const msgId = (e.currentTarget as HTMLElement).getAttribute('data-action-edit');
      const msg = ctx.currentMessages.find((m) => m.id === msgId);
      if (msg) {
        ctx.userInputText = msg.content;
        ctx.activeMsgActionMenuId = null;
        ctx.render();
        setTimeout(() => {
          const input = document.getElementById('user-input') as HTMLTextAreaElement;
          if (input) {
            input.focus();
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 400) + 'px';
          }
        }, 50);
      } else {
        ctx.activeMsgActionMenuId = null;
        ctx.render();
      }
    });
  });

  // AI Copy action
  document.querySelectorAll('[data-ai-copy]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-ai-copy');
      const msg = ctx.currentMessages.find((m) => m.id === id);
      if (msg) {
        navigator.clipboard.writeText(msg.content);
        ctx.showCopiedToast('Copied to clipboard');
      }
    });
  });

  // AI Like action
  document.querySelectorAll('[data-ai-like]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-ai-like');
      if (id) {
        if (ctx.likedMessageIds.has(id)) {
          ctx.likedMessageIds.delete(id);
        } else {
          ctx.likedMessageIds.add(id);
          ctx.dislikedMessageIds.delete(id);
        }
        ctx.render();
      }
    });
  });

  // AI Dislike action
  document.querySelectorAll('[data-ai-dislike]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-ai-dislike');
      if (id) {
        if (ctx.dislikedMessageIds.has(id)) {
          ctx.dislikedMessageIds.delete(id);
        } else {
          ctx.dislikedMessageIds.add(id);
          ctx.likedMessageIds.delete(id);
        }
        ctx.render();
      }
    });
  });

  // AI Mic / Read Aloud action
  document.querySelectorAll('[data-ai-read]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-ai-read');
      const msg = ctx.currentMessages.find((m) => m.id === id);
      if (!msg) return;

      if ('speechSynthesis' in window) {
        if (ctx.readingMessageId === id && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          ctx.readingMessageId = null;
          ctx.showCopiedToast('Stopped speaking');
        } else {
          window.speechSynthesis.cancel();
          const cleanText = msg.content
            .replace(/```[\s\S]*?```/g, ' Code snippet ')
            .replace(/<[^>]*>/g, '')
            .replace(/[\*#`_\$\\]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (!cleanText) return;

          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            const preferredVoice = voices.find((v) => v.lang.startsWith('en') || v.lang.startsWith('bn')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
          }

          ctx.readingMessageId = id;
          ctx.showCopiedToast('Speaking AI response...');

          utterance.onend = () => {
            ctx.readingMessageId = null;
            ctx.render();
          };
          utterance.onerror = () => {
            ctx.readingMessageId = null;
            ctx.render();
          };

          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        }
      } else {
        ctx.showCopiedToast('Speech synthesis not supported in browser');
      }
    });
  });

  // AI Share action
  document.querySelectorAll('[data-ai-share]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (e.currentTarget as HTMLElement).getAttribute('data-ai-share');
      const msg = ctx.currentMessages.find((m) => m.id === id);
      if (msg) {
        if (navigator.share) {
          navigator.share({ title: 'ReversX AI Response', text: msg.content }).catch(() => {});
        } else {
          navigator.clipboard.writeText(msg.content);
          ctx.showCopiedToast('Share content copied to clipboard');
        }
      }
    });
  });

  // Hold / Long Press / Context Menu on User Messages
  document.querySelectorAll('[data-user-msg-id]').forEach((el) => {
    const msgId = el.getAttribute('data-user-msg-id');
    if (!msgId) return;

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      ctx.clearLongPress();
      ctx.activeMsgActionMenuId = msgId;
      ctx.render();
    });

    const startHold = () => {
      ctx.clearLongPress();
      ctx.longPressTimer = window.setTimeout(() => {
        ctx.activeMsgActionMenuId = msgId;
        ctx.render();
      }, 450);
    };

    const cancelHold = () => {
      ctx.clearLongPress();
    };

    el.addEventListener('touchstart', startHold, { passive: true });
    el.addEventListener('touchend', cancelHold, { passive: true });
    el.addEventListener('touchcancel', cancelHold, { passive: true });
    el.addEventListener('touchmove', cancelHold, { passive: true });
    el.addEventListener('mousedown', startHold);
    el.addEventListener('mouseup', cancelHold);
    el.addEventListener('mouseleave', cancelHold);
  });

  const sidebarToggle = document.getElementById('btn-sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      ctx.isSidebarOpen = true;
      ctx.render();
    });
  }

  const closeSidebar = document.getElementById('btn-close-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (closeSidebar) closeSidebar.addEventListener('click', () => ctx.closeSidebar());
  if (backdrop) backdrop.addEventListener('click', () => ctx.closeSidebar());

  const getPlusBtn = document.getElementById('btn-get-plus');
  const sidebarGetPlus = document.getElementById('sidebar-get-plus');
  if (getPlusBtn) getPlusBtn.addEventListener('click', () => ctx.openPlusModal());
  if (sidebarGetPlus) sidebarGetPlus.addEventListener('click', () => {
    ctx.isSidebarOpen = false;
    ctx.openPlusModal();
  });

  const closePlusModal = document.getElementById('btn-close-plus-modal');
  if (closePlusModal) closePlusModal.addEventListener('click', () => {
    ctx.isPlusModalOpen = false;
    ctx.render();
  });

  const confirmUpgrade = document.getElementById('btn-confirm-upgrade');
  if (confirmUpgrade) {
    confirmUpgrade.addEventListener('click', () => {
      alert('Thank you for upgrading to ReversX Plus!');
      ctx.isPlusModalOpen = false;
      ctx.render();
    });
  }

  const newChatBtn = document.getElementById('btn-new-chat');
  const sidebarNewChat = document.getElementById('sidebar-new-chat');
  if (newChatBtn) newChatBtn.addEventListener('click', () => ctx.startNewChat());
  if (sidebarNewChat) sidebarNewChat.addEventListener('click', () => {
    ctx.isSidebarOpen = false;
    ctx.startNewChat();
  });

  const headerMoreBtn = document.getElementById('btn-header-more');
  if (headerMoreBtn) {
    headerMoreBtn.addEventListener('click', () => {
      ctx.isSettingsOpen = true;
      ctx.render();
    });
  }

  document.querySelectorAll('[data-thread-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-thread-id');
      if (id) {
        ctx.activeThreadId = id;
        const thread = ctx.threads.find((t) => t.id === id);
        if (thread) {
          ctx.currentMessages = [...thread.messages];
        }
        ctx.isSidebarOpen = false;
        ctx.render();
      }
    });
  });

  document.querySelectorAll('[data-prompt]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const prompt = (e.currentTarget as HTMLElement).getAttribute('data-prompt');
      if (prompt) {
        ctx.handleSendMessage(prompt);
      }
    });
  });

  const attachmentToggle = document.getElementById('btn-attachment-toggle');
  if (attachmentToggle) {
    attachmentToggle.addEventListener('click', () => {
      ctx.isAttachmentMenuOpen = !ctx.isAttachmentMenuOpen;
      ctx.render();
    });
  }

  const optWeb = document.getElementById('opt-web');
  if (optWeb) {
    optWeb.addEventListener('click', () => {
      ctx.isWebSearchActive = !ctx.isWebSearchActive;
      ctx.render();
    });
  }

  const optReason = document.getElementById('opt-reason');
  if (optReason) {
    optReason.addEventListener('click', () => {
      ctx.isReasoningActive = !ctx.isReasoningActive;
      ctx.render();
    });
  }

  const micToggleBtn = document.getElementById('btn-mic-toggle');
  if (micToggleBtn) {
    micToggleBtn.addEventListener('click', () => {
      ctx.isVoiceModeActive = true;
      ctx.render();
    });
  }

  const dynamicContainer = document.getElementById('dynamic-button-container');
  if (dynamicContainer) {
    dynamicContainer.addEventListener('click', (e) => {
      const voiceBtn = (e.target as HTMLElement).closest('#btn-voice-mode');
      if (voiceBtn) {
        ctx.isVoiceModeActive = true;
        ctx.render();
      }
    });
  }

  const endVoiceBtn = document.getElementById('btn-end-voice');
  if (endVoiceBtn) {
    endVoiceBtn.addEventListener('click', () => {
      ctx.isVoiceModeActive = false;
      ctx.render();
    });
  }

  const openSettingsBtn = document.getElementById('btn-open-settings');
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      ctx.isSettingsOpen = true;
      ctx.isSidebarOpen = false;
      ctx.render();
    });
  }

  const closeSettingsBtn = document.getElementById('btn-close-settings');
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      ctx.isSettingsOpen = false;
      ctx.render();
    });
  }

  const toggleThemeBtn = document.getElementById('btn-toggle-theme');
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
      ctx.isDarkMode = !ctx.isDarkMode;
      ctx.render();
    });
  }

  document.querySelectorAll('.btn-toggle-theme').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.isDarkMode = !ctx.isDarkMode;
      ctx.render();
    });
  });

  const openByokBtn = document.getElementById('btn-open-byok');
  if (openByokBtn) {
    openByokBtn.addEventListener('click', () => {
      ctx.isBYOKOpen = true;
      ctx.render();
    });
  }

  const closeByokBtn = document.getElementById('btn-close-byok');
  if (closeByokBtn) {
    closeByokBtn.addEventListener('click', () => {
      ctx.isBYOKOpen = false;
      ctx.render();
    });
  }

  const openAddProviderBtn = document.getElementById('btn-open-add-provider');
  if (openAddProviderBtn) {
    openAddProviderBtn.addEventListener('click', () => {
      ctx.isAddProviderOpen = true;
      ctx.render();
    });
  }

  const closeAddProviderBtn = document.getElementById('btn-close-add-provider');
  const cancelAddProviderBtn = document.getElementById('btn-cancel-add-provider');
  if (cancelAddProviderBtn) {
    cancelAddProviderBtn.addEventListener('click', () => {
      ctx.isAddProviderOpen = false;
      ctx.render();
    });
  }

  // Toggle API key visibility
  const toggleKeyBtn = document.getElementById('btn-toggle-key-visibility');
  if (toggleKeyBtn) {
    toggleKeyBtn.addEventListener('click', () => {
      const keyInput = document.getElementById('byok-api-key') as HTMLInputElement;
      if (keyInput) {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      }
    });
  }

  // Auto-fill base URL and model recommendation based on service selection
  const serviceSelect = document.getElementById('byok-service-select') as HTMLSelectElement;
  if (serviceSelect) {
    serviceSelect.addEventListener('change', (e) => {
      const selectedService = (e.target as HTMLSelectElement).value;
      const baseUrlInput = document.getElementById('byok-base-url') as HTMLInputElement;
      const modelInput = document.getElementById('byok-default-model') as HTMLInputElement;

      if (selectedService === 'OpenRouter') {
        if (baseUrlInput) baseUrlInput.value = 'https://openrouter.ai/api/v1';
        if (modelInput && (!modelInput.value || modelInput.value.includes('gemini'))) {
          modelInput.value = 'google/gemini-2.5-flash';
        }
      } else if (selectedService === 'Google AI') {
        if (baseUrlInput) baseUrlInput.value = 'https://generativelanguage.googleapis.com/v1beta/openai/';
        if (modelInput) modelInput.value = 'gemini-2.5-flash';
      } else if (selectedService === 'OpenAI') {
        if (baseUrlInput) baseUrlInput.value = 'https://api.openai.com/v1';
        if (modelInput) modelInput.value = 'gpt-4o';
      } else if (selectedService === 'Anthropic') {
        if (baseUrlInput) baseUrlInput.value = 'https://api.anthropic.com/v1';
        if (modelInput) modelInput.value = 'claude-3-5-sonnet-20241022';
      }
    });
  }

  // Handle Save Profile
  const byokForm = document.getElementById('form-save-byok-provider');
  if (byokForm) {
    byokForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const serviceEl = document.getElementById('byok-service-select') as HTMLSelectElement;
      const baseUrlEl = document.getElementById('byok-base-url') as HTMLInputElement;
      const apiKeyEl = document.getElementById('byok-api-key') as HTMLInputElement;
      const modelEl = document.getElementById('byok-default-model') as HTMLInputElement;

      const service = serviceEl?.value || 'OpenRouter';
      const baseUrl = baseUrlEl?.value.trim() || 'https://openrouter.ai/api/v1';
      const apiKey = apiKeyEl?.value.trim() || '';
      const defaultModel = modelEl?.value.trim() || 'google/gemini-2.5-flash';

      ctx.byokConfig = {
        service,
        baseUrl,
        apiKey,
        defaultModel,
        enabled: apiKey.length > 0,
      };

      try {
        localStorage.setItem('reversx_byok_config', JSON.stringify(ctx.byokConfig));
      } catch (err) {
        console.warn('Could not save to localStorage', err);
      }

      ctx.isAddProviderOpen = false;
      ctx.showCopiedToast(`${service} profile saved with model: ${defaultModel}`);
      ctx.render();
    });
  }
  if (closeAddProviderBtn) {
    closeAddProviderBtn.addEventListener('click', () => {
      ctx.isAddProviderOpen = false;
      ctx.render();
    });
  }

  const openGeneralSettingsBtn = document.getElementById('btn-open-general-settings');
  if (openGeneralSettingsBtn) {
    openGeneralSettingsBtn.addEventListener('click', () => {
      ctx.isGeneralSettingsOpen = true;
      ctx.render();
    });
  }

  const closeGeneralSettingsBtn = document.getElementById('btn-close-general-settings');
  if (closeGeneralSettingsBtn) {
    closeGeneralSettingsBtn.addEventListener('click', () => {
      ctx.isGeneralSettingsOpen = false;
      ctx.render();
    });
  }

  const openChooseFontBtn = document.getElementById('btn-open-choose-font');
  if (openChooseFontBtn) {
    openChooseFontBtn.addEventListener('click', () => {
      ctx.isChooseFontScreenOpen = true;
      ctx.render();
    });
  }

  const closeChooseFontBtn = document.getElementById('btn-close-choose-font');
  if (closeChooseFontBtn) {
    closeChooseFontBtn.addEventListener('click', () => {
      ctx.isChooseFontScreenOpen = false;
      ctx.render();
    });
  }

  document.querySelectorAll('[data-select-font]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const fontName = (e.currentTarget as HTMLElement).getAttribute('data-select-font');
      if (fontName) {
        ctx.selectedFont = fontName;
        ctx.showCopiedToast(`Font changed to ${fontName}`);
        ctx.render();
      }
    });
  });

  const openFontSettingsBtn = document.getElementById('btn-open-font-settings');
  if (openFontSettingsBtn) {
    openFontSettingsBtn.addEventListener('click', () => {
      ctx.isFontSizeScreenOpen = true;
      ctx.render();
    });
  }

  const closeFontSettingsBtn = document.getElementById('btn-close-font-settings');
  if (closeFontSettingsBtn) {
    closeFontSettingsBtn.addEventListener('click', () => {
      ctx.isFontSizeScreenOpen = false;
      ctx.render();
    });
  }

  const userFontMinusBtn = document.getElementById('btn-user-font-minus');
  if (userFontMinusBtn) {
    userFontMinusBtn.addEventListener('click', () => {
      if (ctx.userFontSize > 12) {
        ctx.userFontSize -= 1;
        ctx.render();
      }
    });
  }

  const userFontPlusBtn = document.getElementById('btn-user-font-plus');
  if (userFontPlusBtn) {
    userFontPlusBtn.addEventListener('click', () => {
      if (ctx.userFontSize < 24) {
        ctx.userFontSize += 1;
        ctx.render();
      }
    });
  }

  const aiFontMinusBtn = document.getElementById('btn-ai-font-minus');
  if (aiFontMinusBtn) {
    aiFontMinusBtn.addEventListener('click', () => {
      if (ctx.aiFontSize > 12) {
        ctx.aiFontSize -= 1;
        ctx.render();
      }
    });
  }

  const aiFontPlusBtn = document.getElementById('btn-ai-font-plus');
  if (aiFontPlusBtn) {
    aiFontPlusBtn.addEventListener('click', () => {
      if (ctx.aiFontSize < 24) {
        ctx.aiFontSize += 1;
        ctx.render();
      }
    });
  }

  document.querySelectorAll('[data-font-preset]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const preset = (e.currentTarget as HTMLElement).getAttribute('data-font-preset');
      if (preset === 'small') {
        ctx.userFontSize = 13;
        ctx.aiFontSize = 13;
      } else if (preset === 'default') {
        ctx.userFontSize = 15;
        ctx.aiFontSize = 15;
      } else if (preset === 'large') {
        ctx.userFontSize = 18;
        ctx.aiFontSize = 18;
      } else if (preset === 'xl') {
        ctx.userFontSize = 21;
        ctx.aiFontSize = 21;
      }
      ctx.render();
    });
  });

  const openEditorBtn = document.getElementById('btn-open-editor');
  if (openEditorBtn) {
    openEditorBtn.addEventListener('click', () => {
      ctx.isFullScreenEditorOpen = true;
      ctx.isAttachmentMenuOpen = false;
      ctx.render();
    });
  }

  const closeEditorBtn = document.getElementById('btn-close-editor');
  if (closeEditorBtn) {
    closeEditorBtn.addEventListener('click', () => {
      ctx.isFullScreenEditorOpen = false;
      ctx.render();
    });
  }

  const saveEditorBtn = document.getElementById('btn-save-editor');
  if (saveEditorBtn) {
    saveEditorBtn.addEventListener('click', () => {
      const editorTextarea = document.getElementById('full-editor-textarea') as HTMLTextAreaElement;
      if (editorTextarea) {
        ctx.userInputText = editorTextarea.value;
      }
      ctx.isFullScreenEditorOpen = false;
      ctx.render();
    });
  }

  const muteVoiceBtn = document.getElementById('btn-mute-voice');
  if (muteVoiceBtn) {
    muteVoiceBtn.addEventListener('click', () => {
      alert('Microphone muted');
    });
  }

  const input = document.getElementById('user-input') as HTMLTextAreaElement;
  if (input) {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 400) + 'px';

    input.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      ctx.userInputText = target.value;
      target.style.height = 'auto';
      target.style.height = Math.min(target.scrollHeight, 400) + 'px';
      ctx.updateButtonState();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (ctx.userInputText.trim() && !ctx.isGenerating) {
          const val = ctx.userInputText.trim();
          ctx.userInputText = '';
          input.style.height = 'auto';
          ctx.handleSendMessage(val);
        }
      }
    });
  }

  const form = document.getElementById('chat-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (ctx.userInputText.trim() && !ctx.isGenerating) {
        const val = ctx.userInputText.trim();
        ctx.userInputText = '';
        if (input) input.style.height = 'auto';
        ctx.handleSendMessage(val);
      }
    });
  }
}
