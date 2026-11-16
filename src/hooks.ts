import { useSyncExternalStore } from 'react';
import { onlineManager, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllowableStatuses, getChildren, getPart, updatePart } from './api';
import type { UpdatePartBody } from './types';

// True while the browser is online. Uses the same onlineManager that TanStack Query
// uses to pause and resume queries, so the banner and the queries always agree.
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}

export function useChildren(parentUuid?: string) {
  return useQuery({
    queryKey: ['children', parentUuid ?? 'root'],
    queryFn: () => getChildren(parentUuid),
  });
}

export function usePart(uuid: string) {
  return useQuery({
    queryKey: ['part', uuid],
    queryFn: () => getPart(uuid),
    staleTime: 5 * 60 * 1000, // 5 min. Parts rarely change, and useUpdatePart refreshes them after an edit.
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