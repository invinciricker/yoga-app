/**
 * Markdown → blocks.
 *
 * The text under the frontmatter is turned into the simple "blocks" of shared/content-schema.ts,
 * so the app can draw it with its own type styles (no Markdown library and no HTML in the app).
 * We walk the tree that remark-parse gives; we never go through HTML.
 *
 * What works: paragraphs, ## and ### headings, bold, italic, links, bulleted and numbered lists,
 * "> a line set apart", and a picture on its own line. Anything else is refused, with the line.
 */
import type { BlockContent, Nodes, PhrasingContent, RootContent } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import type { Block, Span } from '../../shared/content-schema';

/** A picture named in the text. The build turns it into a real `image` block later. */
export type PictureBlock = { type: 'picture'; file: string; alt: string; line?: number };
/** A block before its pictures are prepared. */
export type DraftBlock = Exclude<Block, { type: 'image' }> | PictureBlock;

export type MarkdownProblem = { line?: number; message: string };

const SUPPORTED =
  'Only paragraphs, ## headings, **bold**, *italic*, links, lists, "> quotes" and pictures work here';

/** A table row of dashes: "| --- | --- |". remark-parse reads tables as plain text, so we look for it. */
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/m;

const lineOf = (node: Nodes): number | undefined => node.position?.start.line;

/** All the words inside a node, without any styling. */
function plainText(node: Nodes): string {
  if ('value' in node && typeof node.value === 'string') return node.value;
  if ('children' in node) return (node.children as Nodes[]).map(plainText).join('');
  return '';
}

/** Two neighbouring spans with the same styling become one. */
function tidy(spans: Span[]): Span[] {
  const out: Span[] = [];
  for (const span of spans) {
    if (span.text === '') continue;
    const last = out[out.length - 1];
    if (last && last.bold === span.bold && last.italic === span.italic && last.href === span.href) {
      last.text += span.text;
    } else {
      out.push({ ...span });
    }
  }
  return out;
}

export function markdownToBlocks(markdown: string): { blocks: DraftBlock[]; problems: MarkdownProblem[] } {
  const problems: MarkdownProblem[] = [];
  const refuse = (node: Nodes, what: string) => {
    const problem = { line: lineOf(node), message: `${what} cannot be used in the text. ${SUPPORTED}.` };
    // "<b>word</b>" is two pieces of HTML on one line: say it once.
    if (!problems.some((p) => p.line === problem.line && p.message === problem.message)) problems.push(problem);
  };

  /** The words of a paragraph, each with its styling. */
  function spansOf(nodes: PhrasingContent[], style: Omit<Span, 'text'> = {}): Span[] {
    const spans: Span[] = [];
    for (const node of nodes) {
      switch (node.type) {
        case 'text':
          // A line break inside a paragraph is only a space.
          spans.push({ text: node.value.replace(/\s*\n\s*/g, ' '), ...style });
          break;
        case 'strong':
          spans.push(...spansOf(node.children, { ...style, bold: true }));
          break;
        case 'emphasis':
          spans.push(...spansOf(node.children, { ...style, italic: true }));
          break;
        case 'break':
          spans.push({ text: '\n', ...style });
          break;
        case 'link':
          if (!/^https?:\/\/\S+$/.test(node.url)) {
            problems.push({
              line: lineOf(node),
              message: `The link "${node.url}" must be a full web address starting with https://.`,
            });
          }
          spans.push(...spansOf(node.children, { ...style, href: node.url }));
          break;
        case 'image':
          problems.push({
            line: lineOf(node),
            message: 'A picture must stand alone on its own line, with an empty line before and after it.',
          });
          break;
        case 'inlineCode':
          refuse(node, 'Code (text between backticks)');
          break;
        case 'html':
          refuse(node, 'HTML');
          break;
        default:
          refuse(node, 'This kind of formatting');
      }
    }
    return tidy(spans);
  }

  /** The words of a list item or a quote: its paragraphs, joined by a space. */
  function spansOfParagraphs(children: BlockContent[] | RootContent[], container: string): Span[] {
    const spans: Span[] = [];
    for (const child of children) {
      if (child.type === 'paragraph') {
        if (spans.length > 0) spans.push({ text: ' ' });
        spans.push(...spansOf(child.children));
      } else {
        problems.push({
          line: lineOf(child),
          message: `${container} can only hold plain sentences: write what is inside it as simple text.`,
        });
      }
    }
    return tidy(spans);
  }

  const tree = unified().use(remarkParse).parse(markdown);
  const blocks: DraftBlock[] = [];

  for (const node of tree.children) {
    switch (node.type) {
      case 'heading':
        if (node.depth === 2 || node.depth === 3) {
          blocks.push({ type: 'heading', level: node.depth, text: plainText(node).trim() });
        } else {
          problems.push({
            line: lineOf(node),
            message: `A heading must start with ## or ### (found ${'#'.repeat(node.depth)}).`,
          });
        }
        break;

      case 'paragraph': {
        const only = node.children.length === 1 ? node.children[0] : undefined;
        if (only?.type === 'image') {
          if (!only.alt || only.alt.trim() === '') {
            problems.push({
              line: lineOf(node),
              message: `The picture "${only.url}" needs a description between the square brackets: ![what the photo shows](${only.url}).`,
            });
          }
          blocks.push({ type: 'picture', file: only.url, alt: (only.alt ?? '').trim(), line: lineOf(node) });
        } else if (TABLE_RULE.test(plainText(node))) {
          refuse(node, 'A table');
        } else {
          blocks.push({ type: 'paragraph', spans: spansOf(node.children) });
        }
        break;
      }

      case 'list':
        blocks.push({
          type: 'list',
          ordered: !!node.ordered,
          items: node.children.map((item) => spansOfParagraphs(item.children, 'A list item')),
        });
        break;

      case 'blockquote':
        blocks.push({ type: 'quote', spans: spansOfParagraphs(node.children, 'A line set apart with ">"') });
        break;

      case 'code':
        refuse(node, 'A block of code');
        break;
      case 'html':
        refuse(node, 'HTML');
        break;
      case 'thematicBreak':
        refuse(node, 'A dividing line (---)');
        break;
      case 'table':
        refuse(node, 'A table');
        break;
      default:
        refuse(node, 'This kind of formatting');
    }
  }

  return { blocks, problems };
}
