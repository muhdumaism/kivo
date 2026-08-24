import { marked } from 'marked';
import DOMPurify from 'dompurify';

const renderer = new marked.Renderer();

renderer.link = function(href, title, text) {
  // Use regex to parse out strings because marked 12+ passes an object to link if args differ,
  // but for simple text href is usually the first arg. We'll handle it defensively.
  const url = typeof href === 'object' ? href.href : href;
  const linkText = typeof href === 'object' ? href.text : text;
  const t = (typeof href === 'object' ? href.title : title) || '';
  
  return `<a target="_blank" rel="noopener noreferrer" href="${url}" title="${t}" class="text-amber underline hover:text-[#E9D5FF]">${linkText}</a>`;
};

renderer.image = function(href, title, text) {
  const url = typeof href === 'object' ? href.href : href;
  const alt = typeof href === 'object' ? href.text : text;
  const t = (typeof href === 'object' ? href.title : title) || '';
  
  return `<img src="${url}" alt="${alt}" title="${t}" class="rounded-xl border-2 border-[#E9D5FF] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] my-4 max-w-full h-auto inline-block" />`;
};

// We don't necessarily need to override everything else, 
// because @tailwindcss/typography will handle it.

marked.setOptions({
  renderer: renderer,
  gfm: true,
  breaks: true,
});

export function renderMarkdown(md) {
  if (!md) return "";
  
  // parse markdown
  const rawHtml = marked.parse(md);
  
  // sanitize
  return DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target', 'rel', 'class'],
    FORBID_TAGS: ['style', 'script', 'iframe'], // ensure no funny business
  });
}
