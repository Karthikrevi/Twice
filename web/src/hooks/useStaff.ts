import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "waiter" | "kitchen";
  created_at: string;
}

export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff,
    queryFn: async () => (await api.get<StaffRow[]>("/staff")).data,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      password: string;
      role: "manager" | "waiter" | "kitchen";
    }) => {
      await api.post("/staff", input);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.staff }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/staff/${id}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.staff }),
  });
}
