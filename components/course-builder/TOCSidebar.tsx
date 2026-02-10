"use client";

import { Box, Text, Icon, VStack } from "@chakra-ui/react";
import { FileText, Trash2, GripVertical, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Section, Lesson } from "./types";

interface Props {
  sections: Section[];
  activeLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onAddSection: () => void;
  onRenameSection: (id: string, title: string) => void;
  onDeleteSection: (id: string) => void;
  onAddLesson: (sectionId: string) => void;
  onDeleteLesson: (id: string) => void;
  onReorderLessons: (sectionId: string, lessons: Lesson[]) => void;
}

function SortableLesson({
  lesson,
  isActive,
  onClick,
  onDelete,
}: {
  lesson: Lesson;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      display="flex"
      alignItems="center"
      gap={1.5}
      px={2.5}
      py={1.5}
      pl={7}
      rounded="md"
      cursor="pointer"
      bg={isActive ? "blue.50" : "transparent"}
      color={isActive ? "blue.600" : "gray.600"}
      _dark={{
        bg: isActive ? "blue.900" : "transparent",
        color: isActive ? "blue.300" : "gray.400",
      }}
      fontWeight={isActive ? "600" : "normal"}
      fontSize="sm"
      _hover={{
        bg: isActive ? "blue.50" : "gray.50",
        _dark: { bg: isActive ? "blue.900" : "gray.700" },
      }}
      transition="all 0.1s"
      onClick={onClick}
      role="group"
    >
      {/* Drag handle */}
      <Box
        {...attributes}
        {...listeners}
        cursor="grab"
        color="gray.300"
        _hover={{ color: "gray.500" }}
        transition="opacity 0.15s"
        flexShrink={0}
        onClick={(e) => e.stopPropagation()}
      >
        <Icon><GripVertical size={12} /></Icon>
      </Box>

      <Icon color={isActive ? "blue.500" : "gray.400"} flexShrink={0}>
        <FileText size={14} />
      </Icon>
      <Text
        flex={1}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {lesson.title || "Untitled Page"}
      </Text>

      {/* Delete button */}
      <Box
        as="button"
        w={5}
        h={5}
        display="flex"
        alignItems="center"
        justifyContent="center"
        rounded="sm"
        color="gray.400"
        _hover={{ color: "red.500" }}
        transition="all 0.15s"
        flexShrink={0}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Icon color="inherit"><Trash2 size={12} /></Icon>
      </Box>
    </Box>
  );
}

function SectionName({
  title,
  onRename,
}: {
  title: string;
  onRename: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (val !== title) onRename(val);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (val !== title) onRename(val);
          }
        }}
        style={{
          border: "none",
          outline: "none",
          fontWeight: 700,
          fontSize: "0.875rem",
          background: "transparent",
          width: "100%",
          fontFamily: "inherit",
          padding: 0,
        }}
      />
    );
  }

  return (
    <Text
      flex={1}
      fontWeight="700"
      fontSize="sm"
      onDoubleClick={() => setEditing(true)}
      cursor="default"
    >
      {title}
    </Text>
  );
}

export default function TOCSidebar({
  sections,
  activeLessonId,
  onSelectLesson,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onAddLesson,
  onDeleteLesson,
  onReorderLessons,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const section = sections.find((s) => s.id === sectionId);
    if (!section?.lessons) return;
    const oldIdx = section.lessons.findIndex((l) => l.id === active.id);
    const newIdx = section.lessons.findIndex((l) => l.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(section.lessons, oldIdx, newIdx).map(
      (l, i) => ({ ...l, position: i + 1 }),
    );
    onReorderLessons(sectionId, reordered);
  };

  return (
    <Box
      w="260px"
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderRightWidth="1px"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      flexShrink={0}
    >
      {/* Header */}
      <Box px={4} pt={4} pb={3}>
        <Text
          fontSize="sm"
          fontWeight="600"
          color="gray.700"
          _dark={{ color: "gray.300" }}
        >
          ☰ Table of Contents
        </Text>
      </Box>

      {/* Body */}
      <Box flex={1} overflowY="auto" px={2} pb={2}>
        {sections.map((sec) => (
          <Box key={sec.id} mb={1}>
            {/* Section title */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={2.5}
              py={2}
              rounded="md"
              _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
              role="group"
            >
              <SectionName
                title={sec.title}
                onRename={(v) => onRenameSection(sec.id, v)}
              />
              <Box
                as="button"
                w={5}
                h={5}
                display="flex"
                alignItems="center"
                justifyContent="center"
                rounded="sm"
                color="gray.400"
                _hover={{ color: "red.500" }}
                transition="opacity 0.15s"
                onClick={() => onDeleteSection(sec.id)}
              >
                <Icon color="red.500"><Trash2 size={12} /></Icon>
              </Box>
            </Box>

            {/* Lessons (sortable) */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(sec.id)}
            >
              <SortableContext
                items={(sec.lessons || []).map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {(sec.lessons || []).map((l) => (
                  <SortableLesson
                    key={l.id}
                    lesson={l}
                    isActive={activeLessonId === l.id}
                    onClick={() => onSelectLesson(l.id)}
                    onDelete={() => onDeleteLesson(l.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add page button */}
            <Box display="flex" justifyContent="center" py={1} pl={7}>
              <Box
                as="button"
                w={5}
                h={5}
                rounded="full"
                bg="blue.500"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="sm"
                _hover={{
                  transform: "scale(1.1)",
                  bg: "blue.600",
                }}
                transition="all 0.15s"
                onClick={() => onAddLesson(sec.id)}
              >
                <Icon><Plus size={12} /></Icon>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box px={4} py={3} borderTopWidth="1px">
        <Box
          as="button"
          w="full"
          px={2}
          py={2}
          display="flex"
          alignItems="center"
          gap={1.5}
          rounded="md"
          fontSize="sm"
          fontWeight="500"
          color="gray.500"
          cursor="pointer"
          _hover={{
            bg: "gray.100",
            color: "gray.700",
            _dark: { bg: "gray.700", color: "gray.300" },
          }}
          onClick={onAddSection}
        >
          <Icon><Plus size={14} /></Icon> Add Section
        </Box>
      </Box>
    </Box>
  );
}
