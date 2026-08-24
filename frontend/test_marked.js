const { marked } = require('marked');

const renderer = new marked.Renderer();

renderer.link = function({ href, title, tokens }) {
  const t = title || '';
  const parsedText = this.parser.parseInline(tokens);
  return `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${t}" class="test">${parsedText}</a>`;
};

renderer.image = function({ href, title, text }) {
  const t = title || '';
  return `<img src="${href}" alt="${text}" title="${t}" class="img-test" />`;
};

marked.setOptions({ renderer });

console.log(marked.parse('[![alt](img_url)](link_url)'));
