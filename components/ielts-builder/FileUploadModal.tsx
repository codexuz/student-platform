"use client";

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  HStack,
  Icon,
  Input,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Upload, FileAudio, ImageIcon, CheckCircle } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { uploadAPI } from "@/lib/teacher-api";

type UploadType = "audio" | "image" | "transcript";

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  type: UploadType;
  onUploaded: (url: string, fileName?: string) => void;
}

export default function FileUploadModal({
  open,
  onClose,
  type,
  onUploaded,
}: FileUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const accept =
    type === "audio"
      ? "audio/*,.mp3,.wav,.ogg,.flac,.m4a"
      : type === "transcript"
        ? ".vtt,.srt,.txt"
        : "image/*,.jpg,.jpeg,.png,.gif,.webp,.svg";

  const label =
    type === "audio" ? "audio" : type === "transcript" ? "transcript" : "image";
  const maxSize = type === "audio" ? 100 : 10; // MB

  const LabelIcon =
    type === "audio"
      ? FileAudio
      : type === "transcript"
        ? FileAudio
        : ImageIcon;

  const reset = () => {
    setError("");
    setUploadedUrl("");
    setFileName("");
    setProgress(0);
    setUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = useCallback(
    async (file: File) => {
      const isValid =
        type === "audio"
          ? file.type.startsWith("audio/") ||
            /\.(mp3|wav|ogg|flac|m4a)$/i.test(file.name)
          : type === "transcript"
            ? /\.(vtt|srt|txt)$/i.test(file.name)
            : file.type.startsWith("image/") ||
              /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

      if (!isValid) {
        setError(`Please select a valid ${label} file`);
        return;
      }

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

        const url = result?.url ?? result?.data?.url ?? result?.file_url ?? "";
        if (url) {
          setUploadedUrl(url);
          setFileName(file.name);
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
    [type, label, maxSize],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (uploadedUrl) {
      onUploaded(uploadedUrl, fileName);
      handleClose();
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
      }}
      size="md"
      placement="center"
      motionPreset="scale"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                <HStack gap={2}>
                  <Icon as={LabelIcon} />
                  <Text>
                    Upload{" "}
                    {type === "audio"
                      ? "Audio"
                      : type === "transcript"
                        ? "Transcript"
                        : "Image"}
                  </Text>
                </HStack>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <VStack gap={4} alignItems="stretch">
                {/* Drop zone */}
                <Box
                  border="2px dashed"
                  borderColor={
                    dragOver
                      ? "blue.400"
                      : uploadedUrl
                        ? "green.400"
                        : "gray.300"
                  }
                  rounded="lg"
                  p={8}
                  textAlign="center"
                  cursor="pointer"
                  bg={
                    dragOver ? "blue.50" : uploadedUrl ? "green.50" : "gray.50"
                  }
                  _dark={{
                    bg: dragOver
                      ? "blue.900"
                      : uploadedUrl
                        ? "green.900"
                        : "gray.700",
                    borderColor: dragOver
                      ? "blue.500"
                      : uploadedUrl
                        ? "green.500"
                        : "gray.600",
                  }}
                  transition="all 0.2s"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    style={{ display: "none" }}
                    onChange={onInputChange}
                  />
                  <VStack gap={2}>
                    {uploadedUrl ? (
                      <>
                        <Icon
                          as={CheckCircle}
                          fontSize="2xl"
                          color="green.500"
                        />
                        <Text fontSize="sm" fontWeight="600" color="green.600">
                          File uploaded successfully!
                        </Text>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          wordBreak="break-all"
                        >
                          {fileName}
                        </Text>
                      </>
                    ) : uploading ? (
                      <>
                        <Text fontSize="sm" fontWeight="500" color="gray.600">
                          Uploading... {progress}%
                        </Text>
                        <Box
                          w="full"
                          h="2"
                          bg="gray.200"
                          rounded="full"
                          overflow="hidden"
                        >
                          <Box
                            h="full"
                            bg="blue.500"
                            rounded="full"
                            transition="width 0.3s"
                            w={`${progress}%`}
                          />
                        </Box>
                      </>
                    ) : (
                      <>
                        <Icon as={Upload} fontSize="2xl" color="gray.400" />
                        <Text fontSize="sm" fontWeight="500" color="gray.600">
                          Drag & drop or click to upload {label}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          Max {maxSize}MB
                        </Text>
                      </>
                    )}
                  </VStack>
                </Box>

                {/* URL input alternative */}
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Or paste a URL directly:
                  </Text>
                  <Input
                    placeholder={`https://example.com/${label}.${type === "audio" ? "mp3" : type === "transcript" ? "vtt" : "jpg"}`}
                    value={uploadedUrl}
                    onChange={(e) => {
                      setUploadedUrl(e.target.value);
                      setFileName("");
                    }}
                    size="sm"
                  />
                </Box>

                {error && (
                  <Text fontSize="sm" color="red.500">
                    {error}
                  </Text>
                )}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap={2}>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  bg="#4f46e5"
                  color="white"
                  _hover={{ bg: "#4338ca" }}
                  size="sm"
                  disabled={!uploadedUrl || uploading}
                  onClick={handleConfirm}
                >
                  Confirm
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
