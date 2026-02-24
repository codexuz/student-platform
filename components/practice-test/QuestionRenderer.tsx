"use client";

import { Box, Text } from "@chakra-ui/react";
import type { IELTSQuestionType } from "@/components/ielts-builder/types";
import type { QuestionComponentProps } from "./types";
import {
  NoteCompletion,
  TrueFalseNotGiven,
  YesNoNotGiven,
  MatchingInformation,
  MatchingHeadings,
  SentenceCompletion,
  SummaryCompletion,
  SummaryCompletionDragDrop,
  MultipleChoice,
  MultipleAnswer,
  ShortAnswer,
  TableCompletion,
  MatchingFeatures,
  MatchingSentenceEndings,
  PlanMapLabelling,
  DiagramLabelling,
} from "./questions";

const QUESTION_COMPONENTS: Record<
  IELTSQuestionType,
  React.ComponentType<QuestionComponentProps>
> = {
  NOTE_COMPLETION: NoteCompletion,
  TRUE_FALSE_NOT_GIVEN: TrueFalseNotGiven,
  YES_NO_NOT_GIVEN: YesNoNotGiven,
  MATCHING_INFORMATION: MatchingInformation,
  MATCHING_HEADINGS: MatchingHeadings,
  SENTENCE_COMPLETION: SentenceCompletion,
  SUMMARY_COMPLETION: SummaryCompletion,
  SUMMARY_COMPLETION_DRAG_DROP: SummaryCompletionDragDrop,
  MULTIPLE_CHOICE: MultipleChoice,
  MULTIPLE_ANSWER: MultipleAnswer,
  SHORT_ANSWER: ShortAnswer,
  TABLE_COMPLETION: TableCompletion,
  FLOW_CHART_COMPLETION: SentenceCompletion, // reuse sentence completion UI
  DIAGRAM_LABELLING: DiagramLabelling,
  MATCHING_FEATURES: MatchingFeatures,
  MATCHING_SENTENCE_ENDINGS: MatchingSentenceEndings,
  PLAN_MAP_LABELLING: PlanMapLabelling,
};

/**
 * Renders the correct question component based on question type.
 */
export default function QuestionRenderer(props: QuestionComponentProps) {
  const type = props.question.type;

  if (!type) {
    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="md"
        borderColor="orange.300"
        bg="orange.50"
      >
        <Text fontSize="sm" color="orange.700">
          Unknown question type
        </Text>
      </Box>
    );
  }

  const Component = QUESTION_COMPONENTS[type];

  if (!Component) {
    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="md"
        borderColor="orange.300"
        bg="orange.50"
      >
        <Text fontSize="sm" color="orange.700">
          Unsupported question type: {type}
        </Text>
      </Box>
    );
  }

  return <Component {...props} />;
}
