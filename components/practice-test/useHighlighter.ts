"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface HighlightEntry {
  id: string;
  /** Serialisable range descriptor so we can re-apply after re-render */
  startContainerPath: number[];
  startOffset: number;
  endContainerPath: number[];
  endOffset: number;
  text: string;
}

export interface PopupState {
  visible: boolean;
  x: number;
  y: number;
  /** When set, the popup is for deleting an existing highlight */
  highlightId: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Build an index-path from `node` up to `root` (exclusive). */
function nodeToPath(node: Node, root: Node): number[] {
  const path: number[] = [];
  let current: Node | null = node;
  while (current && current !== root) {
    const parent: Node | null = current.parentNode;
    if (!parent) break;
    path.unshift(Array.from(parent.childNodes).indexOf(current as ChildNode));
    current = parent;
  }
  return path;
}

let nextId = 1;

const HIGHLIGHT_ATTR = "data-highlight-id";
const HIGHLIGHT_CLASS = "text-highlight";

// ─── Text-search helper for re-applying highlights after DOM changes ───

/**
 * Walk all text nodes inside `root` (skipping existing <mark> highlights),
 * build a flat string, find `searchText` in it, and return a Range that
 * covers exactly that substring.  Returns null when the text cannot be found.
 */
function findTextRange(root: Node, searchText: string): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const segments: { node: Text; start: number }[] = [];
  let fullText = "";

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    // Skip text that lives inside an existing highlight <mark>
    if (
      (node.parentElement as HTMLElement | null)?.closest(
        `mark.${HIGHLIGHT_CLASS}`,
      )
    ) {
      continue;
    }
    segments.push({ node, start: fullText.length });
    fullText += node.textContent ?? "";
  }

  const idx = fullText.indexOf(searchText);
  if (idx === -1) return null;

  const endIdx = idx + searchText.length;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;

  for (const seg of segments) {
    const segEnd = seg.start + (seg.node.textContent?.length ?? 0);

    if (!startNode && idx >= seg.start && idx < segEnd) {
      startNode = seg.node;
      startOffset = idx - seg.start;
    }
    if (endIdx > seg.start && endIdx <= segEnd) {
      endNode = seg.node;
      endOffset = endIdx - seg.start;
      break;
    }
  }

  if (!startNode || !endNode) return null;

  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useHighlighter() {
  const [highlights, setHighlights] = useState<HighlightEntry[]>([]);
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    x: 0,
    y: 0,
    highlightId: null,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // ── Re-apply highlights that were lost after a React re-render ────────
  // Runs synchronously before paint so the user never sees a flicker.

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || highlights.length === 0) return;

    for (const entry of highlights) {
      const existing = root.querySelectorAll(
        `mark[${HIGHLIGHT_ATTR}="${entry.id}"]`,
      );
      if (existing.length > 0) continue; // still in the DOM

      // Mark was removed by a React re-render — restore it
      const range = findTextRange(root, entry.text);
      if (range) {
        wrapRange(range, entry.id);
      }
    }
  }); // intentionally no deps — runs after every render

  // ── Close popup ────────────────────────────────────────────────────────

  const closePopup = useCallback(() => {
    setPopup({ visible: false, x: 0, y: 0, highlightId: null });
    savedRangeRef.current = null;
  }, []);

  // ── Wrap a Range in <mark> elements ────────────────────────────────────

  const wrapRange = useCallback((range: Range, id: string) => {
    // Collect text nodes within the range
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
    );

    while (walker.nextNode()) {
      const n = walker.currentNode as Text;
      if (range.intersectsNode(n)) textNodes.push(n);
    }

    // If common ancestor is itself a text node
    if (
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE &&
      textNodes.length === 0
    ) {
      textNodes.push(range.commonAncestorContainer as Text);
    }

    for (const textNode of textNodes) {
      const start = textNode === range.startContainer ? range.startOffset : 0;
      const end =
        textNode === range.endContainer ? range.endOffset : textNode.length;

      if (start >= end) continue;

      const mark = document.createElement("mark");
      mark.setAttribute(HIGHLIGHT_ATTR, id);
      mark.className = HIGHLIGHT_CLASS;
      mark.style.backgroundColor = "#fef08a"; // yellow-200
      mark.style.borderRadius = "2px";
      mark.style.cursor = "pointer";

      const highlightedText = textNode.splitText(start);
      highlightedText.splitText(end - start);

      const clone = highlightedText.cloneNode(true);
      mark.appendChild(clone);
      highlightedText.parentNode!.replaceChild(mark, highlightedText);
    }
  }, []);

  // ── Add highlight ──────────────────────────────────────────────────────

  const addHighlight = useCallback(() => {
    // Use the saved range from when the popup was shown
    const range = savedRangeRef.current;
    if (!range || range.collapsed) {
      closePopup();
      return;
    }

    const root = containerRef.current;
    if (!root) {
      closePopup();
      return;
    }

    const id = `hl-${nextId++}`;

    const entry: HighlightEntry = {
      id,
      startContainerPath: nodeToPath(range.startContainer, root),
      startOffset: range.startOffset,
      endContainerPath: nodeToPath(range.endContainer, root),
      endOffset: range.endOffset,
      text: range.toString(),
    };

    wrapRange(range, id);

    // Clear browser selection
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();

    setHighlights((prev) => [...prev, entry]);
    closePopup();
  }, [closePopup, wrapRange]);

  // ── Remove highlight ──────────────────────────────────────────────────

  const removeHighlight = useCallback(
    (id: string) => {
      const root = containerRef.current;
      if (!root) return;

      const marks = root.querySelectorAll(`mark[${HIGHLIGHT_ATTR}="${id}"]`);
      marks.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize(); // merge adjacent text nodes
      });

      setHighlights((prev) => prev.filter((h) => h.id !== id));
      closePopup();
    },
    [closePopup],
  );

  // ── Mouse-up handler (show popup on selection or highlight click) ─────

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // First, clear any stale selection state
      const sel = window.getSelection();

      // Check if user clicked on an existing highlight <mark>
      const target = e.target as HTMLElement;
      const mark = target.closest(`mark.${HIGHLIGHT_CLASS}`);
      if (mark) {
        const hId = mark.getAttribute(HIGHLIGHT_ATTR);
        if (hId) {
          // Clear selection so it doesn't interfere
          if (sel) sel.removeAllRanges();

          const rect = mark.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          setPopup({
            visible: true,
            x: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
            y: rect.bottom - (containerRect?.top ?? 0) + 4,
            highlightId: hId,
          });
          return;
        }
      }

      // Check for new text selection
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        closePopup();
        return;
      }

      const range = sel.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      setPopup({
        visible: true,
        x: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
        y: rect.bottom - (containerRect?.top ?? 0) + 4,
        highlightId: null,
      });
    },
    [closePopup],
  );

  return {
    containerRef,
    highlights,
    popup,
    addHighlight,
    removeHighlight,
    closePopup,
    handleMouseUp,
  };
}
