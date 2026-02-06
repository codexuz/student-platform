"use client";

import {
  Box,
  Card,
  HStack,
  Text,
  VStack,
  Badge,
  Icon,
  Heading,
  Table,
} from "@chakra-ui/react";
import { BookOpen, ChevronRight, CircleCheck } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress";

const courses = [
  {
    id: 1,
    name: "Physics 1",
    chapters: 5,
    lectures: 30,
    progress: 30,
    overallScore: 80,
    status: "In progress",
    color: "orange",
    icon: "P",
  },
  {
    id: 2,
    name: "Physics 2",
    chapters: 5,
    lectures: 30,
    progress: 30,
    overallScore: 80,
    status: "In progress",
    color: "orange",
    icon: "P",
  },
  {
    id: 3,
    name: "Chemistry 1",
    chapters: 5,
    lectures: 30,
    progress: 30,
    overallScore: 70,
    status: "In progress",
    color: "teal",
    icon: "C",
  },
  {
    id: 4,
    name: "Chemistry 2",
    chapters: 5,
    lectures: 30,
    progress: 30,
    overallScore: 80,
    status: "In progress",
    color: "teal",
    icon: "C",
  },
  {
    id: 5,
    name: "Higher math 1",
    chapters: 5,
    lectures: 30,
    progress: 100,
    overallScore: 90,
    status: "Completed",
    color: "green",
    icon: "H",
  },
];

export default function CoursesList() {
  return (
    <Card.Root>
      <Card.Body>
        <Heading size="md" mb={4}>
          Total courses (5)
        </Heading>

        <Table.Root variant="outline" size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Course name</Table.ColumnHeader>
              <Table.ColumnHeader>Progress</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">
                Overall score
              </Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {courses.map((course) => (
              <Table.Row key={course.id}>
                <Table.Cell>
                  <HStack gap={3}>
                    <Box
                      w={10}
                      h={10}
                      rounded="full"
                      bg={`${course.color}.500`}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontWeight="bold"
                    >
                      {course.icon}
                    </Box>
                    <VStack gap={0} alignItems="flex-start">
                      <Text fontWeight="semibold">{course.name}</Text>
                      <HStack gap={2} fontSize="xs" color="gray.600">
                        <HStack gap={1}>
                          <Icon as={BookOpen} />
                          <Text>{course.chapters} chapter</Text>
                        </HStack>
                        <HStack gap={1}>
                          <Icon as={BookOpen} />
                          <Text>{course.lectures} lecture</Text>
                        </HStack>
                      </HStack>
                    </VStack>
                  </HStack>
                </Table.Cell>
                <Table.Cell>
                  <VStack gap={1} alignItems="flex-start" w="200px">
                    <ProgressBar
                      value={course.progress}
                      colorPalette={
                        course.progress === 100 ? "green" : "orange"
                      }
                      size="sm"
                    />
                    <Text fontSize="xs" color="gray.600">
                      {course.progress}%
                    </Text>
                  </VStack>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Text fontWeight="bold">{course.overallScore}%</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    colorPalette={
                      course.status === "Completed" ? "green" : "orange"
                    }
                    variant="subtle"
                  >
                    {course.status === "Completed" && <Icon as={CircleCheck} />}
                    {course.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Icon as={ChevronRight} cursor="pointer" color="gray.400" />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card.Body>
    </Card.Root>
  );
}
