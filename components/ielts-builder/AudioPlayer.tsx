"use client";

import { Box, HStack, Icon, IconButton, Text } from "@chakra-ui/react";
import { Play, Pause, Volume2, RotateCcw } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  src: string;
  fileName?: string;
  /** Compact mode for inline use */
  compact?: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  src,
  fileName,
  compact = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Pause & reload when src changes (DOM-only, no setState)
    audio.pause();
    audio.currentTime = 0;
    audio.load();

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(false);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onError = () => setError(true);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => setError(true));
    }
  }, [playing]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    if (!playing) {
      audio.play().catch(() => setError(true));
      setPlaying(true);
    }
  }, [playing]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const pct = x / rect.width;
      audio.currentTime = pct * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <HStack
        px={3}
        py={2}
        bg="red.50"
        _dark={{ bg: "red.900", borderColor: "red.700" }}
        rounded="md"
        borderWidth="1px"
        borderColor="red.200"
      >
        <Icon as={Volume2} fontSize="sm" color="red.400" />
        <Text fontSize="xs" color="red.500" flex="1">
          Unable to load audio
        </Text>
      </HStack>
    );
  }

  return (
    <Box
      bg="gray.50"
      _dark={{ bg: "gray.700", borderColor: "gray.600" }}
      rounded="lg"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <HStack px={3} py={compact ? 2 : 2.5} gap={3}>
        {/* Play / Pause */}
        <IconButton
          aria-label={playing ? "Pause" : "Play"}
          size="xs"
          rounded="full"
          bg={playing ? "#4f46e5" : "#10b981"}
          color="white"
          _hover={{ opacity: 0.85 }}
          onClick={togglePlay}
          variant="solid"
        >
          <Icon as={playing ? Pause : Play} fontSize="xs" />
        </IconButton>

        {/* Progress area */}
        <Box flex="1">
          {fileName && !compact && (
            <Text
              fontSize="xs"
              fontWeight="600"
              color="gray.700"
              _dark={{ color: "gray.200" }}
              mb={1}
              truncate
            >
              {fileName}
            </Text>
          )}

          {/* Progress bar */}
          <Box
            ref={progressRef}
            h="6px"
            bg="gray.200"
            _dark={{ bg: "gray.600" }}
            rounded="full"
            cursor="pointer"
            onClick={handleSeek}
            position="relative"
          >
            <Box
              h="full"
              bg={playing ? "#4f46e5" : "#10b981"}
              rounded="full"
              transition="width 0.1s linear"
              w={`${progress}%`}
            />
            {/* Thumb */}
            <Box
              position="absolute"
              top="50%"
              left={`${progress}%`}
              transform="translate(-50%, -50%)"
              w="12px"
              h="12px"
              bg="white"
              borderWidth="2px"
              borderColor={playing ? "#4f46e5" : "#10b981"}
              rounded="full"
              shadow="sm"
              opacity={duration > 0 ? 1 : 0}
              transition="opacity 0.2s"
            />
          </Box>
        </Box>

        {/* Time */}
        <Text
          fontSize="xs"
          color="gray.500"
          fontFamily="mono"
          whiteSpace="nowrap"
          minW="70px"
          textAlign="right"
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>

        {/* Restart */}
        <IconButton
          aria-label="Restart"
          size="xs"
          variant="ghost"
          color="gray.400"
          _hover={{ color: "gray.600" }}
          onClick={restart}
        >
          <Icon as={RotateCcw} fontSize="xs" />
        </IconButton>
      </HStack>
    </Box>
  );
}
