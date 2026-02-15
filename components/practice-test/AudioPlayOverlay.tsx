"use client";

import { Box, Flex, Text, Button, VStack } from "@chakra-ui/react";
import { Headphones, Play } from "lucide-react";

interface AudioPlayOverlayProps {
  onPlay: () => void;
}

/**
 * Semi-transparent overlay shown before the listening test begins.
 * Displays a headphone icon and a Play button to start audio + timer.
 */
export default function AudioPlayOverlay({ onPlay }: AudioPlayOverlayProps) {
  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={50}
      bg="blackAlpha.700"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack gap={6} textAlign="center" maxW="400px" px={6}>
        {/* Headphone icon */}
        <Flex
          w="100px"
          h="100px"
          borderRadius="full"
          bg="whiteAlpha.200"
          align="center"
          justify="center"
        >
          <Headphones size={48} color="white" />
        </Flex>

        {/* Instruction text */}
        <VStack gap={2}>
          <Text
            color="white"
            fontSize="lg"
            fontStyle="italic"
            lineHeight="tall"
          >
            You will be listening to an audio clip during this test. Make sure
            your speakers or headphones are working properly.
          </Text>
          <Text color="whiteAlpha.800" fontSize="md">
            To continue, click <strong>Play</strong>.
          </Text>
        </VStack>

        {/* Play button */}
        <Button
          size="lg"
          colorPalette="red"
          borderRadius="full"
          px={10}
          gap={2}
          onClick={onPlay}
          fontWeight="semibold"
          fontSize="md"
        >
          <Play size={20} fill="currentColor" />
          Play
        </Button>
      </VStack>
    </Box>
  );
}
