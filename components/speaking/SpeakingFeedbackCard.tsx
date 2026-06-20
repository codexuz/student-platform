"use client";

import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Flex,
  SimpleGrid,
  List,
} from "@chakra-ui/react";
import { CheckCircle2, TrendingUp } from "lucide-react";
import type { BandFeedback } from "@/hooks/useSpeakingExam";

const criteriaLabels: Record<keyof BandFeedback["criteria"], string> = {
  fluency_coherence: "Fluency & Coherence",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammar",
  pronunciation: "Pronunciation",
};

function bandColor(band: number): string {
  if (band >= 7) return "green";
  if (band >= 5.5) return "blue";
  if (band >= 4) return "orange";
  return "red";
}

export default function SpeakingFeedbackCard({
  feedback,
}: {
  feedback: BandFeedback;
}) {
  const overall = feedback.overall_band;
  const oc = bandColor(overall);

  return (
    <Box
      bg="white"
      _dark={{ bg: "gray.800", borderColor: "whiteAlpha.200" }}
      color="gray.800"
      borderWidth="1px"
      rounded="2xl"
      overflow="hidden"
      shadow="md"
    >
      {/* Overall band header */}
      <Flex
        align="center"
        justify="space-between"
        px={6}
        py={5}
        bg={`${oc}.50`}
        _dark={{ bg: "whiteAlpha.100" }}
        borderBottomWidth="1px"
      >
        <Box>
          <Text
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.5px"
            color="gray.500"
            _dark={{ color: "gray.400" }}
          >
            Estimated Overall Band
          </Text>
          <Heading size="md" _dark={{ color: "white" }}>
            IELTS Speaking
          </Heading>
        </Box>
        <Flex
          align="center"
          justify="center"
          w="72px"
          h="72px"
          borderRadius="full"
          bg={`${oc}.500`}
          color="white"
          flexDir="column"
        >
          <Text fontSize="2xl" fontWeight="800" lineHeight="1">
            {overall.toFixed(1)}
          </Text>
        </Flex>
      </Flex>

      <Box px={6} py={5}>
        {/* Criteria */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={5}>
          {(
            Object.keys(criteriaLabels) as (keyof BandFeedback["criteria"])[]
          ).map((key) => {
            const v = feedback.criteria?.[key] ?? 0;
            return (
              <Box
                key={key}
                bg="gray.50"
                _dark={{ bg: "whiteAlpha.100" }}
                rounded="lg"
                p={3}
                textAlign="center"
              >
                <Text
                  fontSize="xl"
                  fontWeight="800"
                  color={`${bandColor(v)}.500`}
                >
                  {Number(v).toFixed(1)}
                </Text>
                <Text
                  fontSize="11px"
                  color="gray.500"
                  _dark={{ color: "gray.400" }}
                  lineClamp={2}
                >
                  {criteriaLabels[key]}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>

        {feedback.summary && (
          <Text
            fontSize="sm"
            color="gray.700"
            _dark={{ color: "gray.300" }}
            mb={5}
            lineHeight="tall"
          >
            {feedback.summary}
          </Text>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
          {feedback.strengths?.length > 0 && (
            <Box>
              <HStack color="green.500" mb={2}>
                <CheckCircle2 size={16} />
                <Text fontWeight="700" fontSize="sm">
                  Strengths
                </Text>
              </HStack>
              <List.Root gap={1.5} fontSize="sm">
                {feedback.strengths.map((s, i) => (
                  <List.Item
                    key={i}
                    color="gray.700"
                    _dark={{ color: "gray.300" }}
                  >
                    {s}
                  </List.Item>
                ))}
              </List.Root>
            </Box>
          )}
          {feedback.improvements?.length > 0 && (
            <Box>
              <HStack color="orange.500" mb={2}>
                <TrendingUp size={16} />
                <Text fontWeight="700" fontSize="sm">
                  To improve
                </Text>
              </HStack>
              <List.Root gap={1.5} fontSize="sm">
                {feedback.improvements.map((s, i) => (
                  <List.Item
                    key={i}
                    color="gray.700"
                    _dark={{ color: "gray.300" }}
                  >
                    {s}
                  </List.Item>
                ))}
              </List.Root>
            </Box>
          )}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
