"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  fetchSequences,
  fetchSequence,
  createSequence,
  fetchSequenceSteps,
  addSequenceStep,
  type Sequence,
  type SequenceStep,
  type CreateSequenceInput,
  type AddStepInput,
} from "@/lib/api/sequences";

export const SEQUENCES_KEY = "sequences";
export const SEQUENCE_STEPS_KEY = "sequence-steps";

export function useSequences(params?: { campaignId?: string }) {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [SEQUENCES_KEY, params],
    queryFn: () => fetchSequences(params),
    enabled: !authLoading && !!user,
    placeholderData: (prev) => prev,
  });
}

export function useSequence(id: string | null) {
  return useQuery({
    queryKey: [SEQUENCES_KEY, id],
    queryFn: () => fetchSequence(id!),
    enabled: !!id,
  });
}

export function useSequenceSteps(sequenceId: string | null) {
  return useQuery({
    queryKey: [SEQUENCE_STEPS_KEY, sequenceId],
    queryFn: () => fetchSequenceSteps(sequenceId!),
    enabled: !!sequenceId,
    placeholderData: (prev) => prev,
  });
}

export function useCreateSequence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSequenceInput) => createSequence(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SEQUENCES_KEY] }),
  });
}

export function useAddSequenceStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sequenceId, input }: { sequenceId: string; input: AddStepInput }) =>
      addSequenceStep(sequenceId, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [SEQUENCE_STEPS_KEY, vars.sequenceId] });
    },
  });
}

export type { Sequence, SequenceStep };
