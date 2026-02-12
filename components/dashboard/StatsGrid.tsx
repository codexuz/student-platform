"use client";

import { Box, Grid, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import {
  BookOpen,
  CircleCheck,
  Clock,
  Wifi,
  Target,
  FileCheck,
} from "lucide-react";
import { ProgressCircle } from "@/components/ui/progress-circle";

const stats = [
  {
    icon: BookOpen,
    label: "Total enroll courses",
    value: "5",
    iconColor: "blue.500",
    iconBg: "blue.50",
    showCircle: true,
    circleValue: 100,
  },
  {
    icon: Wifi,
    label: "Live class attended",
    value: "70%",
    iconColor: "orange.500",
    iconBg: "orange.50",
    showCircle: true,
    circleValue: 70,
    circleColor: "orange.500",
  },
  {
    icon: CircleCheck,
    label: "Course completed",
    value: "1",
    iconColor: "teal.500",
    iconBg: "teal.50",
    showCircle: true,
    circleValue: 20,
    circleColor: "teal.500",
  },
  {
    icon: Target,
    label: "Quiz practised",
    value: "20/25",
    iconColor: "purple.500",
    iconBg: "purple.50",
    showCircle: true,
    circleValue: 80,
    circleColor: "purple.500",
  },
  {
    icon: Clock,
    label: "Hours spent",
    value: "112h",
    subtitle: "Total hours spent in courses",
    iconColor: "pink.500",
    iconBg: "pink.50",
    showCircle: true,
    circleValue: 75,
    circleColor: "pink.500",
  },
  {
    icon: FileCheck,
    label: "Assignment done",
    value: "10/15",
    iconColor: "indigo.500",
    iconBg: "indigo.50",
    showCircle: true,
    circleValue: 66,
    circleColor: "indigo.500",
  },
];

export default function StatsGrid() {
  return (
    <Grid
      templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
      gap={4}
      w="full"
    >
      {stats.map((stat, index) => (
        <HStack
          key={index}
          p={4}
          bg="white"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          shadow="sm"
          justifyContent="space-between"
        >
          <HStack gap={3}>
            <Box
              p={2.5}
              rounded="lg"
              bg={stat.iconBg}
              _dark={{ bg: `${stat.iconColor}/20` }}
            >
              <Icon as={stat.icon} fontSize="xl" color={stat.iconColor} />
            </Box>
            <VStack gap={0} alignItems="flex-start">
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: "gray.400" }}
              >
                {stat.label}
              </Text>
              <Text fontSize="xl" fontWeight="bold">
                {stat.value}
              </Text>
            </VStack>
          </HStack>
          {stat.showCircle && (
            <ProgressCircle.Root value={stat.circleValue} size="sm">
              <ProgressCircle.Circle>
                <ProgressCircle.Track stroke="gray.200" _dark={{ stroke: "gray.600" }} />
                <ProgressCircle.Range
                  stroke={stat.circleColor || "green.500"}
                  strokeWidth={6}
                />
              </ProgressCircle.Circle>
            </ProgressCircle.Root>
          )}
        </HStack>
      ))}
    </Grid>
  );
}
