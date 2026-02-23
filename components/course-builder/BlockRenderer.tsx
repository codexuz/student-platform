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
import { GripVertical, Trash2, Upload, X, Search } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { ContentBlock, VideoTrack } from "./types";
import FileUploadZone from "./FileUploadZone";
import { uploadAPI } from "@/lib/teacher-api";
import IeltsPracticePickerModal from "./IeltsPracticePickerModal";
import AudioPlayer from "@/components/ielts-builder/AudioPlayer";

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

function getFileTypeLabel(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  const labels: Record<string, string> = {
    pdf: "PDF Document",
    doc: "Word Document",
    docx: "Word Document",
    xls: "Excel Spreadsheet",
    xlsx: "Excel Spreadsheet",
    csv: "CSV File",
    txt: "Text File",
    zip: "ZIP Archive",
    rar: "RAR Archive",
    "7z": "7z Archive",
    mp3: "Audio File",
    wav: "Audio File",
    ogg: "Audio File",
    flac: "Audio File",
  };
  return labels[ext] || "File";
}

interface Props {
  block: ContentBlock;
  onChange: (content: string) => void;
  onRemove: () => void;
  onUrlChange: (url: string) => void;
  tracks?: VideoTrack[];
  onTracksChange?: (tracks: VideoTrack[]) => void;
}

const TRACK_LANGUAGES: { lang: VideoTrack["lang"]; label: string }[] = [
  { lang: "en", label: "English" },
  { lang: "uz", label: "O'zbekcha" },
  { lang: "ru", label: "Русский" },
];

function TrackUploadRow({
  track,
  onRemove,
}: {
  track: VideoTrack;
  onRemove: () => void;
}) {
  return (
    <HStack
      gap={2}
      p={2}
      bg="gray.50"
      _dark={{ bg: "gray.700" }}
      rounded="md"
      fontSize="sm"
    >
      <Text fontWeight="600" minW="90px">
        {track.label}
      </Text>
      <Text color="gray.500" flex={1} truncate fontSize="xs">
        {decodeURIComponent(track.src.split("/").pop() || track.src)}
      </Text>
      <Box
        as="button"
        p={1}
        rounded="sm"
        color="gray.400"
        _hover={{ color: "red.500", bg: "red.50", _dark: { bg: "red.900" } }}
        onClick={onRemove}
      >
        <X size={14} />
      </Box>
    </HStack>
  );
}

function TrackUploader({
  tracks,
  onTracksChange,
}: {
  tracks: VideoTrack[];
  onTracksChange: (tracks: VideoTrack[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingLang, setUploadingLang] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [pendingLang, setPendingLang] = useState<
    (typeof TRACK_LANGUAGES)[0] | null
  >(null);

  const existingLangs = new Set(tracks.map((t) => t.lang));
  const availableLangs = TRACK_LANGUAGES.filter(
    (l) => !existingLangs.has(l.lang),
  );

  const handleFile = useCallback(
    async (file: File, langInfo: (typeof TRACK_LANGUAGES)[0]) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["vtt", "srt"].includes(ext)) {
        setError("Only .vtt and .srt files are supported");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Track file must be smaller than 5MB");
        return;
      }

      setError("");
      setUploading(true);
      setUploadingLang(langInfo.lang);
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
          onTracksChange([
            ...tracks,
            { src: url, lang: langInfo.lang, label: langInfo.label },
          ]);
        } else {
          setError("Upload succeeded but no URL returned");
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
        setUploadingLang(null);
        setProgress(0);
        setPendingLang(null);
      }
    },
    [tracks, onTracksChange],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingLang) handleFile(file, pendingLang);
    e.target.value = "";
  };

  const removeTrack = (lang: string) => {
    onTracksChange(tracks.filter((t) => t.lang !== lang));
  };

  return (
    <Box
      mt={3}
      p={3}
      border="1px solid"
      borderColor="gray.200"
      _dark={{ borderColor: "gray.600" }}
      rounded="lg"
    >
      <Text
        fontSize="xs"
        fontWeight="700"
        color="gray.500"
        mb={2}
        textTransform="uppercase"
        letterSpacing="wide"
      >
        Subtitles / Captions
      </Text>

      <VStack gap={2} align="stretch">
        {tracks.map((track) => (
          <TrackUploadRow
            key={track.lang}
            track={track}
            onRemove={() => removeTrack(track.lang)}
          />
        ))}
      </VStack>

      {availableLangs.length > 0 && (
        <HStack mt={2} gap={2} flexWrap="wrap">
          {availableLangs.map((langInfo) => (
            <Button
              key={langInfo.lang}
              size="xs"
              variant="outline"
              disabled={uploading}
              onClick={() => {
                setPendingLang(langInfo);
                inputRef.current?.click();
              }}
            >
              {uploading && uploadingLang === langInfo.lang ? (
                `Uploading… ${progress}%`
              ) : (
                <>
                  <Upload size={12} />
                  {langInfo.label}
                </>
              )}
            </Button>
          ))}
        </HStack>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".vtt,.srt"
        style={{ display: "none" }}
        onChange={onInputChange}
      />

      {error && (
        <Text fontSize="xs" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
}

export default function BlockRenderer({
  block,
  onChange,
  onRemove,
  onUrlChange,
  tracks,
  onTracksChange,
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
        _hover={{
          color: "gray.600",
          bg: "gray.100",
          _dark: { color: "gray.300", bg: "gray.600" },
        }}
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
        _hover={{ color: "red.500", bg: "red.50", _dark: { bg: "red.900" } }}
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
              crossOrigin="anonymous"
              style={{ width: "100%", borderRadius: "8px", maxHeight: "400px" }}
            >
              {(tracks || []).map((t) => (
                <track
                  key={t.lang}
                  src={t.src}
                  kind="subtitles"
                  srcLang={t.lang}
                  label={t.label}
                />
              ))}
            </video>
            <Input
              mt={2}
              w="full"
              size="sm"
              value={block.content}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="Video URL"
            />
            {onTracksChange && (
              <TrackUploader
                tracks={tracks || []}
                onTracksChange={onTracksChange}
              />
            )}
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

  if (block.type === "audio") {
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
            <AudioPlayer
              src={block.content}
              fileName={decodeURIComponent(
                block.content.split("/").pop() || "Audio",
              )}
            />
            <Input
              mt={2}
              w="full"
              size="sm"
              value={block.content}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="Audio URL"
            />
          </Box>
        ) : (
          <FileUploadZone type="audio" onUploaded={(url) => onUrlChange(url)} />
        )}
      </Box>
    );
  }

  if (block.type === "document") {
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
            <a
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={3}
                p={4}
                border="1px solid"
                borderColor="gray.200"
                _dark={{ borderColor: "gray.600" }}
                rounded="lg"
                _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                transition="all 0.15s"
              >
                <Text fontSize="2xl">📄</Text>
                <Box flex={1} minW={0}>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="gray.700"
                    _dark={{ color: "gray.200" }}
                    truncate
                  >
                    {decodeURIComponent(
                      block.content.split("/").pop() || "Document",
                    )}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {getFileTypeLabel(block.content)}
                  </Text>
                </Box>
              </Box>
            </a>
            <Input
              mt={2}
              w="full"
              size="sm"
              value={block.content}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="File URL"
            />
          </Box>
        ) : (
          <FileUploadZone
            type="document"
            onUploaded={(url) => onUrlChange(url)}
          />
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

  if (block.type === "ielts_practice") {
    let parsed: { practiceType?: string; id?: string; label?: string } = {};
    try {
      parsed = block.content ? JSON.parse(block.content) : {};
    } catch {
      /* not yet valid JSON */
    }
    const practiceType = parsed.practiceType || "reading";
    const partId = parsed.id || "";
    const partLabel = parsed.label || "";

    const updatePractice = (fields: Record<string, string>) => {
      const next = { ...parsed, ...fields };
      onChange(JSON.stringify(next));
    };

    const practiceUrl = partId ? `/practice/${practiceType}/${partId}` : "";

    return (
      <IeltsPracticeBlock
        setNodeRef={setNodeRef}
        style={style}
        dragHandle={dragHandle}
        practiceType={practiceType}
        partId={partId}
        partLabel={partLabel}
        practiceUrl={practiceUrl}
        updatePractice={updatePractice}
      />
    );
  }

  return null;
}

// ─── IELTS Practice Block (extracted for state) ─────────────────────────────

function IeltsPracticeBlock({
  setNodeRef,
  style,
  dragHandle,
  practiceType,
  partId,
  partLabel,
  practiceUrl,
  updatePractice,
}: {
  setNodeRef: (el: HTMLElement | null) => void;
  style: React.CSSProperties;
  dragHandle: React.ReactNode;
  practiceType: string;
  partId: string;
  partLabel: string;
  practiceUrl: string;
  updatePractice: (fields: Record<string, string>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const typeIcon =
    practiceType === "reading"
      ? "📖"
      : practiceType === "listening"
        ? "🎧"
        : "✍️";

  const typeLabel =
    practiceType === "reading"
      ? "Reading Practice"
      : practiceType === "listening"
        ? "Listening Practice"
        : "Writing Practice";

  const colorScheme =
    practiceType === "reading"
      ? "blue"
      : practiceType === "listening"
        ? "purple"
        : "orange";

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
      <Box px={4} py={3}>
        <HStack gap={2} mb={3}>
          <Text fontSize="lg">{typeIcon}</Text>
          <Text
            fontSize="sm"
            fontWeight="700"
            color="gray.600"
            _dark={{ color: "gray.300" }}
          >
            IELTS Practice
          </Text>
        </HStack>

        <Button
          size="sm"
          variant="outline"
          w="full"
          mb={3}
          onClick={() => setPickerOpen(true)}
        >
          <Search size={14} />
          {partId
            ? `Change selection (${practiceType})`
            : "Browse Reading / Listening / Writing..."}
        </Button>

        <IeltsPracticePickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          initialTab={practiceType as "reading" | "listening" | "writing"}
          onSelect={(type, id, label) => {
            updatePractice({ practiceType: type, id, label });
          }}
        />

        {practiceUrl ? (
          <a
            href={practiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={3}
              p={3}
              border="1px solid"
              borderColor={`${colorScheme}.200`}
              rounded="lg"
              bg={`${colorScheme}.50`}
              _dark={{
                bg: `${colorScheme}.900`,
                borderColor: `${colorScheme}.700`,
              }}
              _hover={{ shadow: "md" }}
              transition="all 0.15s"
              cursor="pointer"
            >
              <Text fontSize="2xl">{typeIcon}</Text>
              <Box flex={1} minW={0}>
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="gray.700"
                  _dark={{ color: "gray.200" }}
                >
                  {typeLabel}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                  truncate
                >
                  {partLabel || partId}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Opens in student practice view
                </Text>
              </Box>
              <Text fontSize="xs" color="gray.400" fontWeight="600">
                OPEN →
              </Text>
            </Box>
          </a>
        ) : (
          <Box
            p={4}
            border="2px dashed"
            borderColor="gray.200"
            _dark={{ borderColor: "gray.600" }}
            rounded="lg"
            textAlign="center"
          >
            <Text fontSize="sm" color="gray.400">
              Click &quot;Browse&quot; above to select a reading part, listening
              part, or writing task
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
