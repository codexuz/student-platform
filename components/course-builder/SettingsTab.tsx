"use client";

import { Box, Heading, Text, Input, Button, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { ieltsCourseBuilderAPI } from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";
import type { Course } from "./types";

interface Props {
  course: Course;
  onUpdate: (updated: Course) => void;
}

type CourseStatus = "draft" | "published" | "archived";

export default function SettingsTab({ course, onUpdate }: Props) {
  const [title, setTitle] = useState(course.title || "");
  const [desc, setDesc] = useState(course.description || "");
  const [status, setStatus] = useState<CourseStatus>((course.status || "draft") as CourseStatus);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await ieltsCourseBuilderAPI.update(course.id, {
        title,
        description: desc || undefined,
        status,
      });
      onUpdate({ ...course, title, description: desc, status });
      toaster.success({ title: "Settings saved!" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save settings";
      toaster.error({ title: msg });
    }
    setSaving(false);
  };

  return (
    <Box flex={1} overflowY="auto" px={{ base: 4, md: 10 }} py={8}>
      <Box maxW="600px" mx="auto">
        <Heading size="md" fontWeight="700" mb={6}>
          Course Settings
        </Heading>

        <VStack gap={5} align="stretch">
          {/* Title */}
          <Box>
            <Text fontSize="sm" fontWeight="600" mb={1.5} color="gray.600" _dark={{ color: "gray.400" }}>
              Title
            </Text>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title"
            />
          </Box>

          {/* Description */}
          <Box>
            <Text fontSize="sm" fontWeight="600" mb={1.5} color="gray.600" _dark={{ color: "gray.400" }}>
              Description
            </Text>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Course description (optional)"
              rows={4}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--chakra-colors-gray-200, #e5e7eb)",
                fontSize: "0.875rem",
                lineHeight: "1.6",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                background: "var(--chakra-colors-bg)",
                color: "inherit",
              }}
            />
          </Box>

          {/* Status */}
          <Box>
            <Text fontSize="sm" fontWeight="600" mb={1.5} color="gray.600" _dark={{ color: "gray.400" }}>
              Status
            </Text>
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "draft" || v === "published" || v === "archived") {
                  setStatus(v);
                }
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--chakra-colors-gray-200, #e5e7eb)",
                fontSize: "0.875rem",
                cursor: "pointer",
                background: "var(--chakra-colors-bg)",
                color: "inherit",
                fontFamily: "inherit",
              }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Box>

          {/* Save button */}
          <Box pt={2}>
            <Button
              colorPalette="green"
              onClick={save}
              disabled={saving}
              size="sm"
            >
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
