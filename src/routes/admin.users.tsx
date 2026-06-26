import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setUserRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  role: string;
  retailer_status: string | null;
  created_at: string;
};

function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,business_name,role,retailer_status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Row[]) ?? [];
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "customer" | "retailer" | "admin" }) => {
      await setUserRole({ data: { userId, role } });
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.business_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or business…"
          className="w-full max-w-md rounded-sm border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-secondary/40 text-left">
            <tr>
              <Th>User</Th>
              <Th>Business</Th>
              <Th>Current role</Th>
              <Th>Change role</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No users.</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <Td>
                    <div className="font-medium">{u.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </Td>
                  <Td>{u.business_name || <span className="text-muted-foreground">—</span>}</Td>
                  <Td>
                    <RolePill role={u.role} />
                    {u.role === "retailer" && u.retailer_status && (
                      <div className="mt-1 text-[0.65rem] uppercase tracking-widest text-muted-foreground">{u.retailer_status}</div>
                    )}
                  </Td>
                  <Td>
                    <select
                      value={u.role}
                      disabled={setRole.isPending}
                      onChange={(e) => {
                        const role = e.target.value as "customer" | "retailer" | "admin";
                        if (role === u.role) return;
                        if (role === "admin" && !confirm(`Promote ${u.email} to ADMIN?`)) return;
                        setRole.mutate({ userId: u.id, role });
                      }}
                      className="rounded-sm border border-border bg-background px-3 py-1.5 text-xs uppercase tracking-widest focus:border-primary focus:outline-none"
                    >
                      <option value="customer">Customer</option>
                      <option value="retailer">Retailer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    retailer: "bg-accent/40 text-foreground",
    customer: "bg-secondary text-foreground",
  };
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-widest ${map[role] ?? "bg-secondary"}`}>
      {role}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 align-top">{children}</td>;
}
