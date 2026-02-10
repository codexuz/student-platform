"use client";

import { Box, Text } from "@chakra-ui/react";
import { Upload } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { uploadAPI } from "@/lib/teacher-api";

interface Props {
  /** "image" or "video" — used for accept filter and labels */
  type: "image" | "video";
  /** Called with the uploaded file URL on success */
  onUploaded: (url: string) => void;
}

export default function FileUploadZone({ type, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const accept = type === "image" ? "image/*" : "video/*";
  const label = type === "image" ? "image" : "video";
  const maxSize = type === "image" ? 10 : 100; // MB

  const handleFile = useCallback(
    async (file: File) => {
      // Validate type
      const isValid =
        type === "image"
          ? file.type.startsWith("image/")
          : file.type.startsWith("video/");
      if (!isValid) {
        setError(`Please select a valid ${label} file`);
        return;
      }

      // Validate size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File must be smaller than ${maxSize}MB`);
        return;
      }

      setError("");
      setUploading(true);
      setProgress(0);

      try {
        const result = await uploadAPI.uploadFile(file, {
          onUploadProgress: (event: ProgressEvent) => {
            const pct = Math.round((event.loaded / event.total) * 100);
            setProgress(pct);
          },
        });

        // The API may return { url: "..." } or { data: { url: "..." } }
        const url = result?.url ?? result?.data?.url ?? result?.file_url ?? "";
        if (url) {
          onUploaded(url);
        } else {
          setError("Upload succeeded but no URL returned");
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [type, label, maxSize, onUploaded],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Box
      mx={4}
      my={3}
      bg={dragOver ? "blue.50" : "gray.50"}
      _dark={{ bg: dragOver ? "blue.900" : "gray.700" }}
      border="2px dashed"
      borderColor={dragOver ? "blue.400" : "gray.300"}
      rounded="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap={2}
      minH="140px"
      color={dragOver ? "blue.500" : "gray.400"}
      cursor={uploading ? "default" : "pointer"}
      _hover={
        uploading
          ? {}
          : {
              borderColor: "blue.400",
              color: "blue.500",
              bg: "blue.50",
              _dark: { bg: "blue.900" },
            }
      }
      transition="all 0.15s"
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={onInputChange}
      />

      {uploading ? (
        <>
          {/* Progress bar */}
          <Box w="60%" h="6px" bg="gray.200" rounded="full" overflow="hidden">
            <Box
              h="100%"
              bg="blue.500"
              rounded="full"
              transition="width 0.2s"
              style={{ width: `${progress}%` }}
            />
          </Box>
          <Text fontSize="sm" fontWeight="600" color="blue.500">
            Uploading… {progress}%
          </Text>
        </>
      ) : (
        <>
          <Upload size={24} />
          <Text fontWeight="600" fontSize="sm">
            Click or drag to upload {label}
          </Text>
          <Text fontSize="xs" color="gray.400">
            Max {maxSize}MB
          </Text>
        </>
      )}

      {error && (
        <Text fontSize="xs" color="red.500" fontWeight="500">
          {error}
        </Text>
      )}
    </Box>
  );
}
