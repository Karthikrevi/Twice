export const queryKeys = {
  me: ["auth", "me"] as const,
  orders: ["orders"] as const,
  menu: ["menu"] as const,
  tables: ["tables"] as const,
  tableSession: (id: string) => ["tables", "session", id] as const,
  reports: ["reports", "daily"] as const,
  staff: ["staff"] as const,
  platforms: ["platforms"] as const,
};
