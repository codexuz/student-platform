"use client";

import {
    Box,
    Container,
    Heading,
    Text as ChakraText,
    Flex,
    Icon,
    HStack,
    VStack,
    Card,
    Badge,
    Spinner,
    Table,
    Image as ChakraImage,
    NativeSelect,
    ButtonGroup,
    IconButton,
    Pagination,
} from "@chakra-ui/react";
import {
    LuTrophy,
    LuMedal,
    LuUsers,
    LuCalendar,
    LuArrowUpDown,
    LuChevronLeft,
    LuChevronRight,
} from "react-icons/lu";
import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { ieltsAnswersAPI } from "@/lib/ielts-api";
import { Button } from "@chakra-ui/react";

interface LeaderboardEntry {
    user: {
        user_id: string;
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    };
    reading: number;
    listening: number;
    writing: number;
    overall: number;
    attemptsCount: number;
}

const PERIOD_OPTIONS = [
    { label: "All Time", value: "all_time" },
    { label: "Monthly", value: "monthly" },
    { label: "Weekly", value: "weekly" },
    { label: "Daily", value: "daily" },
];

const LIMIT = 10;

type LeaderboardSection = "reading" | "listening" | "writing" | "overall" | "attemptsCount";

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<LeaderboardSection>("overall");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [period, setPeriod] = useState("all_time");

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const response = await ieltsAnswersAPI.getLeaderboard({
                    period,
                    limit: LIMIT,
                    offset: (currentPage - 1) * LIMIT,
                });
                setData(response.data || []);
                setTotalCount(response.total || 0);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [period, currentPage]);

    // Client-side sorting for the current page
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const valA = a[sortField] as number;
            const valB = b[sortField] as number;
            if (sortOrder === "desc") return valB - valA;
            return valA - valB;
        });
    }, [data, sortField, sortOrder]);

    const handleSort = (field: LeaderboardSection) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    const totalPages = Math.ceil(totalCount / LIMIT);

    const getRankBadge = (rank: number) => {
        const actualRank = (currentPage - 1) * LIMIT + rank;
        if (actualRank === 0) return <Icon as={LuTrophy} color="yellow.400" size="lg" />;
        if (actualRank === 1) return <Icon as={LuMedal} color="gray.400" size="lg" />;
        if (actualRank === 2) return <Icon as={LuMedal} color="orange.400" size="lg" />;
        return <ChakraText fontWeight="bold" color="gray.500">{actualRank + 1}</ChakraText>;
    };

    const formatScore = (score: number) => {
        if (score === 0 || score === null) return "—";
        return score.toFixed(1).replace(/\.0$/, "");
    };

    const SortHeader = ({ field, children, textAlign = "right" }: { field: LeaderboardSection, children: React.ReactNode, textAlign?: "right" | "left" | "center" }) => (
        <Table.ColumnHeader
            textAlign={textAlign}
            cursor="pointer"
            onClick={() => handleSort(field)}
            _hover={{ bg: "gray.50", _dark: { bg: "whiteAlpha.100" } }}
            whiteSpace="nowrap"
        >
            <HStack justify={textAlign === "right" ? "flex-end" : "flex-start"} gap={1}>
                <ChakraText>{children}</ChakraText>
                <Icon
                    as={LuArrowUpDown}
                    size="xs"
                    color={sortField === field ? "brand.500" : "gray.400"}
                />
            </HStack>
        </Table.ColumnHeader>
    );

    return (
        <ProtectedRoute>
            <Flex
                h="100vh"
                bg="gray.50"
                _dark={{ bg: "gray.900" }}
                direction={{ base: "column", lg: "row" }}
            >
                <Box display={{ base: "none", lg: "block" }}>
                    <Sidebar />
                </Box>

                <Box
                    flex="1"
                    overflowY="auto"
                    pb={{ base: "16", lg: "0" }}
                    ml={{ base: 0, lg: "240px" }}
                >
                    <Flex
                        h={{ base: "14", md: "16" }}
                        px={{ base: 4, md: 8 }}
                        alignItems="center"
                        justifyContent="space-between"
                        bg="white"
                        _dark={{ bg: "gray.800" }}
                        borderBottomWidth="1px"
                    >
                        <Heading size={{ base: "sm", md: "md" }}>Leaderboard</Heading>
                        <HStack gap={{ base: 2, md: 4 }}>
                            <NotificationsDrawer />
                        </HStack>
                    </Flex>

                    <Container
                        maxW="6xl"
                        py={{ base: 4, md: 6, lg: 8 }}
                        px={{ base: 2, md: 6 }}
                    >
                        <VStack gap={6} alignItems="stretch">
                            <Flex justify="space-between" align="flex-end" wrap="wrap" gap={4}>
                                <Box>
                                    <Heading size={{ base: "xl", md: "2xl" }} mb={2}>
                                        IELTS Champions 🏆
                                    </Heading>
                                    <ChakraText
                                        fontSize={{ base: "md", md: "lg" }}
                                        color="gray.600"
                                        _dark={{ color: "gray.400" }}
                                    >
                                        Showing {totalCount} ranked students
                                    </ChakraText>
                                </Box>

                                <HStack gap={2} minW="180px">
                                    <Icon as={LuCalendar} color="gray.400" />
                                    <NativeSelect.Root size="sm" width="full">
                                        <NativeSelect.Field
                                            value={period}
                                            onChange={(e) => {
                                                setPeriod(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            {PERIOD_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </HStack>
                            </Flex>

                            <Card.Root borderRadius="2xl" overflow="hidden" variant="subtle">
                                <Card.Body p={{ base: 0, md: 6 }}>
                                    {loading ? (
                                        <Flex justify="center" align="center" py={20}>
                                            <Spinner size="xl" color="brand.500" />
                                        </Flex>
                                    ) : sortedData.length > 0 ? (
                                        <VStack gap={4} p={{ base: 4, md: 0 }}>
                                            <Box overflowX="auto" w="full">
                                                <Table.Root variant="line" size="sm">
                                                    <Table.Header>
                                                        <Table.Row>
                                                            <Table.ColumnHeader width="60px">Rank</Table.ColumnHeader>
                                                            <Table.ColumnHeader>Student</Table.ColumnHeader>
                                                            <SortHeader field="reading">Reading</SortHeader>
                                                            <SortHeader field="listening">Listening</SortHeader>
                                                            <SortHeader field="writing">Writing</SortHeader>
                                                            <SortHeader field="overall">Overall</SortHeader>
                                                            <SortHeader field="attemptsCount">Tests</SortHeader>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {sortedData.map((entry, index) => (
                                                            <Table.Row
                                                                key={entry.user.user_id}
                                                                bg={entry.user.user_id === user?.id ? "brand.50" : "transparent"}
                                                                _dark={{
                                                                    bg: entry.user.user_id === user?.id ? "whiteAlpha.100" : "transparent"
                                                                }}
                                                            >
                                                                <Table.Cell>
                                                                    <Flex justify="center" align="center" h="40px" w="40px">
                                                                        {getRankBadge(index)}
                                                                    </Flex>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <HStack gap={3}>
                                                                        <Box
                                                                            w="32px"
                                                                            h="32px"
                                                                            borderRadius="full"
                                                                            overflow="hidden"
                                                                            bg="gray.200"
                                                                            flexShrink={0}
                                                                            display={{ base: "none", sm: "block" }}
                                                                        >
                                                                            {entry.user.avatar_url ? (
                                                                                <ChakraImage
                                                                                    src={entry.user.avatar_url}
                                                                                    alt={entry.user.username}
                                                                                    w="full"
                                                                                    h="full"
                                                                                    objectFit="cover"
                                                                                />
                                                                            ) : (
                                                                                <Flex w="full" h="full" align="center" justify="center" bg="brand.500" color="white">
                                                                                    <Icon as={LuUsers} size="xs" />
                                                                                </Flex>
                                                                            )}
                                                                        </Box>
                                                                        <Box>
                                                                            <ChakraText fontWeight="bold" fontSize="sm" lineClamp={1}>
                                                                                {entry.user.first_name} {entry.user.last_name}
                                                                            </ChakraText>
                                                                            <ChakraText fontSize="2xs" color="gray.500" display={{ base: "none", sm: "block" }}>
                                                                                @{entry.user.username}
                                                                            </ChakraText>
                                                                        </Box>
                                                                    </HStack>
                                                                </Table.Cell>
                                                                <Table.Cell textAlign="right" fontWeight="medium">
                                                                    {formatScore(entry.reading)}
                                                                </Table.Cell>
                                                                <Table.Cell textAlign="right" fontWeight="medium">
                                                                    {formatScore(entry.listening)}
                                                                </Table.Cell>
                                                                <Table.Cell textAlign="right" fontWeight="medium">
                                                                    {formatScore(entry.writing)}
                                                                </Table.Cell>
                                                                <Table.Cell textAlign="right">
                                                                    <Badge
                                                                        size="md"
                                                                        colorPalette={entry.overall >= 7 ? "green" : entry.overall >= 5 ? "yellow" : "brand"}
                                                                        variant="subtle"
                                                                        minW="40px"
                                                                        justifyContent="center"
                                                                    >
                                                                        {formatScore(entry.overall)}
                                                                    </Badge>
                                                                </Table.Cell>
                                                                <Table.Cell textAlign="right">
                                                                    <ChakraText fontSize="xs" color="gray.500">
                                                                        {entry.attemptsCount}
                                                                    </ChakraText>
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        ))}
                                                    </Table.Body>
                                                </Table.Root>
                                            </Box>

                                            {totalPages > 1 && (
                                                <Flex justify="center" align="center" pt={4}>
                                                    <Pagination.Root
                                                        count={totalCount}
                                                        pageSize={LIMIT}
                                                        page={currentPage}
                                                        onPageChange={(e) => setCurrentPage(e.page)}
                                                    >
                                                        <ButtonGroup variant="outline" size="sm">
                                                            <Pagination.PrevTrigger asChild>
                                                                <IconButton
                                                                    disabled={currentPage === 1}
                                                                    aria-label="Previous Page"
                                                                >
                                                                    <LuChevronLeft />
                                                                </IconButton>
                                                            </Pagination.PrevTrigger>

                                                            <Pagination.Items
                                                                render={(page) => (
                                                                    <IconButton
                                                                        variant={page.type === "page" && page.value === currentPage ? "solid" : "outline"}
                                                                        onClick={() => setCurrentPage(page.value)}
                                                                        size="sm"
                                                                    >
                                                                        {page.value}
                                                                    </IconButton>
                                                                )}
                                                            />

                                                            <Pagination.NextTrigger asChild>
                                                                <IconButton
                                                                    disabled={currentPage === totalPages}
                                                                    aria-label="Next Page"
                                                                >
                                                                    <LuChevronRight />
                                                                </IconButton>
                                                            </Pagination.NextTrigger>
                                                        </ButtonGroup>
                                                    </Pagination.Root>
                                                </Flex>
                                            )}
                                        </VStack>
                                    ) : (
                                        <Flex direction="column" align="center" justify="center" py={20}>
                                            <Icon as={LuUsers} fontSize="5xl" color="gray.300" mb={4} />
                                            <ChakraText color="gray.500">No rankings available for this period yet.</ChakraText>
                                        </Flex>
                                    )}
                                </Card.Body>
                            </Card.Root>
                        </VStack>
                    </Container>
                </Box>

                <MobileBottomNav />
            </Flex>
        </ProtectedRoute>
    );
}
