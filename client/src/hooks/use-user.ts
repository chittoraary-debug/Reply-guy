import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type UserResponse } from "@shared/routes";
import { useEffect, useState } from "react";

// Keys for local storage
const USER_ID_KEY = "voice_diary_user_id";

export function useUser() {
  // Initialize state from local storage to avoid flash
  const [localUserId, setLocalUserId] = useState<string | null>(() => {
    return localStorage.getItem(USER_ID_KEY);
  });

  // Query for user data if we have an ID
  const { data: user, isLoading } = useQuery({
    queryKey: [api.users.get.path, localUserId],
    queryFn: async () => {
      if (!localUserId) return null;
      const url = api.users.get.path.replace(":id", localUserId);
      const res = await fetch(url);
      if (res.status === 404) {
        // ID invalid/deleted, clear it
        localStorage.removeItem(USER_ID_KEY);
        setLocalUserId(null);
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!localUserId,
  });

  // Mutation to create a new user
  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.users.create.path, {
        method: api.users.create.method,
        headers: { "Content-Type": "application/json" },
        // Seed is optional, let server generate default if needed, or we could pass one
        body: JSON.stringify({}), 
      });
      if (!res.ok) throw new Error("Failed to create user");
      return api.users.create.responses[201].parse(await res.json());
    },
    onSuccess: (newUser) => {
      localStorage.setItem(USER_ID_KEY, newUser.id);
      setLocalUserId(newUser.id);
    },
  });

  // Auto-create user if none exists and not loading
  useEffect(() => {
    if (!localUserId && !createUserMutation.isPending && !user && !isLoading) {
      createUserMutation.mutate();
    }
  }, [localUserId, createUserMutation, user, isLoading]);

  return {
    user,
    isLoading: isLoading || createUserMutation.isPending,
    userId: localUserId,
  };
}
