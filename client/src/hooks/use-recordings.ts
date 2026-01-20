import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertRecording } from "@shared/routes";

export function useRecordings(params?: { mood?: string; sort?: 'latest' | 'popular'; userId?: string }) {
  const queryKey = [api.recordings.list.path, params];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Filter out undefined params
      const cleanParams: Record<string, string> = {};
      if (params?.mood) cleanParams.mood = params.mood;
      if (params?.sort) cleanParams.sort = params.sort;
      if (params?.userId) cleanParams.userId = params.userId;

      const url = buildUrl(api.recordings.list.path);
      const query = new URLSearchParams(cleanParams).toString();
      
      const res = await fetch(`${url}?${query}`);
      if (!res.ok) throw new Error("Failed to fetch recordings");
      return api.recordings.list.responses[200].parse(await res.json());
    },
  });
}

export function useRecording(id: number) {
  return useQuery({
    queryKey: [api.recordings.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.recordings.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch recording");
      return api.recordings.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useRandomRecording() {
  const queryClient = useQueryClient();
  
  // We use a custom fetcher here that we can call imperatively if needed, 
  // but hook usage is good for initial load
  return useQuery({
    queryKey: [api.recordings.getRandom.path],
    queryFn: async () => {
      const res = await fetch(api.recordings.getRandom.path);
      if (!res.ok) throw new Error("No recordings found");
      return api.recordings.getRandom.responses[200].parse(await res.json());
    },
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fresh for random
  });
}

export function useCreateRecording() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertRecording) => {
      const validated = api.recordings.create.input.parse(data);
      const res = await fetch(api.recordings.create.path, {
        method: api.recordings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) throw new Error("Failed to create recording");
      return api.recordings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recordings.list.path] });
    },
  });
}

export function useLikeRecording() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: string }) => {
      const url = buildUrl(api.recordings.like.path, { id });
      const res = await fetch(url, {
        method: api.recordings.like.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) throw new Error("Failed to like recording");
      return api.recordings.like.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      // Invalidate list and specific recording to update like counts
      queryClient.invalidateQueries({ queryKey: [api.recordings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.recordings.get.path, id] });
    },
  });
}
