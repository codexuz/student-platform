"use client";

import { Card, Heading, Box, Text, HStack, Badge } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

interface SectionData {
  section: string;
  score: number;
}

interface SectionProgressRadarProps {
  data: SectionData[];
}

export default function SectionProgressRadar({ data }: SectionProgressRadarProps) {
  const sectionData = data.length > 0 ? data : [
    { section: "Listening", score: 0 },
    { section: "Reading", score: 0 },
    { section: "Writing", score: 0 },
    { section: "Speaking", score: 0 },
    { section: "Grammar", score: 0 },
  ];

  const averageScore =
    sectionData.reduce((acc, item) => acc + item.score, 0) / sectionData.length;

  const chart = useChart({
    data: sectionData,
    series: [{ name: "score", color: "brand.solid" }],
  });

  return (
    <Card.Root>
      <Card.Body p={{ base: 4, md: 6 }}>
        <HStack
          justifyContent="space-between"
          mb={{ base: 4, md: 6 }}
          flexDirection={{ base: "column", sm: "row" }}
          alignItems={{ base: "flex-start", sm: "center" }}
          gap={{ base: 2, sm: 0 }}
        >
          <Box>
            <Heading size={{ base: "md", md: "lg" }} mb={2}>
              Section Progress
            </Heading>
            <Text
              fontSize={{ base: "xs", md: "sm" }}
              color="gray.600"
              _dark={{ color: "gray.400" }}
            >
              Your performance across different skill areas
            </Text>
          </Box>
          <Badge
            colorPalette="blue"
            size={{ base: "md", md: "lg" }}
            px={{ base: 3, md: 4 }}
            py={2}
          >
            Avg: {averageScore.toFixed(0)}%
          </Badge>
        </HStack>

        <Chart.Root
          height={{ base: "300px", md: "400px" }}
          minHeight={{ base: "300px", md: "400px" }}
          width="100%"
          chart={chart}
          mx="auto"
        >
          <RadarChart data={chart.data}>
            <PolarGrid stroke={chart.color("border")} />
            <PolarAngleAxis
              dataKey={chart.key("section")}
              tick={{ fontSize: 12 }}
            />
            {chart.series.map((item) => (
              <Radar
                dot={{ fillOpacity: 1 }}
                isAnimationActive={false}
                key={item.name}
                name={item.name}
                dataKey={chart.key(item.name)}
                stroke={chart.color(item.color)}
                fill={chart.color(item.color)}
                fillOpacity={0.2}
              />
            ))}
          </RadarChart>
        </Chart.Root>

        {/* Section Breakdown */}
        <Box mt={{ base: 4, md: 6 }}>
          <Heading size="sm" mb={4} textAlign="center">
            Detailed Breakdown
          </Heading>
          <HStack
            gap={{ base: 2, md: 4 }}
            flexWrap="wrap"
            justifyContent="center"
          >
            {sectionData.map((item) => (
              <Box
                key={item.section}
                p={{ base: 2, md: 3 }}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                rounded="md"
                minW={{ base: "120px", md: "150px" }}
              >
                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="medium"
                  mb={1}
                >
                  {item.section}
                </Text>
                <Text
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontWeight="bold"
                  color="blue.600"
                >
                  {item.score}%
                </Text>
              </Box>
            ))}
          </HStack>
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
