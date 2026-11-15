import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllowableStatuses, getChildren, getPart, updatePart } from './api';
import type { UpdatePartBody } from './types';

export function useChildren(parentUuid?: string, enabled = true) {
  return useQuery({
    queryKey: ['children', parentUuid ?? 'root'],
    queryFn: () => getChildren(parentUuid),
    enabled,
  });
}

export function usePart(uuid: string) {
  return useQuery({
    queryKey: ['part', uuid],
    queryFn: () => getPart(uuid),
  });
}

export function useAllowableStatuses(uuid: string) {
  return useQuery({
    queryKey: ['allowable-statuses', uuid],
    queryFn: () => getAllowableStatuses(uuid),
  });
}

export function useUpdatePart(uuid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePartBody) => updatePart(uuid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part', uuid] });
      queryClient.invalidateQueries({ queryKey: ['allowable-statuses'] });
    },
  });
}