// Minimal, safe-ish markdown renderer (no raw HTML passthrough).
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderMarkdown(md) {
  if (!md) return "";
  const lines = esc(md).split("\n");
  let html = "";
  let inList = false;
  let inCode = false;
  for (let line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) { html += "</code></pre>"; inCode = false; }
      else { html += '<pre class="bg-charcoal border border-slate p-4 my-3 overflow-x-auto font-mono text-sm"><code>'; inCode = true; }
      continue;
    }
    if (inCode) { html += line + "\n"; continue; }

    let l = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-warm">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-charcoal px-1.5 py-0.5 font-mono text-amber text-sm">$1</code>')
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber underline">$1</a>');

    if (/^#{1,6}\s/.test(l)) {
      if (inList) { html += "</ul>"; inList = false; }
      const level = l.match(/^#+/)[0].length;
      const text = l.replace(/^#+\s/, "");
      const sizes = { 1: "text-2xl font-black", 2: "text-xl font-bold", 3: "text-lg font-bold" };
      html += `<h${level} class="font-heading ${sizes[level] || "text-base font-bold"} text-warm mt-5 mb-2">${text}</h${level}>`;
    } else if (/^[-*]\s/.test(l) || /^\d+\.\s/.test(l)) {
      if (!inList) { html += '<ul class="list-disc pl-6 my-2 space-y-1">'; inList = true; }
      html += `<li>${l.replace(/^[-*]\s/, "").replace(/^\d+\.\s/, "")}</li>`;
    } else if (l.trim() === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p class="my-2 leading-relaxed text-warm/80">${l}</p>`;
    }
  }
  if (inList) html += "</ul>";
  if (inCode) html += "</code></pre>";
  return html;
}
