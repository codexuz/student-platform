"use client";

import { Box, Input, Text, VStack } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import BlockRenderer from "./BlockRenderer";
import type { Lesson, ContentBlock, BlockType } from "./types";

interface Props {
  lesson: Lesson;
  onSave: (lessonId: string, data: Record<string, unknown>) => void;
}

let nextBlockId = Date.now();
function genBlockId() {
  return nextBlockId++;
}

function parseBlocks(content?: ContentBlock[]): ContentBlock[] {
  if (Array.isArray(content) && content.length) {
    // Always assign unique IDs to avoid duplicate key issues
    const seen = new Set<number | string>();
    return content.map((b) => {
      let id = b.id;
      if (id == null || seen.has(id)) {
        id = genBlockId();
      }
      seen.add(id);
      return { ...b, id };
    });
  }
  return [];
}

export default function ContentEditor({ lesson, onSave }: Props) {
  const initialState = useMemo(
    () => ({
      title: lesson.title || "",
      blocks: parseBlocks(lesson.content),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [lesson.id, lesson.title, lesson.content],
  );

  const [title, setTitle] = useState(initialState.title);
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialState.blocks);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLessonId = useRef(lesson.id);

  // Sync state when lesson changes
  if (prevLessonId.current !== lesson.id) {
    prevLessonId.current = lesson.id;
    setTitle(initialState.title);
    setBlocks(initialState.blocks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const autoSave = useCallback(
    (newTitle: string, newBlocks: ContentBlock[]) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        onSave(lesson.id, {
          title: newTitle,
          content: newBlocks.map((b, i) => ({
            id: typeof b.id === "number" ? b.id : i + 1,
            type: b.type,
            content: b.content,
          })),
        });
      }, 1200);
    },
    [lesson.id, onSave],
  );

  const updateTitle = (v: string) => {
    setTitle(v);
    autoSave(v, blocks);
  };

  const updateBlock = (idx: number, content: string) => {
    const nb = [...blocks];
    nb[idx] = { ...nb[idx], content };
    setBlocks(nb);
    autoSave(title, nb);
  };

  const removeBlock = (idx: number) => {
    const nb = blocks.filter((_, i) => i !== idx);
    setBlocks(nb);
    autoSave(title, nb);
  };

  const updateBlockUrl = (idx: number, url: string) => {
    const nb = [...blocks];
    nb[idx] = { ...nb[idx], content: url };
    setBlocks(nb);
    autoSave(title, nb);
  };

  const addBlock = (type: BlockType, afterIdx: number) => {
    const nb = [...blocks];
    nb.splice(afterIdx + 1, 0, { id: genBlockId(), type, content: "" });
    setBlocks(nb);
  };

  // Public method for palette
  const addBlockFromPalette = useCallback((type: BlockType) => {
    setBlocks((prev) => [...prev, { id: genBlockId(), type, content: "" }]);
  }, []);

  // Expose method via ref on window for palette
  useEffect(() => {
    const win = window as Window & {
      __addBlockFromPalette?: (type: BlockType) => void;
    };
    win.__addBlockFromPalette = addBlockFromPalette;
    return () => {
      delete win.__addBlockFromPalette;
    };
  }, [addBlockFromPalette]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(blocks, oldIdx, newIdx);
    setBlocks(reordered);
    autoSave(title, reordered);
  };

  return (
    <Box
      flex={1}
      overflowY="auto"
      display="flex"
      flexDirection="column"
      alignItems="center"
      px={6}
      py={8}
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
    >
      <Box w="full" maxW="720px">
        {/* Page title */}
        <Input
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Untitled Page"
          variant="flushed"
          fontSize="2xl"
          fontWeight="800"
          mb={5}
        />

        {/* Blocks with drag & drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.map((block, idx) => (
              <BlockRenderer
                key={block.id}
                block={block}
                onChange={(content) => updateBlock(idx, content)}
                onRemove={() => removeBlock(idx)}
                onUrlChange={(url) => updateBlockUrl(idx, url)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Single add-block button at bottom */}
        <VStack py={4} gap={2}>
          <Box
            as="button"
            w={7}
            h={7}
            rounded="full"
            bg="blue.500"
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            fontSize="lg"
            _hover={{ transform: "scale(1.1)", bg: "blue.600" }}
            transition="all 0.15s"
            onClick={() => addBlock("paragraph", blocks.length - 1)}
          >
            <Plus size={16} />
          </Box>
          {blocks.length === 0 && (
            <Text fontSize="sm" color="gray.400">
              Add your first block
            </Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
