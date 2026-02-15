"use client";

import { Box } from "@chakra-ui/react";
import { useHighlighter } from "./useHighlighter";
import HighlightPopup from "./HighlightPopup";

interface HighlightablePanelProps {
  children: React.ReactNode;
}

/**
 * Wraps any panel content with text-highlight capability.
 * Provides selection → Highlight popup and click-on-highlight → Delete popup.
 */
export default function HighlightablePanel({
  children,
}: HighlightablePanelProps) {
  const {
    containerRef,
    popup,
    addHighlight,
    removeHighlight,
    closePopup,
    handleMouseUp,
  } = useHighlighter();

  return (
    <Box
      ref={containerRef}
      position="relative"
      h="100%"
      onMouseUp={handleMouseUp}
    >
      {children}

      <HighlightPopup
        popup={popup}
        onHighlight={addHighlight}
        onDelete={removeHighlight}
        onClose={closePopup}
      />
    </Box>
  );
}
