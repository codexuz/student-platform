"use client";

import { Box, Text, VStack, Card } from "@chakra-ui/react";
import { ProgressCircle } from "@/components/ui/progress-circle";

export default function PerformanceCard() {
  return (
    <Card.Root>
      <Card.Body>
        <VStack gap={4} alignItems="stretch">
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Overall performance
            </Text>
            <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
              Course completion rate
            </Text>
          </Box>

          <VStack gap={2}>
            <Box position="relative" display="inline-flex">
              <ProgressCircle.Root value={80} size="lg">
                <ProgressCircle.Circle>
                  <ProgressCircle.Track stroke="gray.200" _dark={{ stroke: "gray.600" }} />
                  <ProgressCircle.Range stroke="green.500" strokeWidth={8} />
                </ProgressCircle.Circle>
                <ProgressCircle.ValueText
                  fontSize="3xl"
                  fontWeight="bold"
                  color="green.600"
                />
              </ProgressCircle.Root>
            </Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.600"
              _dark={{ color: "gray.400" }}
              textTransform="uppercase"
            >
              Pro Learner
            </Text>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
