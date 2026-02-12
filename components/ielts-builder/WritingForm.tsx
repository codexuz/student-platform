"use client";

import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useState } from "react";
import { ieltsWritingAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId } from "./types";

interface WritingFormProps {
  prefillTestId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function WritingForm({
  prefillTestId,
  onNavigate,
}: WritingFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testId, setTestId] = useState(prefillTestId || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string | undefined> = {
        title,
        description: description || undefined,
        test_id: testId || undefined,
      };
      const r = await ieltsWritingAPI.create(body);
      toaster.success({ title: `Writing created! ID: ${r.id}` });
      onNavigate("writings");
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <HStack gap={1.5} fontSize="sm" color="gray.400" mb={4}>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() => onNavigate("writings")}
        >
          Writings
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>Create Writing</Text>
      </HStack>

      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="lg"
        borderWidth="1px"
        shadow="sm"
      >
        <Box px={5} py={3.5} borderBottomWidth="1px">
          <Heading size="sm" fontWeight="600">
            Create Writing Section
          </Heading>
        </Box>
        <Box px={5} py={5}>
          <VStack gap={4} alignItems="stretch">
            <Box>
              <Text
                fontSize="xs"
                fontWeight="600"
                color="gray.600"
                _dark={{ color: "gray.400" }}
                mb={1}
                textTransform="uppercase"
                letterSpacing="0.3px"
              >
                Title
              </Text>
              <Input
                placeholder="e.g. Academic Writing Test"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Box>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="600"
                color="gray.600"
                _dark={{ color: "gray.400" }}
                mb={1}
                textTransform="uppercase"
                letterSpacing="0.3px"
              >
                Description
              </Text>
              <Textarea
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </Box>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="600"
                color="gray.600"
                _dark={{ color: "gray.400" }}
                mb={1}
                textTransform="uppercase"
                letterSpacing="0.3px"
              >
                Test ID
              </Text>
              <Input
                placeholder="UUID of the test"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
              />
            </Box>
            <HStack gap={2} pt={2}>
              <Button
                bg="#10b981"
                color="white"
                _hover={{ bg: "#059669" }}
                onClick={handleSave}
                loading={saving}
                size="sm"
              >
                <Save size={14} /> Save Writing
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("writings")}
                size="sm"
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
