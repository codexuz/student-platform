"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  VStack,
  Input,
  Textarea,
  Spinner,
  Badge,
  IconButton,
  NativeSelect,
  Text,
  Separator,
} from "@chakra-ui/react";
import {
  Plus,
  Trash2,
  Save,
  X,
  Clock,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ieltsSpeakingAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";

interface SQuestion {
  id: string;
  question_text: string;
  order: number;
}
interface SPart {
  id: string;
  part: "PART_1" | "PART_2" | "PART_3";
  title?: string;
  cue_card?: string;
  prep_seconds?: number;
  speak_seconds?: number;
  order: number;
  questions?: SQuestion[];
}

const PART_LABEL: Record<string, string> = {
  PART_1: "Part 1 · Interview",
  PART_2: "Part 2 · Cue Card",
  PART_3: "Part 3 · Discussion",
};

export default function SpeakingPartsManager({
  speakingId,
}: {
  speakingId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [parts, setParts] = useState<SPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await ieltsSpeakingAPI.getById(speakingId);
      setTitle(r?.title || "Speaking Topic");
      const list: SPart[] = (r?.parts || []).slice().sort(
        (a: SPart, b: SPart) => a.order - b.order,
      );
      setParts(list);
    } catch {
      toaster.error({ title: "Failed to load topic" });
    } finally {
      setLoading(false);
    }
  }, [speakingId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
    );

  return (
    <Box>
      <HStack gap={1.5} fontSize="sm" color="gray.400" mb={4}>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() => router.push("/ielts-test-builder/speakings")}
        >
          Speaking
        </Text>
        <Text>/</Text>
        <Text>{title}</Text>
      </HStack>

      <Flex justify="space-between" align="center" mb={4} gap={3} flexWrap="wrap">
        <HStack>
          <IconButton
            aria-label="Back"
            size="sm"
            variant="ghost"
            onClick={() => router.push("/ielts-test-builder/speakings")}
          >
            <ArrowLeft size={16} />
          </IconButton>
          <Heading size="md">{title} — Parts</Heading>
        </HStack>
        <Button
          size="sm"
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#4338ca" }}
          onClick={() => setAdding((v) => !v)}
        >
          <Plus size={16} /> Add Part
        </Button>
      </Flex>

      {adding && (
        <PartForm
          speakingId={speakingId}
          existingCount={parts.length}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}

      <VStack align="stretch" gap={4} mt={4}>
        {parts.length === 0 && !adding && (
          <Box
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderWidth="1px"
            rounded="lg"
            py={10}
            textAlign="center"
            color="gray.500"
          >
            No parts yet. Add Part 1, 2 and 3 to build the exam.
          </Box>
        )}
        {parts.map((p) => (
          <PartCard key={p.id} part={p} onChanged={load} />
        ))}
      </VStack>
    </Box>
  );
}

// ── Part card (display + edit + questions) ──────────────────────────────────

function PartCard({ part, onChanged }: { part: SPart; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${PART_LABEL[part.part]}?`)) return;
    try {
      await ieltsSpeakingAPI.deletePart(part.id);
      toaster.success({ title: "Part deleted" });
      onChanged();
    } catch (e: unknown) {
      toaster.error({ title: "Delete failed", description: (e as Error).message });
    }
  };

  return (
    <Box bg="white" _dark={{ bg: "gray.800" }} borderWidth="1px" rounded="lg" overflow="hidden">
      <Flex justify="space-between" align="center" px={5} py={3} borderBottomWidth="1px">
        <HStack gap={3}>
          <Badge
            colorPalette={
              part.part === "PART_1" ? "blue" : part.part === "PART_2" ? "purple" : "teal"
            }
            variant="subtle"
          >
            {PART_LABEL[part.part]}
          </Badge>
          {part.title && <Text fontWeight="500">{part.title}</Text>}
          {part.part === "PART_2" && (
            <HStack color="gray.500" fontSize="xs">
              <Clock size={13} />
              <Text>
                {part.prep_seconds ?? 60}s prep · {part.speak_seconds ?? 120}s
                speak
              </Text>
            </HStack>
          )}
        </HStack>
        <HStack gap={1}>
          <IconButton
            aria-label="Edit part"
            size="xs"
            variant="ghost"
            onClick={() => setEditing((v) => !v)}
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton
            aria-label="Delete part"
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={handleDelete}
          >
            <Trash2 size={14} />
          </IconButton>
        </HStack>
      </Flex>

      <Box px={5} py={4}>
        {editing ? (
          <PartForm
            speakingId={part.id /* unused in edit */}
            part={part}
            onClose={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              onChanged();
            }}
          />
        ) : (
          <>
            {part.part === "PART_2" && part.cue_card && (
              <Box
                bg="gray.50"
                _dark={{ bg: "whiteAlpha.100" }}
                rounded="md"
                p={3}
                mb={3}
                fontSize="sm"
                fontStyle="italic"
                color="gray.700"
              >
                {part.cue_card}
              </Box>
            )}
            <QuestionsEditor partId={part.id} questions={part.questions || []} onChanged={onChanged} />
          </>
        )}
      </Box>
    </Box>
  );
}

// ── Part create/edit form ───────────────────────────────────────────────────

function PartForm({
  speakingId,
  part,
  existingCount = 0,
  onClose,
  onSaved,
}: {
  speakingId: string;
  part?: SPart;
  existingCount?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!part;
  const [partType, setPartType] = useState(part?.part || "PART_1");
  const [title, setTitle] = useState(part?.title || "");
  const [cueCard, setCueCard] = useState(part?.cue_card || "");
  const [prep, setPrep] = useState(part?.prep_seconds ?? 60);
  const [speak, setSpeak] = useState(part?.speak_seconds ?? 120);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        part: partType,
        title: title || undefined,
        order: existingCount,
      };
      if (partType === "PART_2") {
        body.cue_card = cueCard || undefined;
        body.prep_seconds = Number(prep) || 60;
        body.speak_seconds = Number(speak) || 120;
      }
      if (isEdit) {
        await ieltsSpeakingAPI.updatePart(part.id, body);
        toaster.success({ title: "Part updated" });
      } else {
        await ieltsSpeakingAPI.createPart({ ...body, speaking_id: speakingId });
        toaster.success({ title: "Part added" });
      }
      onSaved();
    } catch (e: unknown) {
      toaster.error({ title: "Save failed", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      bg={isEdit ? "transparent" : "white"}
      _dark={{ bg: isEdit ? "transparent" : "gray.800" }}
      borderWidth={isEdit ? "0" : "1px"}
      rounded="lg"
      p={isEdit ? 0 : 4}
    >
      <VStack align="stretch" gap={3}>
        <HStack gap={3} align="flex-end">
          <Box flex="0 0 180px">
            <Label>Part</Label>
            <NativeSelect.Root size="sm">
              <NativeSelect.Field
                value={partType}
                onChange={(e) =>
                  setPartType(e.target.value as SPart["part"])
                }
              >
                <option value="PART_1">Part 1 · Interview</option>
                <option value="PART_2">Part 2 · Cue Card</option>
                <option value="PART_3">Part 3 · Discussion</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
          <Box flex="1">
            <Label>Topic / Title</Label>
            <Input
              size="sm"
              placeholder="e.g. Hometown"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Box>
        </HStack>

        {partType === "PART_2" && (
          <>
            <Box>
              <Label>Cue card</Label>
              <Textarea
                size="sm"
                rows={3}
                placeholder="Describe a place you like to visit. You should say…"
                value={cueCard}
                onChange={(e) => setCueCard(e.target.value)}
              />
            </Box>
            <HStack gap={3}>
              <Box flex="1">
                <Label>Prep time (seconds)</Label>
                <Input
                  size="sm"
                  type="number"
                  value={prep}
                  onChange={(e) => setPrep(Number(e.target.value))}
                />
              </Box>
              <Box flex="1">
                <Label>Speaking time (seconds)</Label>
                <Input
                  size="sm"
                  type="number"
                  value={speak}
                  onChange={(e) => setSpeak(Number(e.target.value))}
                />
              </Box>
            </HStack>
          </>
        )}

        <HStack gap={2}>
          <Button
            size="sm"
            bg="#10b981"
            color="white"
            _hover={{ bg: "#059669" }}
            onClick={save}
            loading={saving}
          >
            <Save size={14} /> {isEdit ? "Update Part" : "Add Part"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X size={14} /> Cancel
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

// ── Questions editor (inside a part) ────────────────────────────────────────

function QuestionsEditor({
  partId,
  questions,
  onChanged,
}: {
  partId: string;
  questions: SQuestion[];
  onChanged: () => void;
}) {
  const [newText, setNewText] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const ordered = questions.slice().sort((a, b) => a.order - b.order);

  const add = async () => {
    const text = newText.trim();
    if (!text) return;
    setBusy(true);
    try {
      await ieltsSpeakingAPI.createQuestion({
        part_id: partId,
        question_text: text,
        order: questions.length,
      });
      setNewText("");
      onChanged();
    } catch (e: unknown) {
      toaster.error({ title: "Add failed", description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id: string) => {
    const text = editText.trim();
    if (!text) return;
    try {
      await ieltsSpeakingAPI.updateQuestion(id, { question_text: text });
      setEditId(null);
      onChanged();
    } catch (e: unknown) {
      toaster.error({ title: "Update failed", description: (e as Error).message });
    }
  };

  const remove = async (id: string) => {
    try {
      await ieltsSpeakingAPI.deleteQuestion(id);
      onChanged();
    } catch (e: unknown) {
      toaster.error({ title: "Delete failed", description: (e as Error).message });
    }
  };

  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="700"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="0.3px"
        mb={2}
      >
        Questions ({ordered.length})
      </Text>
      <VStack align="stretch" gap={2} mb={3}>
        {ordered.map((q, i) => (
          <Flex key={q.id} align="center" gap={2}>
            <Text color="gray.400" fontSize="sm" w="20px">
              {i + 1}.
            </Text>
            {editId === q.id ? (
              <>
                <Input
                  size="sm"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(q.id)}
                />
                <IconButton
                  aria-label="Save"
                  size="xs"
                  colorPalette="green"
                  onClick={() => saveEdit(q.id)}
                >
                  <Save size={13} />
                </IconButton>
                <IconButton
                  aria-label="Cancel"
                  size="xs"
                  variant="ghost"
                  onClick={() => setEditId(null)}
                >
                  <X size={13} />
                </IconButton>
              </>
            ) : (
              <>
                <Text flex="1" fontSize="sm">
                  {q.question_text}
                </Text>
                <IconButton
                  aria-label="Edit"
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setEditId(q.id);
                    setEditText(q.question_text);
                  }}
                >
                  <Pencil size={13} />
                </IconButton>
                <IconButton
                  aria-label="Delete"
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => remove(q.id)}
                >
                  <Trash2 size={13} />
                </IconButton>
              </>
            )}
          </Flex>
        ))}
      </VStack>
      <Separator mb={3} />
      <HStack gap={2}>
        <Input
          size="sm"
          placeholder="Add a question…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button size="sm" variant="outline" onClick={add} loading={busy}>
          <Plus size={14} /> Add
        </Button>
      </HStack>
    </Box>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="600"
      color="gray.600"
      _dark={{ color: "gray.400" }}
      mb={1}
      textTransform="uppercase"
      letterSpacing="0.3px"
    >
      {children}
    </Text>
  );
}
