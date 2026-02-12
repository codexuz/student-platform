"use client";

import { Editor } from "@tiptap/react";
import * as React from "react";

interface RichTextEditorContextValue {
  editor: Editor | null;
}

export const RichTextEditorContext =
  React.createContext<RichTextEditorContextValue>({
    editor: null,
  });

export function useRichTextEditorContext() {
  const context = React.useContext(RichTextEditorContext);
  if (!context) {
    throw new Error(
      "useRichTextEditorContext must be used within a RichTextEditor.Root",
    );
  }
  return context;
}
