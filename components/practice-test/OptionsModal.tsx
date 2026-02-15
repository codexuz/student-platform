"use client";

import { useState } from "react";
import { Box, Flex, Text, IconButton } from "@chakra-ui/react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sun,
  ALargeSmall,
  Check,
} from "lucide-react";
import {
  useTestTheme,
  type ContrastMode,
  type TextSizeMode,
} from "./TestThemeContext";

type Screen = "main" | "contrast" | "text-size";

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTRAST_OPTIONS: { label: string; value: ContrastMode }[] = [
  { label: "Black on white", value: "black-on-white" },
  { label: "White on black", value: "white-on-black" },
  { label: "Yellow on black", value: "yellow-on-black" },
];

const TEXT_SIZE_OPTIONS: {
  label: string;
  value: TextSizeMode;
  preview: string;
}[] = [
  { label: "Small", value: "small", preview: "Aa" },
  { label: "Medium", value: "medium", preview: "Aa" },
  { label: "Large", value: "large", preview: "Aa" },
];

export default function OptionsModal({ isOpen, onClose }: OptionsModalProps) {
  const [screen, setScreen] = useState<Screen>("main");
  const { contrastMode, textSize, setContrastMode, setTextSize, colors } =
    useTestTheme();

  if (!isOpen) return null;

  const handleClose = () => {
    setScreen("main");
    onClose();
  };

  const handleBack = () => setScreen("main");

  // Determine modal colors based on current contrast
  const isDark = contrastMode !== "black-on-white";
  const modalBg = isDark ? "#1e1e2e" : "#ffffff";
  const modalText = isDark
    ? contrastMode === "yellow-on-black"
      ? "#f6c543"
      : "#e2e8f0"
    : "#1a202c";
  const modalTextSecondary = isDark
    ? contrastMode === "yellow-on-black"
      ? "#d4a843"
      : "#a0aec0"
    : "#718096";
  const dividerColor = isDark ? "#2d3748" : "#e2e8f0";
  const hoverBg = isDark ? "#2d3748" : "#f7fafc";
  const checkColor = contrastMode === "yellow-on-black" ? "#f6c543" : "#007AFF";

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.500"
        zIndex={100}
        onClick={handleClose}
      />

      {/* Modal */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={101}
        w="380px"
        maxW="90vw"
        bg={modalBg}
        borderRadius="xl"
        boxShadow="2xl"
        overflow="hidden"
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <Flex
          px={4}
          py={3}
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth="1px"
          borderColor={dividerColor}
        >
          {screen !== "main" ? (
            <Flex alignItems="center" gap={2} flex={1}>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Back"
                onClick={handleBack}
                color={colors.accentColor}
                borderRadius="full"
                minW="auto"
                _hover={{ bg: hoverBg }}
              >
                <ArrowLeft size={18} />
              </IconButton>
              <Text fontSize="xs" color={modalTextSecondary}>
                Options
              </Text>
            </Flex>
          ) : (
            <Box flex={1} />
          )}

          <Text
            fontWeight="bold"
            fontSize="md"
            color={modalText}
            textAlign="center"
          >
            {screen === "main"
              ? "Options"
              : screen === "contrast"
                ? "Contrast"
                : "Text size"}
          </Text>

          <Flex flex={1} justifyContent="flex-end">
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Close"
              onClick={handleClose}
              color={modalTextSecondary}
              borderRadius="full"
              _hover={{ bg: hoverBg }}
            >
              <X size={18} />
            </IconButton>
          </Flex>
        </Flex>

        {/* ─── Body ───────────────────────────────────────────── */}
        <Box px={2} py={2}>
          {/* Main screen */}
          {screen === "main" && (
            <>
              <OptionRow
                icon={<Sun size={18} />}
                label="Contrast"
                onClick={() => setScreen("contrast")}
                textColor={modalText}
                hoverBg={hoverBg}
                iconColor={modalTextSecondary}
              />
              <Box h="1px" bg={dividerColor} mx={2} />
              <OptionRow
                icon={<ALargeSmall size={18} />}
                label="Text size"
                onClick={() => setScreen("text-size")}
                textColor={modalText}
                hoverBg={hoverBg}
                iconColor={modalTextSecondary}
              />
            </>
          )}

          {/* Contrast screen */}
          {screen === "contrast" && (
            <>
              {CONTRAST_OPTIONS.map((opt, idx) => (
                <Box key={opt.value}>
                  <Flex
                    px={4}
                    py={3.5}
                    alignItems="center"
                    justifyContent="space-between"
                    cursor="pointer"
                    borderRadius="lg"
                    onClick={() => setContrastMode(opt.value)}
                    _hover={{ bg: hoverBg }}
                    transition="background 0.15s"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight={
                        contrastMode === opt.value ? "semibold" : "normal"
                      }
                      color={modalText}
                    >
                      {opt.label}
                    </Text>
                    {contrastMode === opt.value && (
                      <Check size={18} color={checkColor} />
                    )}
                  </Flex>
                  {idx < CONTRAST_OPTIONS.length - 1 && (
                    <Box h="1px" bg={dividerColor} mx={2} />
                  )}
                </Box>
              ))}
            </>
          )}

          {/* Text size screen */}
          {screen === "text-size" && (
            <>
              {TEXT_SIZE_OPTIONS.map((opt, idx) => (
                <Box key={opt.value}>
                  <Flex
                    px={4}
                    py={3.5}
                    alignItems="center"
                    justifyContent="space-between"
                    cursor="pointer"
                    borderRadius="lg"
                    onClick={() => setTextSize(opt.value)}
                    _hover={{ bg: hoverBg }}
                    transition="background 0.15s"
                  >
                    <Flex alignItems="center" gap={3}>
                      <Text
                        fontSize={
                          opt.value === "small"
                            ? "sm"
                            : opt.value === "medium"
                              ? "md"
                              : "lg"
                        }
                        fontWeight="semibold"
                        color={modalTextSecondary}
                      >
                        {opt.preview}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight={
                          textSize === opt.value ? "semibold" : "normal"
                        }
                        color={modalText}
                      >
                        {opt.label}
                      </Text>
                    </Flex>
                    {textSize === opt.value && (
                      <Check size={18} color={checkColor} />
                    )}
                  </Flex>
                  {idx < TEXT_SIZE_OPTIONS.length - 1 && (
                    <Box h="1px" bg={dividerColor} mx={2} />
                  )}
                </Box>
              ))}
            </>
          )}
        </Box>
      </Box>
    </>
  );
}

// ─── Internal sub-component ──────────────────────────────────────────────

function OptionRow({
  icon,
  label,
  onClick,
  textColor,
  hoverBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  textColor: string;
  hoverBg: string;
  iconColor: string;
}) {
  return (
    <Flex
      px={4}
      py={3.5}
      alignItems="center"
      justifyContent="space-between"
      cursor="pointer"
      borderRadius="lg"
      onClick={onClick}
      _hover={{ bg: hoverBg }}
      transition="background 0.15s"
    >
      <Flex alignItems="center" gap={3}>
        <Box color={iconColor}>{icon}</Box>
        <Text fontSize="sm" fontWeight="medium" color={textColor}>
          {label}
        </Text>
      </Flex>
      <ArrowRight size={16} color={iconColor} />
    </Flex>
  );
}
