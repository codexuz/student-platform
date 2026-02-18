"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  CloseButton,
  Container,
  Dialog,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Portal,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  ClipboardList,
  Plus,
  Search,
  Trash2,
  Video,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { groupsAPI, groupStudentsAPI } from "@/lib/teacher-api";
import { ieltsMockTestsAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";

// ── Types ──────────────────────────────────────────────────────────────────

interface Group {
  id: string;
  name?: string;
}

interface StudentProfile {
  user_id?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
}

interface GroupStudent {
  id: string;
  student_id?: string;
  student?: StudentProfile;
  status?: string;
}

interface MockTest {
  id: string;
  user_id: string;
  test_id: string;
  group_id?: string;
  teacher_id?: string;
  title: string;
  listening_confirmed: boolean;
  reading_confirmed: boolean;
  writing_confirmed: boolean;
  listening_finished: boolean;
  reading_finished: boolean;
  writing_finished: boolean;
  archived: boolean;
  meta?: {
    listening_videoUrl?: string;
    reading_videoUrl?: string;
    writing_videoUrl?: string;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    first_name?: string;
    last_name?: string;
  };
  test?: { id: string; title?: string };
  createdAt?: string;
}

interface IELTSTest {
  id: string;
  title: string;
  mode?: string;
  status?: string;
  category?: string;
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function GroupMockTestsPage() {
  return (
    <ProtectedRoute>
      <GroupMockTestsContent />
    </ProtectedRoute>
  );
}

function GroupMockTestsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const groupId = params?.id;

  // Data
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);

  // Tab: active vs archived
  const [tab, setTab] = useState<"active" | "archived">("active");

  // Selection for bulk actions
  const [selection, setSelection] = useState<string[]>([]);

  // ── Fetch data ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [groupRes, studentsRes, mockRes] = await Promise.all([
        groupsAPI.getById(groupId).catch(() => null),
        groupStudentsAPI.getByGroupId(groupId).catch(() => []),
        ieltsMockTestsAPI.getByGroup(groupId).catch(() => []),
      ]);

      setGroup(groupRes);
      setStudents(
        Array.isArray(studentsRes) ? studentsRes : studentsRes?.data || [],
      );
      const mockArr = Array.isArray(mockRes) ? mockRes : mockRes?.data || [];
      setMockTests(mockArr);
    } catch {
      toaster.error({ title: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filtered mock tests ─────────────────────────────────────────────────

  const filteredTests = useMemo(() => {
    return mockTests.filter((t) =>
      tab === "archived" ? t.archived : !t.archived,
    );
  }, [mockTests, tab]);

  // Clear selection when tab changes
  useEffect(() => {
    setSelection([]);
  }, [tab]);

  const indeterminate =
    selection.length > 0 && selection.length < filteredTests.length;

  // ── Student name helper ─────────────────────────────────────────────────

  const getStudentName = (mt: MockTest) => {
    const u = mt.user;
    if (u) {
      const fn = u.firstName || u.first_name || "";
      const ln = u.lastName || u.last_name || "";
      if (fn || ln) return `${fn} ${ln}`.trim();
    }
    // fallback: find from students list
    const s = students.find(
      (st) =>
        st.student_id === mt.user_id || st.student?.user_id === mt.user_id,
    );
    if (s?.student) {
      const fn = s.student.first_name || "";
      const ln = s.student.last_name || "";
      if (fn || ln) return `${fn} ${ln}`.trim();
      return s.student.username || "Unknown";
    }
    return "Unknown Student";
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleToggleField = async (
    mt: MockTest,
    field:
      | "listening_confirmed"
      | "reading_confirmed"
      | "writing_confirmed"
      | "listening_finished"
      | "reading_finished"
      | "writing_finished",
  ) => {
    try {
      await ieltsMockTestsAPI.update(mt.id, { [field]: !mt[field] });
      setMockTests((prev) =>
        prev.map((t) => (t.id === mt.id ? { ...t, [field]: !mt[field] } : t)),
      );
    } catch {
      toaster.error({ title: "Failed to update" });
    }
  };

  const handleArchive = async (mt: MockTest) => {
    try {
      if (mt.archived) {
        await ieltsMockTestsAPI.unarchive(mt.id);
      } else {
        await ieltsMockTestsAPI.archive(mt.id);
      }
      setMockTests((prev) =>
        prev.map((t) =>
          t.id === mt.id ? { ...t, archived: !mt.archived } : t,
        ),
      );
      toaster.success({ title: mt.archived ? "Unarchived" : "Archived" });
    } catch {
      toaster.error({ title: "Failed to archive" });
    }
  };

  const handleDelete = async (mt: MockTest) => {
    if (!confirm(`Delete mock test "${mt.title}"?`)) return;
    try {
      await ieltsMockTestsAPI.delete(mt.id);
      setMockTests((prev) => prev.filter((t) => t.id !== mt.id));
      toaster.success({ title: "Deleted" });
    } catch {
      toaster.error({ title: "Failed to delete" });
    }
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────

  const handleBulkArchive = async () => {
    if (selection.length === 0) return;
    const action = tab === "archived" ? "unarchive" : "archive";
    try {
      await Promise.all(
        selection.map((id) =>
          action === "archive"
            ? ieltsMockTestsAPI.archive(id)
            : ieltsMockTestsAPI.unarchive(id),
        ),
      );
      setMockTests((prev) =>
        prev.map((t) =>
          selection.includes(t.id)
            ? { ...t, archived: action === "archive" }
            : t,
        ),
      );
      toaster.success({
        title: `${selection.length} test(s) ${action === "archive" ? "archived" : "unarchived"}`,
      });
      setSelection([]);
    } catch {
      toaster.error({ title: `Failed to ${action}` });
    }
  };

  const handleBulkDelete = async () => {
    if (selection.length === 0) return;
    if (!confirm(`Delete ${selection.length} mock test(s)?`)) return;
    try {
      await Promise.all(selection.map((id) => ieltsMockTestsAPI.delete(id)));
      setMockTests((prev) => prev.filter((t) => !selection.includes(t.id)));
      toaster.success({ title: `${selection.length} test(s) deleted` });
      setSelection([]);
    } catch {
      toaster.error({ title: "Failed to delete" });
    }
  };

  const handleVideoUrl = async (
    mt: MockTest,
    skill: "listening" | "reading" | "writing",
  ) => {
    const key = `${skill}_videoUrl` as keyof NonNullable<MockTest["meta"]>;
    const current = mt.meta?.[key] || "";
    const url = prompt(`Enter ${skill} video review URL:`, current);
    if (url === null) return; // cancelled
    const newMeta = { ...(mt.meta || {}), [key]: url };
    try {
      await ieltsMockTestsAPI.update(mt.id, { meta: newMeta });
      setMockTests((prev) =>
        prev.map((t) => (t.id === mt.id ? { ...t, meta: newMeta } : t)),
      );
      toaster.success({ title: "Video URL updated" });
    } catch {
      toaster.error({ title: "Failed to update video URL" });
    }
  };

  // ── Skill cell renderer ─────────────────────────────────────────────────

  const SkillCell = ({
    finished,
    confirmed,
    onToggleFinished,
    onToggleConfirmed,
    colorPalette,
  }: {
    finished: boolean;
    confirmed: boolean;
    onToggleFinished: () => void;
    onToggleConfirmed: () => void;
    colorPalette: string;
  }) => (
    <HStack gap={1} flexWrap="wrap">
      <Badge
        size="sm"
        cursor="pointer"
        colorPalette={finished ? colorPalette : "gray"}
        variant={finished ? "solid" : "outline"}
        onClick={onToggleFinished}
        title={finished ? "Mark as not finished" : "Mark as finished"}
      >
        {finished ? "Done" : "Pending"}
      </Badge>
      <Badge
        size="sm"
        cursor="pointer"
        colorPalette={confirmed ? "green" : "gray"}
        variant={confirmed ? "solid" : "outline"}
        onClick={onToggleConfirmed}
        title={confirmed ? "Unconfirm" : "Confirm results"}
      >
        {confirmed ? (
          <HStack gap={0.5}>
            <CheckCircle size={10} />
            <Text>OK</Text>
          </HStack>
        ) : (
          "—"
        )}
      </Badge>
    </HStack>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
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
        {/* Header */}
        <Flex
          h={{ base: "14", md: "16" }}
          px={{ base: 4, md: 8 }}
          alignItems="center"
          justifyContent="space-between"
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
        >
          <HStack gap={2}>
            <IconButton
              aria-label="Back"
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/groups/${groupId}`)}
            >
              <ArrowLeft size={18} />
            </IconButton>
            <Heading size={{ base: "sm", md: "md" }}>Mock Tests</Heading>
          </HStack>
          <HStack gap={{ base: 2, md: 4 }}>
            <NotificationsDrawer />
          </HStack>
        </Flex>

        <Container
          maxW="7xl"
          py={{ base: 4, md: 6, lg: 8 }}
          px={{ base: 4, md: 6 }}
        >
          <VStack gap={{ base: 4, md: 6 }} alignItems="stretch">
            {/* Title + Actions */}
            <Flex
              justify="space-between"
              align="center"
              flexWrap="wrap"
              gap={3}
            >
              <Box>
                <Heading size={{ base: "lg", md: "xl" }} mb={1}>
                  {group?.name || "Group"} — Mock Tests
                </Heading>
                <Text
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                  fontSize="sm"
                >
                  Assign and manage IELTS mock tests for students in this group
                </Text>
              </Box>
              <Button
                size="sm"
                colorPalette="brand"
                onClick={() => setAssignOpen(true)}
              >
                <Plus size={16} />
                Assign Mock Test
              </Button>
            </Flex>

            {/* Tabs */}
            <HStack gap={2}>
              <Button
                size="xs"
                variant={tab === "active" ? "solid" : "outline"}
                onClick={() => setTab("active")}
              >
                Active ({mockTests.filter((t) => !t.archived).length})
              </Button>
              <Button
                size="xs"
                variant={tab === "archived" ? "solid" : "outline"}
                onClick={() => setTab("archived")}
              >
                Archived ({mockTests.filter((t) => t.archived).length})
              </Button>
            </HStack>

            {/* Content */}
            {loading ? (
              <Flex justify="center" align="center" minH="300px">
                <Spinner size="xl" color="brand.500" />
              </Flex>
            ) : filteredTests.length === 0 ? (
              <Card.Root borderRadius="xl">
                <Card.Body py={12}>
                  <VStack gap={3}>
                    <ClipboardList size={48} color="gray" />
                    <Text color="gray.500" textAlign="center">
                      {tab === "archived"
                        ? "No archived mock tests."
                        : 'No mock tests assigned yet. Click "Assign Mock Test" to get started.'}
                    </Text>
                  </VStack>
                </Card.Body>
              </Card.Root>
            ) : (
              <Box
                borderWidth="1px"
                borderRadius="xl"
                overflow="hidden"
                bg="white"
                _dark={{ bg: "gray.800" }}
              >
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="gray.50" _dark={{ bg: "gray.700" }}>
                      <Table.ColumnHeader w="10">
                        <Checkbox.Root
                          size="sm"
                          mt="0.5"
                          aria-label="Select all rows"
                          checked={
                            indeterminate
                              ? "indeterminate"
                              : selection.length > 0
                          }
                          onCheckedChange={(changes) => {
                            setSelection(
                              changes.checked
                                ? filteredTests.map((t) => t.id)
                                : [],
                            );
                          }}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                      </Table.ColumnHeader>
                      {selection.length > 0 ? (
                        <Table.ColumnHeader colSpan={6}>
                          <HStack gap={2}>
                            <Text fontSize="xs" fontWeight="600">
                              {selection.length} selected
                            </Text>
                            <Button
                              size="xs"
                              variant="subtle"
                              colorPalette={
                                tab === "archived" ? "green" : "orange"
                              }
                              onClick={handleBulkArchive}
                            >
                              {tab === "archived" ? (
                                <ArchiveRestore size={12} />
                              ) : (
                                <Archive size={12} />
                              )}
                              {tab === "archived" ? "Unarchive" : "Archive"}
                            </Button>
                            <Button
                              size="xs"
                              variant="subtle"
                              colorPalette="red"
                              onClick={handleBulkDelete}
                            >
                              <Trash2 size={12} />
                              Delete
                            </Button>
                          </HStack>
                        </Table.ColumnHeader>
                      ) : (
                        <>
                          <Table.ColumnHeader>Title</Table.ColumnHeader>
                          <Table.ColumnHeader>Student</Table.ColumnHeader>
                          <Table.ColumnHeader>Listening</Table.ColumnHeader>
                          <Table.ColumnHeader>Reading</Table.ColumnHeader>
                          <Table.ColumnHeader>Writing</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">
                            Actions
                          </Table.ColumnHeader>
                        </>
                      )}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredTests.map((mt) => (
                      <Table.Row
                        key={mt.id}
                        data-selected={
                          selection.includes(mt.id) ? "" : undefined
                        }
                        _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                      >
                        <Table.Cell>
                          <Checkbox.Root
                            size="sm"
                            mt="0.5"
                            aria-label="Select row"
                            checked={selection.includes(mt.id)}
                            onCheckedChange={(changes) => {
                              setSelection((prev) =>
                                changes.checked
                                  ? [...prev, mt.id]
                                  : prev.filter((id) => id !== mt.id),
                              );
                            }}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                        </Table.Cell>
                        <Table.Cell>
                          <VStack align="start" gap={0}>
                            <Text fontWeight="600" fontSize="sm" lineClamp={1}>
                              {mt.title}
                            </Text>
                            {mt.test?.title && (
                              <Text fontSize="xs" color="gray.500">
                                {mt.test.title}
                              </Text>
                            )}
                          </VStack>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm">{getStudentName(mt)}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <SkillCell
                            finished={mt.listening_finished}
                            confirmed={mt.listening_confirmed}
                            onToggleFinished={() =>
                              handleToggleField(mt, "listening_finished")
                            }
                            onToggleConfirmed={() =>
                              handleToggleField(mt, "listening_confirmed")
                            }
                            colorPalette="orange"
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <SkillCell
                            finished={mt.reading_finished}
                            confirmed={mt.reading_confirmed}
                            onToggleFinished={() =>
                              handleToggleField(mt, "reading_finished")
                            }
                            onToggleConfirmed={() =>
                              handleToggleField(mt, "reading_confirmed")
                            }
                            colorPalette="purple"
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <SkillCell
                            finished={mt.writing_finished}
                            confirmed={mt.writing_confirmed}
                            onToggleFinished={() =>
                              handleToggleField(mt, "writing_finished")
                            }
                            onToggleConfirmed={() =>
                              handleToggleField(mt, "writing_confirmed")
                            }
                            colorPalette="green"
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap={1} justify="flex-end">
                            {(["listening", "reading", "writing"] as const).map(
                              (skill) => {
                                const key =
                                  `${skill}_videoUrl` as keyof NonNullable<
                                    MockTest["meta"]
                                  >;
                                const hasUrl = !!mt.meta?.[key];
                                return (
                                  <IconButton
                                    key={skill}
                                    aria-label={`${skill} video`}
                                    size="xs"
                                    variant="ghost"
                                    colorPalette={hasUrl ? "blue" : "gray"}
                                    onClick={() => handleVideoUrl(mt, skill)}
                                    title={`${skill.charAt(0).toUpperCase() + skill.slice(1)} video${hasUrl ? " ✓" : ""}`}
                                  >
                                    <Video size={14} />
                                  </IconButton>
                                );
                              },
                            )}
                            <IconButton
                              aria-label={mt.archived ? "Unarchive" : "Archive"}
                              size="xs"
                              variant="ghost"
                              onClick={() => handleArchive(mt)}
                              title={mt.archived ? "Unarchive" : "Archive"}
                            >
                              {mt.archived ? (
                                <ArchiveRestore size={14} />
                              ) : (
                                <Archive size={14} />
                              )}
                            </IconButton>
                            <IconButton
                              aria-label="Delete"
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => handleDelete(mt)}
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </HStack>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </VStack>
        </Container>
      </Box>

      <MobileBottomNav />

      {/* Assign Dialog */}
      <AssignMockTestDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        groupId={groupId || ""}
        groupName={group?.name || ""}
        teacherId={user?.id || ""}
        students={students}
        onAssigned={fetchData}
      />
    </Flex>
  );
}

// ── Assign Mock Test Dialog ──────────────────────────────────────────────────

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  teacherId: string;
  students: GroupStudent[];
  onAssigned: () => void;
}

function AssignMockTestDialog({
  open,
  onClose,
  groupId,
  groupName,
  teacherId,
  students,
  onAssigned,
}: AssignDialogProps) {
  // Steps: 1 = select test, 2 = select students, 3 = confirm
  const [step, setStep] = useState(1);

  // Test picker
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testSearch, setTestSearch] = useState("");
  const [selectedTest, setSelectedTest] = useState<IELTSTest | null>(null);

  // Student picker
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );

  // Title
  const [title, setTitle] = useState("");

  // Submitting
  const [submitting, setSubmitting] = useState(false);

  // Track previous open state to detect transitions
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Dialog just opened — reset form and fetch tests
      requestAnimationFrame(() => {
        setStep(1);
        setSelectedTest(null);
        setSelectedStudentIds(new Set());
        setTitle("");
        setTestSearch("");
        setTestsLoading(true);
      });

      let cancelled = false;
      ieltsTestsAPI
        .getAll({ mode: "mock", status: "published", limit: 100 })
        .then((res: { data?: IELTSTest[] } | IELTSTest[]) => {
          if (!cancelled) {
            const list = Array.isArray(res) ? res : res?.data || [];
            setTests(list);
          }
        })
        .catch(() => {
          if (!cancelled) setTests([]);
        })
        .finally(() => {
          if (!cancelled) setTestsLoading(false);
        });

      prevOpenRef.current = true;
      return () => {
        cancelled = true;
      };
    }

    if (!open) {
      prevOpenRef.current = false;
    }
  }, [open]);

  // Filtered tests
  const filteredTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q),
    );
  }, [tests, testSearch]);

  // Toggle student
  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = students
      .map((s) => s.student?.user_id || s.student_id || "")
      .filter(Boolean);
    setSelectedStudentIds(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedTest || selectedStudentIds.size === 0) return;

    setSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const studentId of selectedStudentIds) {
      try {
        await ieltsMockTestsAPI.create({
          user_id: studentId,
          test_id: selectedTest.id,
          title: title || selectedTest.title || "Mock Test",
          group_id: groupId,
          teacher_id: teacherId,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setSubmitting(false);

    if (successCount > 0) {
      toaster.success({
        title: `Assigned to ${successCount} student${successCount > 1 ? "s" : ""}`,
        description: errorCount > 0 ? `${errorCount} failed` : undefined,
      });
      onAssigned();
      onClose();
    } else {
      toaster.error({ title: "Failed to assign mock tests" });
    }
  };

  return (
    <Dialog.Root
      lazyMount
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="600px" maxH="85vh">
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="md" fontWeight="700">
                {step === 1 && "Step 1: Select IELTS Test"}
                {step === 2 && "Step 2: Select Students"}
                {step === 3 && "Step 3: Confirm Assignment"}
              </Dialog.Title>
              <Dialog.CloseTrigger
                asChild
                position="absolute"
                top="2"
                right="2"
              >
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body pt={0} overflow="auto">
              {/* STEP 1: Select Test */}
              {step === 1 && (
                <VStack gap={3} align="stretch">
                  {/* Search */}
                  <Box position="relative">
                    <Box
                      position="absolute"
                      left="10px"
                      top="50%"
                      transform="translateY(-50%)"
                      color="gray.400"
                      zIndex={1}
                      pointerEvents="none"
                    >
                      <Search size={14} />
                    </Box>
                    <Input
                      size="sm"
                      pl="34px"
                      placeholder="Search tests..."
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                    />
                  </Box>

                  {testsLoading ? (
                    <Flex justify="center" py={8}>
                      <Spinner size="md" />
                    </Flex>
                  ) : filteredTests.length === 0 ? (
                    <Text
                      color="gray.500"
                      textAlign="center"
                      py={6}
                      fontSize="sm"
                    >
                      No published mock tests found.
                    </Text>
                  ) : (
                    <VStack gap={2} align="stretch" maxH="50vh" overflow="auto">
                      {filteredTests.map((test) => (
                        <Card.Root
                          key={test.id}
                          cursor="pointer"
                          borderWidth={
                            selectedTest?.id === test.id ? "2px" : "1px"
                          }
                          borderColor={
                            selectedTest?.id === test.id
                              ? "blue.500"
                              : "gray.200"
                          }
                          _dark={{
                            borderColor:
                              selectedTest?.id === test.id
                                ? "blue.400"
                                : "gray.600",
                          }}
                          borderRadius="lg"
                          transition="all 0.15s"
                          _hover={{ shadow: "sm" }}
                          onClick={() => setSelectedTest(test)}
                        >
                          <Card.Body py={3} px={4}>
                            <Flex justify="space-between" align="center">
                              <Box>
                                <Text fontWeight="600" fontSize="sm">
                                  {test.title}
                                </Text>
                                <HStack gap={2} mt={1}>
                                  {test.category && (
                                    <Badge
                                      size="sm"
                                      variant="subtle"
                                      colorPalette="gray"
                                    >
                                      {test.category}
                                    </Badge>
                                  )}
                                  <Badge
                                    size="sm"
                                    variant="subtle"
                                    colorPalette="blue"
                                  >
                                    {test.mode}
                                  </Badge>
                                </HStack>
                              </Box>
                              {selectedTest?.id === test.id && (
                                <CheckCircle size={18} color="#3B82F6" />
                              )}
                            </Flex>
                          </Card.Body>
                        </Card.Root>
                      ))}
                    </VStack>
                  )}
                </VStack>
              )}

              {/* STEP 2: Select Students */}
              {step === 2 && (
                <VStack gap={3} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.600">
                      {selectedStudentIds.size} of {students.length} selected
                    </Text>
                    <HStack gap={2}>
                      <Button size="xs" variant="ghost" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button size="xs" variant="ghost" onClick={deselectAll}>
                        Deselect All
                      </Button>
                    </HStack>
                  </Flex>

                  <VStack gap={2} align="stretch" maxH="50vh" overflow="auto">
                    {students.map((item) => {
                      const studentId =
                        item.student?.user_id || item.student_id || "";
                      const fullName = [
                        item.student?.first_name,
                        item.student?.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      const isSelected = selectedStudentIds.has(studentId);

                      return (
                        <Card.Root
                          key={item.id}
                          cursor="pointer"
                          borderWidth={isSelected ? "2px" : "1px"}
                          borderColor={isSelected ? "blue.500" : "gray.200"}
                          _dark={{
                            borderColor: isSelected ? "blue.400" : "gray.600",
                          }}
                          borderRadius="lg"
                          transition="all 0.15s"
                          onClick={() => toggleStudent(studentId)}
                        >
                          <Card.Body py={2.5} px={4}>
                            <Flex justify="space-between" align="center">
                              <HStack gap={2}>
                                <Avatar.Root size="xs">
                                  <Avatar.Fallback
                                    name={
                                      fullName || item.student?.username || "S"
                                    }
                                  />
                                  {item.student?.avatar_url && (
                                    <Avatar.Image
                                      src={item.student.avatar_url}
                                    />
                                  )}
                                </Avatar.Root>
                                <Box>
                                  <Text fontWeight="600" fontSize="sm">
                                    {fullName ||
                                      item.student?.username ||
                                      "Unknown"}
                                  </Text>
                                  {item.student?.username && (
                                    <Text fontSize="xs" color="gray.500">
                                      @{item.student.username}
                                    </Text>
                                  )}
                                </Box>
                              </HStack>
                              {isSelected && (
                                <CheckCircle size={16} color="#3B82F6" />
                              )}
                            </Flex>
                          </Card.Body>
                        </Card.Root>
                      );
                    })}
                  </VStack>
                </VStack>
              )}

              {/* STEP 3: Confirm */}
              {step === 3 && (
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="600" mb={1}>
                      Mock Test Title
                    </Text>
                    <Input
                      size="sm"
                      placeholder={selectedTest?.title || "Mock Test Title"}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Leave empty to use the test name: &quot;
                      {selectedTest?.title}&quot;
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="600" mb={2}>
                      Summary
                    </Text>
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Test:
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          {selectedTest?.title}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Students:
                        </Text>
                        <Badge colorPalette="blue">
                          {selectedStudentIds.size} student
                          {selectedStudentIds.size > 1 ? "s" : ""}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Group:
                        </Text>
                        <Text fontSize="sm">{groupName || groupId}</Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Student list preview */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.500"
                      mb={1}
                    >
                      Assigned to:
                    </Text>
                    <Flex flexWrap="wrap" gap={1}>
                      {students
                        .filter((s) =>
                          selectedStudentIds.has(
                            s.student?.user_id || s.student_id || "",
                          ),
                        )
                        .map((s) => (
                          <Badge
                            key={s.id}
                            size="sm"
                            variant="subtle"
                            colorPalette="gray"
                          >
                            {[s.student?.first_name, s.student?.last_name]
                              .filter(Boolean)
                              .join(" ") ||
                              s.student?.username ||
                              "Unknown"}
                          </Badge>
                        ))}
                    </Flex>
                  </Box>
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer pt={3}>
              <HStack gap={2} w="full" justify="space-between">
                <Box>
                  {step > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStep((s) => s - 1)}
                      disabled={submitting}
                    >
                      Back
                    </Button>
                  )}
                </Box>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  {step < 3 ? (
                    <Button
                      size="sm"
                      colorPalette="brand"
                      disabled={
                        (step === 1 && !selectedTest) ||
                        (step === 2 && selectedStudentIds.size === 0)
                      }
                      onClick={() => setStep((s) => s + 1)}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      colorPalette="brand"
                      onClick={handleSubmit}
                      loading={submitting}
                      disabled={submitting}
                    >
                      Assign ({selectedStudentIds.size})
                    </Button>
                  )}
                </HStack>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
