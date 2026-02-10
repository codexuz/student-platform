"use client";

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Icon,
  Input,
  Portal,
  Text,
} from "@chakra-ui/react";
import { GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { ContentBlock } from "./types";
import FileUploadZone from "./FileUploadZone";

function toYouTubeEmbed(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Already an embed URL
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
      u.pathname.startsWith("/embed/")
    ) {
      return url;
    }
    // Standard watch URL
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    // Short URL
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

interface Props {
  block: ContentBlock;
  onChange: (content: string) => void;
  onRemove: () => void;
  onUrlChange: (url: string) => void;
}

export default function BlockRenderer({
  block,
  onChange,
  onRemove,
  onUrlChange,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [embedUrlInput, setEmbedUrlInput] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandle = (
    <Box
      position="absolute"
      left="-44px"
      top="50%"
      transform="translateY(-50%)"
      display="flex"
      flexDirection="column"
      gap={0.5}
    >
      <Box
        {...attributes}
        {...listeners}
        as="button"
        w={7}
        h={7}
        bg="white"
        _dark={{ bg: "gray.700" }}
        rounded="sm"
        cursor="grab"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="gray.400"
        shadow="sm"
        _hover={{ color: "gray.600", bg: "gray.100" }}
      >
        <Icon>
          <GripVertical size={14} />
        </Icon>
      </Box>
      <Box
        as="button"
        w={7}
        h={7}
        bg="white"
        _dark={{ bg: "gray.700" }}
        rounded="sm"
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="gray.400"
        shadow="sm"
        _hover={{ color: "red.500", bg: "red.50" }}
        onClick={onRemove}
      >
        <Icon>
          <Trash2 size={14} />
        </Icon>
      </Box>
    </Box>
  );

  if (block.type === "heading") {
    return (
      <Box
        ref={setNodeRef}
        style={style}
        position="relative"
        mb={1}
        rounded="md"
        _hover={{ bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.50" } }}
        role="group"
      >
        {dragHandle}
        <Box
          contentEditable
          suppressContentEditableWarning
          px={4}
          py={3}
          fontSize="xl"
          fontWeight="700"
          outline="none"
          minH="40px"
          onBlur={(e: React.FocusEvent<HTMLDivElement>) =>
            onChange(e.currentTarget.textContent || "")
          }
          dangerouslySetInnerHTML={{
            __html: block.content || "Heading",
          }}
        />
      </Box>
    );
  }

  if (block.type === "paragraph") {
    return (
      <Box
        ref={setNodeRef}
        style={style}
        position="relative"
        mb={1}
        rounded="md"
        _hover={{ bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.50" } }}
        role="group"
      >
        {dragHandle}
        <Box
          contentEditable
          suppressContentEditableWarning
          px={4}
          py={3}
          fontSize="md"
          color="gray.600"
          _dark={{ color: "gray.400" }}
          lineHeight="1.7"
          outline="none"
          minH="40px"
          onBlur={(e: React.FocusEvent<HTMLDivElement>) =>
            onChange(e.currentTarget.textContent || "")
          }
          dangerouslySetInnerHTML={{
            __html: block.content || "Click to start writing…",
          }}
        />
      </Box>
    );
  }

  if (block.type === "video") {
    return (
      <Box
        ref={setNodeRef}
        style={style}
        position="relative"
        mb={1}
        rounded="md"
        _hover={{ bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.50" } }}
        role="group"
      >
        {dragHandle}
        {block.content ? (
          <Box px={4} py={3}>
            <video
              src={block.content}
              controls
              style={{ width: "100%", borderRadius: "8px", maxHeight: "400px" }}
            />
            <Input
              mt={2}
              w="full"
              size="sm"
              value={block.content}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="Video URL"
            />
          </Box>
        ) : (
          <FileUploadZone type="video" onUploaded={(url) => onUrlChange(url)} />
        )}
      </Box>
    );
  }

  if (block.type === "image") {
    return (
      <Box
        ref={setNodeRef}
        style={style}
        position="relative"
        mb={1}
        rounded="md"
        _hover={{ bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.50" } }}
        role="group"
      >
        {dragHandle}
        {block.content ? (
          <Box px={4} py={3}>
            <Image
              src={block.content}
              alt=""
              width={720}
              height={400}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "8px",
                maxHeight: "400px",
                objectFit: "cover",
              }}
              unoptimized
            />
            <Input
              mt={2}
              w="full"
              size="sm"
              value={block.content}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="Image URL"
            />
          </Box>
        ) : (
          <FileUploadZone type="image" onUploaded={(url) => onUrlChange(url)} />
        )}
      </Box>
    );
  }

  if (block.type === "embed") {
    const embedUrl = toYouTubeEmbed(block.content);
    return (
      <Box
        ref={setNodeRef}
        style={style}
        position="relative"
        mb={1}
        rounded="md"
        _hover={{ bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.50" } }}
        role="group"
      >
        {dragHandle}
        {block.content ? (
          <Box px={4} py={3}>
            {embedUrl ? (
              <Box
                position="relative"
                pb="56.25%"
                h={0}
                borderRadius="8px"
                overflow="hidden"
                bg="black"
              >
                <iframe
                  src={embedUrl}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              </Box>
            ) : (
              <Text fontSize="sm" color="red.400">
                Invalid YouTube URL
              </Text>
            )}
            <Input
              mt={2}
              w="full"
              size="sm"
              value={block.content}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="YouTube URL or embed URL"
            />
          </Box>
        ) : (
          <>
            <Box
              mx={4}
              my={3}
              bg="gray.50"
              _dark={{ bg: "gray.700" }}
              border="2px dashed"
              borderColor="gray.300"
              rounded="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
              gap={2}
              minH="120px"
              color="gray.400"
              cursor="pointer"
              _hover={{
                borderColor: "blue.400",
                color: "blue.500",
                bg: "blue.50",
                _dark: { bg: "blue.900" },
              }}
              onClick={() => {
                setEmbedUrlInput("");
                setEmbedModalOpen(true);
              }}
            >
              <Text fontSize="2xl">&lt;/&gt;</Text>
              <Text fontWeight="600" fontSize="sm">
                Paste a YouTube URL
              </Text>
            </Box>

            <Dialog.Root
              lazyMount
              open={embedModalOpen}
              onOpenChange={(e) => setEmbedModalOpen(e.open)}
            >
              <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content>
                    <Dialog.Header>
                      <Dialog.Title>Enter YouTube URL</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={embedUrlInput}
                        onChange={(e) => setEmbedUrlInput(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && embedUrlInput.trim()) {
                            onUrlChange(embedUrlInput.trim());
                            setEmbedModalOpen(false);
                          }
                        }}
                      />
                    </Dialog.Body>
                    <Dialog.Footer>
                      <Dialog.ActionTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </Dialog.ActionTrigger>
                      <Button
                        colorPalette="blue"
                        disabled={!embedUrlInput.trim()}
                        onClick={() => {
                          onUrlChange(embedUrlInput.trim());
                          setEmbedModalOpen(false);
                        }}
                      >
                        Embed
                      </Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                      <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>
          </>
        )}
      </Box>
    );
  }

  return null;
}
