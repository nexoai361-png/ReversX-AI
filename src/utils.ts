export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatMarkdown(text: string, isDarkMode: boolean, escapeHtmlFn: (s: string) => string): string {
  const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
  let formatted = text.replace(codeBlockRegex, (_, lang, code) => {
    return `<div class="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0d0e]">
      <div class="bg-[#18181b] px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800">
        <span>${lang || 'code'}</span>
        <button onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)" class="hover:text-white transition-colors cursor-pointer flex items-center gap-1">
          <span>Copy</span>
        </button>
      </div>
      <pre class="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed"><code>${escapeHtmlFn(code.trim())}</code></pre>
    </div>`;
  });

  formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="font-semibold text-white my-2">$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="font-semibold text-white my-2">$1</h2>');
  formatted = formatted.replace(/^# (.*$)/gim, '<h1 class="font-semibold text-white my-3">$1</h1>');

  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300">$1</code>');
  formatted = formatted.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
    return `<div class="math-container my-4 p-4 rounded-xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-100 border border-zinc-200'} overflow-x-auto overflow-y-hidden">
        $$${math}$$
    </div>`;
  });

  formatted = formatted.replace(/\n/g, '<br/>');

  return formatted;
}
