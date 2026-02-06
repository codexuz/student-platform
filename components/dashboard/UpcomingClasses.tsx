"use client";

import {
  Box,
  Button,
  Card,
  HStack,
  Text,
  VStack,
  Badge,
  Icon,
  Heading,
} from "@chakra-ui/react";
import { LuClock, LuPlay } from "react-icons/lu";

const upcomingClasses = [
  {
    id: 1,
    title: "Newtonian Mechanics - Class 5",
    subject: "Physics 1",
    instructor: "by Rakesh Ahmed",
    date: "15th Oct, 2024",
    time: "12:00PM",
    minutesLeft: 2,
    image: "/class-physics.jpg",
    bgColor: "orange.500",
  },
  {
    id: 2,
    title: "Polymer - Class 3",
    subject: "Chemistry 1",
    instructor: "by Khalil khan",
    date: "15th Oct, 2024",
    time: "12:00PM",
    minutesLeft: 4,
    image: "/class-chemistry.jpg",
    bgColor: "teal.500",
  },
];

export default function UpcomingClasses() {
  return (
    <Card.Root>
      <Card.Body>
        <Heading size="md" mb={4}>
          Upcoming classes
        </Heading>

        <VStack gap={4} alignItems="stretch">
          {upcomingClasses.map((classItem) => (
            <HStack
              key={classItem.id}
              p={4}
              bg="gray.50"
              _dark={{ bg: "gray.700" }}
              rounded="lg"
              justifyContent="space-between"
            >
              <HStack gap={4}>
                {/* Class Image */}
                <Box
                  w={16}
                  h={16}
                  rounded="lg"
                  bg={classItem.bgColor}
                  overflow="hidden"
                  position="relative"
                >
                  <Box
                    w="full"
                    h="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={LuPlay} fontSize="2xl" color="white" />
                  </Box>
                </Box>

                {/* Class Details */}
                <VStack gap={1} alignItems="flex-start">
                  <Text fontWeight="bold" fontSize="md">
                    {classItem.title}
                  </Text>
                  <Badge colorPalette={classItem.id === 1 ? "orange" : "teal"}>
                    {classItem.subject}
                  </Badge>
                  <Text
                    fontSize="xs"
                    color="gray.600"
                    _dark={{ color: "gray.400" }}
                  >
                    {classItem.instructor}
                  </Text>
                </VStack>
              </HStack>

              <HStack gap={4}>
                {/* Date and Time */}
                <VStack gap={0} alignItems="flex-end">
                  <Text fontSize="sm" fontWeight="medium">
                    {classItem.date} ; {classItem.time}
                  </Text>
                  <HStack gap={1} color="red.500">
                    <Icon as={LuClock} fontSize="sm" />
                    <Text fontSize="xs" fontWeight="medium">
                      {classItem.minutesLeft} min left
                    </Text>
                  </HStack>
                </VStack>

                {/* Join Button */}
                <Button colorPalette="green" size="sm">
                  <Icon as={LuPlay} />
                  Join
                </Button>
              </HStack>
            </HStack>
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
