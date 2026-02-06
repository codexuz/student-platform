"use client";

import {
  Box,
  Button,
  Card,
  HStack,
  Icon,
  Text,
  VStack,
  Badge,
  Heading,
} from "@chakra-ui/react";
import {
  LuFlame,
  LuFileText,
  LuUpload,
  LuChevronRight,
  LuTarget,
} from "react-icons/lu";

const weekDays = [
  { day: "Sat", active: true },
  { day: "Sun", active: true },
  { day: "Mon", active: true },
  { day: "Tue", active: true },
  { day: "Wed", active: true },
  { day: "Thu", active: true },
  { day: "Fri", active: false },
];

const assignment = {
  title: "Advanced problem solving math",
  tag: "H. math 1",
  assignmentNumber: "Assignment 5",
  deadline: "15th Oct, 2024 ; 12:00PM",
};

const quizzes = [
  {
    id: 1,
    title: "Vector division",
    questions: 10,
    duration: 15,
  },
  {
    id: 2,
    title: "Vector division",
    questions: 10,
    duration: 15,
  },
];

export default function RightSidebar() {
  return (
    <VStack gap={6} alignItems="stretch">
      {/* 5 Days Without a Break */}
      <Card.Root>
        <Card.Body>
          <VStack gap={4} alignItems="stretch">
            <Heading size="sm">5 days without a break</Heading>
            <Text fontSize="xs" color="gray.600">
              The record is 16 days without a break
            </Text>

            <HStack gap={2} justifyContent="center">
              {weekDays.map((day, index) => (
                <VStack key={index} gap={1}>
                  <Box
                    w={8}
                    h={8}
                    rounded="md"
                    bg={day.active ? "orange.100" : "gray.100"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={LuFlame}
                      color={day.active ? "orange.500" : "gray.400"}
                    />
                  </Box>
                  <Text fontSize="xs" color="gray.600">
                    {day.day}
                  </Text>
                </VStack>
              ))}
            </HStack>

            <HStack gap={2} fontSize="xs" justifyContent="center">
              <HStack gap={1}>
                <Icon as={LuFlame} fontSize="xs" />
                <Text>6 classes covered</Text>
              </HStack>
              <HStack gap={1}>
                <Icon as={LuTarget} fontSize="xs" />
                <Text>4 assignment completed</Text>
              </HStack>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Assignment */}
      <Card.Root>
        <Card.Body>
          <VStack gap={4} alignItems="stretch">
            <Heading size="sm">Assignment</Heading>

            <HStack
              p={3}
              bg="blue.50"
              _dark={{ bg: "blue.900/20" }}
              rounded="lg"
              alignItems="flex-start"
            >
              <Box p={2} bg="blue.500" rounded="md" color="white">
                <Icon as={LuFileText} fontSize="xl" />
              </Box>
              <VStack gap={1} alignItems="flex-start" flex="1">
                <Text fontWeight="bold" fontSize="sm">
                  {assignment.title}
                </Text>
                <HStack gap={2}>
                  <Badge colorPalette="blue" size="sm">
                    {assignment.tag}
                  </Badge>
                  <Badge colorPalette="red" size="sm">
                    {assignment.assignmentNumber}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="red.600" fontWeight="medium">
                  ⏰ Submit before : {assignment.deadline}
                </Text>
              </VStack>
            </HStack>

            <HStack gap={2}>
              <Button variant="outline" size="sm" flex="1">
                <Icon as={LuChevronRight} />
                View
              </Button>
              <Button colorPalette="green" size="sm" flex="1">
                <Icon as={LuUpload} />
                Upload
              </Button>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Pending Quizzes */}
      <Card.Root>
        <Card.Body>
          <HStack justifyContent="space-between" mb={4}>
            <Heading size="sm">Pending quizzes</Heading>
            <Button variant="ghost" size="xs">
              See all
            </Button>
          </HStack>

          <VStack gap={3} alignItems="stretch">
            {quizzes.map((quiz) => (
              <HStack
                key={quiz.id}
                p={3}
                bg="purple.50"
                _dark={{ bg: "purple.900/20" }}
                rounded="lg"
                justifyContent="space-between"
              >
                <HStack gap={3}>
                  <Box
                    w={10}
                    h={10}
                    rounded="full"
                    bg="purple.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                  >
                    <Icon as={LuTarget} fontSize="lg" />
                  </Box>
                  <VStack gap={0} alignItems="flex-start">
                    <Text fontWeight="semibold" fontSize="sm">
                      {quiz.title}
                    </Text>
                    <HStack gap={2} fontSize="xs" color="gray.600">
                      <Text>📝 {quiz.questions} question</Text>
                      <Text>⏱️ {quiz.duration} min</Text>
                    </HStack>
                  </VStack>
                </HStack>
                <Button colorPalette="purple" size="xs">
                  <Icon as={LuChevronRight} />
                  Start
                </Button>
              </HStack>
            ))}
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
