"use client";

import { Box, Heading, Text } from "@chakra-ui/react";
import type { PageId } from "./types";

interface WritingTasksListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function WritingTasksList({
  onNavigate,
}: WritingTasksListProps) {
  return (
    <Box>
      <Heading size="md" fontWeight="700" mb={4}>
        📝 Writing Tasks
      </Heading>

      <Box textAlign="center" py={12} color="gray.400">
        <Text fontSize="4xl" mb={3}>
          📝
        </Text>
        <Heading size="sm" color="gray.500" mb={1}>
          Writing Tasks
        </Heading>
        <Text fontSize="sm">
          Create tasks from a Writing section (use &quot;+ Task&quot; button),
          or navigate to Writings first.
        </Text>
      </Box>
    </Box>
  );
}
