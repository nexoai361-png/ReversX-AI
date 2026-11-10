import { useState } from 'react';
import { ChatMessage, ChatThread } from '../types/chat';

export function useChatState() {
  const [threads, setThreads] = useState<ChatThread[]>([
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
    // Add other initial threads as needed
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-1');
  const [userInputText, setUserInputText] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  // Add other states...

  return {
    threads,
    setThreads,
    activeThreadId,
    setActiveThreadId,
    userInputText,
    setUserInputText,
    isDarkMode,
    setIsDarkMode,
  };
}
