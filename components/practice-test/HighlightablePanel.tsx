"use client";

import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { useHighlighter } from "./useHighlighter";
import HighlightPopup from "./HighlightPopup";
import CommentsDrawer from "./CommentsDrawer";

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
    highlights,
    popup,
    addHighlight,
    updateComment,
    removeHighlight,
    closePopup,
    handleMouseUp,
  } = useHighlighter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const handleAddComment = (id: string) => {
    if (id === "new-highlight-comment") {
      const newId = addHighlight("#fef08a") as unknown as string;
      if (newId) {
        setActiveHighlightId(newId);
        setDrawerOpen(true);
      }
      return;
    }
    setActiveHighlightId(id);
    setDrawerOpen(true);
    closePopup(); // Close the popup when opening drawer
  };

  const handleSaveComment = (comment: string) => {
    if (activeHighlightId) {
      updateComment(activeHighlightId, comment);
    }
  };

  const activeHighlight = highlights.find(h => h.id === activeHighlightId);

  return (
    <>
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
          onAddComment={handleAddComment}
          onClose={closePopup}
        />
      </Box>

      <CommentsDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setActiveHighlightId(null);
        }}
        comment={activeHighlight?.comment ?? ""}
        onSave={handleSaveComment}
      />
    </>
  );
}
