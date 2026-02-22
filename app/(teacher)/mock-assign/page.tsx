"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
  HStack,
  VStack,
  Table,
  EmptyState,
  Pagination,
  ButtonGroup,
  IconButton,
  Input,
  Dialog,
  Portal,
  Field,
} from "@chakra-ui/react";
import {
  Plus,
  Phone,
  User,
  Search,
  Trash2,
  Power,
  Eye,
  EyeOff,
} from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { guestStudentsAPI } from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";

const PAGE_SIZE = 10;
const DEFAULT_LEVEL_ID = "1c06a974-b102-42ef-9f39-15f76742d846";

interface GuestStudent {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active?: boolean;
  full_name?: string;
  phone_number?: string;
  additional_number?: string;
  created_at?: string;
}

export default function MockAssignPage() {
  return (
    <ProtectedRoute>
      <MockAssignContent />
    </ProtectedRoute>
  );
}

function MockAssignContent() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<GuestStudent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuestStudent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [form, setForm] = useState({
    phone: "",
    username: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await guestStudentsAPI.getAll();
      const list: GuestStudent[] = Array.isArray(data)
        ? data
        : (data?.data ?? []);
      setTotal(list.length);

      // Client-side search filter
      const filtered = search
        ? list.filter(
            (s) =>
              s.username?.toLowerCase().includes(search.toLowerCase()) ||
              s.first_name?.toLowerCase().includes(search.toLowerCase()) ||
              s.last_name?.toLowerCase().includes(search.toLowerCase()) ||
              s.phone?.includes(search),
          )
        : list;

      // Client-side pagination
      const start = (page - 1) * PAGE_SIZE;
      setStudents(filtered.slice(start, start + PAGE_SIZE));
      setTotal(filtered.length);
    } catch (err) {
      console.error("Failed to fetch guest students:", err);
      toaster.error({ title: "Failed to load students" });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const resetForm = () =>
    setForm({
      phone: "",
      username: "",
      password: "",
      first_name: "",
      last_name: "",
    });

  const handleCreate = async () => {
    if (!form.phone || !form.username || !form.password) return;
    setCreating(true);
    try {
      const rawPhone = "+" + form.phone.replace(/\D/g, "");
      await guestStudentsAPI.register({
        ...form,
        phone: rawPhone,
        level_id: DEFAULT_LEVEL_ID,
        full_name: "",
        phone_number: "",
        additional_number: "",
      });
      setModalOpen(false);
      resetForm();
      setPage(1);
      fetchStudents();
      toaster.success({ title: "Student created successfully" });
    } catch (err) {
      console.error("Failed to create guest student:", err);
      toaster.error({ title: "Failed to create student" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (student: GuestStudent) => {
    setActionLoading(student.user_id);
    try {
      if (student.is_active) {
        await guestStudentsAPI.deactivate(student.user_id);
        toaster.success({ title: "Student deactivated" });
      } else {
        await guestStudentsAPI.activate(student.user_id);
        toaster.success({ title: "Student activated" });
      }
      fetchStudents();
    } catch (err) {
      console.error("Failed to toggle student status:", err);
      toaster.error({ title: "Failed to update status" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.user_id);
    try {
      await guestStudentsAPI.hardDelete(deleteTarget.user_id);
      toaster.success({ title: "Student deleted" });
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      console.error("Failed to delete student:", err);
      toaster.error({ title: "Failed to delete student" });
    } finally {
      setActionLoading(null);
    }
  };

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
          <Heading size={{ base: "sm", md: "md" }}>Mock Assign</Heading>
          <HStack gap={{ base: 2, md: 4 }}>
            <NotificationsDrawer />
          </HStack>
        </Flex>

        <Box p={{ base: 4, md: 6 }} maxW="1100px" mx="auto">
          {/* Toolbar */}
          <Flex
            mb={6}
            gap={3}
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
          >
            <HStack flex={1} maxW={{ sm: "320px" }}>
              <Box position="relative" flex={1}>
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={1}
                  color="gray.400"
                >
                  <Search size={16} />
                </Box>
                <Input
                  size="sm"
                  pl={9}
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </Box>
            </HStack>
            <Button
              size="sm"
              colorPalette="brand"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={16} />
              Add Student
            </Button>
          </Flex>

          {/* Table */}
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : students.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Title>No students found</EmptyState.Title>
                <EmptyState.Description>
                  {search
                    ? "No students match your search."
                    : "Add guest students to get started."}
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Box
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              bg="white"
              _dark={{ bg: "gray.800" }}
            >
              <Table.Root size="sm" variant="outline" interactive>
                <Table.Header>
                  <Table.Row bg="gray.50" _dark={{ bg: "gray.700" }}>
                    <Table.ColumnHeader
                      px={4}
                      py={3}
                      fontSize="xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      color="gray.500"
                    >
                      #
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      px={4}
                      py={3}
                      fontSize="xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      color="gray.500"
                    >
                      Name
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      px={4}
                      py={3}
                      fontSize="xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      color="gray.500"
                    >
                      Username
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      px={4}
                      py={3}
                      fontSize="xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      color="gray.500"
                      display={{ base: "none", md: "table-cell" }}
                    >
                      Phone
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      px={4}
                      py={3}
                      fontSize="xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      color="gray.500"
                      display={{ base: "none", md: "table-cell" }}
                    >
                      Created
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      px={4}
                      py={3}
                      fontSize="xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      color="gray.500"
                      display={{ base: "none", md: "table-cell" }}
                    >
                      Status
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      px={4}
                      py={3}
                      fontSize="xs"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      color="gray.500"
                      textAlign="end"
                    >
                      Actions
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {students.map((student, idx) => (
                    <Table.Row key={student.user_id}>
                      <Table.Cell px={4} py={3}>
                        <Text fontSize="sm" color="gray.500">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4} py={3}>
                        <HStack gap={2}>
                          <Flex
                            align="center"
                            justify="center"
                            w="32px"
                            h="32px"
                            borderRadius="full"
                            bg="brand.50"
                            _dark={{ bg: "brand.900" }}
                            flexShrink={0}
                          >
                            <User
                              size={14}
                              color="var(--chakra-colors-brand-500)"
                            />
                          </Flex>
                          <Text fontWeight="medium" fontSize="sm">
                            {[student.first_name, student.last_name]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </Text>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell px={4} py={3}>
                        <Badge fontSize="2xs" variant="outline">
                          {student.username}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell
                        px={4}
                        py={3}
                        display={{ base: "none", md: "table-cell" }}
                      >
                        <HStack gap={1}>
                          <Phone size={12} />
                          <Text fontSize="xs" color="gray.500">
                            {student.phone || "—"}
                          </Text>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell
                        px={4}
                        py={3}
                        display={{ base: "none", md: "table-cell" }}
                      >
                        <Text fontSize="xs" color="gray.500">
                          {student.created_at
                            ? new Date(student.created_at).toLocaleDateString()
                            : "—"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell
                        px={4}
                        py={3}
                        display={{ base: "none", md: "table-cell" }}
                      >
                        <Badge
                          fontSize="2xs"
                          colorPalette={
                            student.is_active !== false ? "green" : "red"
                          }
                        >
                          {student.is_active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={4} py={3} textAlign="end">
                        <HStack gap={1} justify="flex-end">
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette={
                              student.is_active !== false ? "orange" : "green"
                            }
                            aria-label={
                              student.is_active !== false
                                ? "Deactivate"
                                : "Activate"
                            }
                            loading={actionLoading === student.user_id}
                            onClick={() => handleToggleActive(student)}
                          >
                            <Power size={14} />
                          </IconButton>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            aria-label="Delete"
                            onClick={() => setDeleteTarget(student)}
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

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <Flex justify="center" mt={6}>
              <Pagination.Root
                count={total}
                pageSize={PAGE_SIZE}
                page={page}
                onPageChange={(e) => setPage(e.page)}
              >
                <ButtonGroup variant="ghost" size="sm">
                  <Pagination.PrevTrigger asChild>
                    <IconButton>
                      <LuChevronLeft />
                    </IconButton>
                  </Pagination.PrevTrigger>
                  <Pagination.Items
                    render={(p) => (
                      <IconButton
                        variant={{ base: "ghost", _selected: "outline" }}
                      >
                        {p.value}
                      </IconButton>
                    )}
                  />
                  <Pagination.NextTrigger asChild>
                    <IconButton>
                      <LuChevronRight />
                    </IconButton>
                  </Pagination.NextTrigger>
                </ButtonGroup>
              </Pagination.Root>
            </Flex>
          )}
        </Box>
      </Box>

      <MobileBottomNav />

      {/* Create Student Modal */}
      <Dialog.Root
        open={modalOpen}
        onOpenChange={(e) => {
          setModalOpen(e.open);
          if (!e.open) resetForm();
        }}
        placement="center"
        motionPreset="scale"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              maxW="md"
              mx={4}
            >
              <Dialog.Header borderBottomWidth="1px">
                <Dialog.Title fontSize="lg">Add Guest Student</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body py={5}>
                <VStack gap={4}>
                  <HStack gap={3} w="full">
                    <Field.Root flex={1}>
                      <Field.Label fontSize="sm">First Name</Field.Label>
                      <Input
                        size="sm"
                        placeholder="John"
                        value={form.first_name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, first_name: e.target.value }))
                        }
                      />
                    </Field.Root>
                    <Field.Root flex={1}>
                      <Field.Label fontSize="sm">Last Name</Field.Label>
                      <Input
                        size="sm"
                        placeholder="Doe"
                        value={form.last_name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, last_name: e.target.value }))
                        }
                      />
                    </Field.Root>
                  </HStack>

                  <Field.Root>
                    <Field.Label fontSize="sm">Phone *</Field.Label>
                    <Input
                      size="sm"
                      placeholder="+998 XX XXX XX XX"
                      value={form.phone}
                      onChange={(e) => {
                        // Strip non-digits, keep only up to 12 digits (998 + 9 digits)
                        const raw = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 12);
                        let formatted = "";
                        if (raw.length > 0) formatted += "+" + raw.slice(0, 3);
                        if (raw.length > 3) formatted += " " + raw.slice(3, 5);
                        if (raw.length > 5) formatted += " " + raw.slice(5, 8);
                        if (raw.length > 8) formatted += " " + raw.slice(8, 10);
                        if (raw.length > 10)
                          formatted += " " + raw.slice(10, 12);
                        setForm((f) => ({ ...f, phone: formatted }));
                      }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="sm">Username *</Field.Label>
                    <Input
                      size="sm"
                      placeholder="john_doe"
                      value={form.username}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, username: e.target.value }))
                      }
                    />
                  </Field.Root>

                  <Field.Root w="full">
                    <Field.Label fontSize="sm">Password *</Field.Label>
                    <Box position="relative" w="full">
                      <Input
                        size="sm"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        pr={9}
                        value={form.password}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, password: e.target.value }))
                        }
                      />
                      <IconButton
                        variant="ghost"
                        size="xs"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        position="absolute"
                        right={1}
                        top="50%"
                        transform="translateY(-50%)"
                        onClick={() => setShowPassword((v) => !v)}
                        zIndex={1}
                      >
                        {showPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </IconButton>
                    </Box>
                  </Field.Root>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer borderTopWidth="1px" gap={3}>
                <Button
                  variant="outline"
                  size="sm"
                  borderRadius="full"
                  px={5}
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  colorPalette="brand"
                  borderRadius="full"
                  px={5}
                  fontWeight="semibold"
                  loading={creating}
                  disabled={!form.phone || !form.username || !form.password}
                  onClick={handleCreate}
                >
                  <Plus size={14} />
                  Create
                </Button>
              </Dialog.Footer>

              <Dialog.CloseTrigger
                asChild
                position="absolute"
                top={2}
                right={2}
              >
                <IconButton variant="ghost" size="sm" aria-label="Close" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete Confirm Modal */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={(e) => {
          if (!e.open) setDeleteTarget(null);
        }}
        placement="center"
        motionPreset="scale"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              maxW="sm"
              mx={4}
            >
              <Dialog.Header borderBottomWidth="1px">
                <Dialog.Title fontSize="lg">Delete Student</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body py={5}>
                <Text fontSize="sm">
                  Are you sure you want to permanently delete{" "}
                  <Text as="span" fontWeight="bold">
                    {[deleteTarget?.first_name, deleteTarget?.last_name]
                      .filter(Boolean)
                      .join(" ") || deleteTarget?.username}
                  </Text>
                  ? This action cannot be undone.
                </Text>
              </Dialog.Body>

              <Dialog.Footer borderTopWidth="1px" gap={3}>
                <Button
                  variant="outline"
                  size="sm"
                  borderRadius="full"
                  px={5}
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  colorPalette="red"
                  borderRadius="full"
                  px={5}
                  fontWeight="semibold"
                  loading={actionLoading === deleteTarget?.user_id}
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </Dialog.Footer>

              <Dialog.CloseTrigger
                asChild
                position="absolute"
                top={2}
                right={2}
              >
                <IconButton variant="ghost" size="sm" aria-label="Close" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Flex>
  );
}
