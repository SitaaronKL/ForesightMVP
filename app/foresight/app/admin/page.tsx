"use client";

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
  useAction,
} from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { LoginScreen } from "../../components/LoginScreen";
import { Sidebar } from "../../components/Sidebar";
import { Spinner } from "../../components/Spinner";
import { AgentRail } from "../../components/AgentRail";
import {
  AgentRailProvider,
  useAgentRail,
} from "../../components/AgentRailContext";
import { SageProvider } from "../../components/SageRuntime";
import { useMe } from "../../components/useMe";
import { useState } from "react";
import {
  Database,
  Activity,
  Users as UsersIcon,
  Trash2,
  Sunrise,
  Moon,
  RefreshCcw,
} from "lucide-react";

export default function AdminPage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center text-brand-700">
          <div className="glass px-8 py-6">
            <Spinner size={20} label="Loading…" />
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <LoginScreen />
      </Unauthenticated>
      <Authenticated>
        <AgentRailProvider>
          <AdminWorkspace />
        </AgentRailProvider>
      </Authenticated>
    </>
  );
}

function AdminWorkspace() {
  const me = useMe();
  const { collapsed, width } = useAgentRail();
  return (
    <SageProvider>
      <div className="min-h-screen">
        <Sidebar user={me} />
        <main
          style={{ paddingRight: collapsed ? 24 : width + 60 }}
          className="min-h-screen pl-[13.5rem] py-6 max-lg:!pr-6"
        >
          <div className="max-w-5xl mx-auto">
            <Admin />
          </div>
        </main>
        <AgentRail user={me} />
      </div>
    </SageProvider>
  );
}

function Admin() {
  const users = useQuery(api.queries.admin.listUsers, {});
  const nurse = users?.find((u) => u.role === "nurse");

  const me = useMe();
  const seedAction = useAction(api.seed.seed);
  const recompute = useMutation(api.scheduled.risk.recomputeAll);
  const triggerBriefing = useAction(api.admin.triggerMorningBriefing);
  const triggerEOD = useAction(api.admin.triggerEndOfDay);
  const deleteUser = useMutation(api.mutations.admin.deleteUser);
  const mergeFromDonor = useMutation(api.mutations.admin.mergeFromDonor);
  const setUserRole = useMutation(api.mutations.admin.setUserRole);

  const [running, setRunning] = useState<string | null>(null);
  const [log, setLog] = useState<{ kind: "info" | "ok" | "err"; text: string }[]>(
    [],
  );

  const push = (kind: "info" | "ok" | "err", text: string) =>
    setLog((l) => [
      { kind, text: `${new Date().toLocaleTimeString()} · ${text}` },
      ...l,
    ]);

  async function withSpinner(label: string, fn: () => Promise<any>) {
    setRunning(label);
    push("info", `Starting: ${label}`);
    try {
      const result = await fn();
      push(
        "ok",
        `${label} — ${JSON.stringify(result)?.slice(0, 120) ?? "ok"}`,
      );
    } catch (err: any) {
      push("err", `${label} failed: ${err?.message ?? "error"}`);
    } finally {
      setRunning(null);
    }
  }

  async function handleDeleteUser(id: Id<"users">, label: string) {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    await withSpinner(`Delete user ${label}`, () => deleteUser({ userId: id }));
  }

  async function handleSetRole(
    userId: Id<"users">,
    role: "nurse" | "patient",
    label: string,
  ) {
    await withSpinner(`Set ${label} role → ${role}`, () =>
      setUserRole({ userId, role }),
    );
  }

  async function handleMergeFromDonor(donorId: Id<"users">, label: string) {
    if (
      !confirm(
        `Merge ${label}'s role and identity into your account, then delete that row?\n\nThis is for cleaning up duplicate signups with the same email.`,
      )
    )
      return;
    await withSpinner(`Merge ${label} → me`, () =>
      mergeFromDonor({ donorUserId: donorId }),
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-brand-950">
          Admin console
        </h1>
        <p className="mt-1 text-sm text-brand-600">
          Demo controls — seed the panel, recompute risk, trigger briefings.
        </p>
      </header>

      {/* Operations grid */}
      <section className="glass overflow-hidden">
        <SectionHeader icon={<Database className="w-3.5 h-3.5" />} title="Operations" />
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <OpCard
            title="Seed 50 patients"
            description="Wipe the demo data and reseed with 50 patients, encounters, care plans, and service-element coverage."
            actionLabel={
              running === "Seed 50 patients (fresh)" ? "Seeding…" : "Seed (wipe + reseed)"
            }
            disabled={running !== null}
            primary
            onClick={() =>
              withSpinner("Seed 50 patients (fresh)", () =>
                seedAction({ reset: true }),
              )
            }
            icon={<Database className="w-3.5 h-3.5" />}
          />
          <OpCard
            title="Recompute risk scores"
            description="Re-run the scheduled risk job across every active patient now."
            actionLabel={
              running === "Recompute all risk scores"
                ? "Recomputing…"
                : "Recompute"
            }
            disabled={running !== null}
            onClick={() =>
              withSpinner("Recompute all risk scores", () => recompute({}))
            }
            icon={<RefreshCcw className="w-3.5 h-3.5" />}
          />
          <OpCard
            title="Morning briefing"
            description={
              nurse
                ? `Generate today's morning briefing for ${nurse.name ?? nurse.email}.`
                : "No nurse user found. Seed first to create Sarah Chen."
            }
            actionLabel={
              running === "Generate morning briefing"
                ? "Generating…"
                : "Trigger morning"
            }
            disabled={running !== null || !nurse}
            onClick={() =>
              nurse &&
              withSpinner("Generate morning briefing", () =>
                triggerBriefing({ targetNurseId: nurse._id }),
              )
            }
            icon={<Sunrise className="w-3.5 h-3.5" />}
          />
          <OpCard
            title="End-of-day wrap"
            description={
              nurse
                ? `Generate today's EOD wrap for ${nurse.name ?? nurse.email}.`
                : "No nurse user found. Seed first to create Sarah Chen."
            }
            actionLabel={
              running === "Generate EOD wrap" ? "Generating…" : "Trigger EOD"
            }
            disabled={running !== null || !nurse}
            onClick={() =>
              nurse &&
              withSpinner("Generate EOD wrap", () =>
                triggerEOD({ targetNurseId: nurse._id }),
              )
            }
            icon={<Moon className="w-3.5 h-3.5" />}
          />
        </div>
      </section>

      {/* Activity log */}
      <section className="glass overflow-hidden">
        <SectionHeader
          icon={<Activity className="w-3.5 h-3.5" />}
          title="Activity log"
          right={
            running ? (
              <span className="text-[11px] text-foresight inline-flex items-center gap-1.5">
                <Spinner size={11} /> {running}
              </span>
            ) : (
              <span className="text-[11px] text-brand-400">
                {log.length === 0 ? "idle" : `${log.length} entries`}
              </span>
            )
          }
        />
        <div className="px-5 py-4 space-y-1 font-mono text-[11px] max-h-56 overflow-y-auto">
          {log.length === 0 && (
            <div className="text-brand-400 italic">No activity yet.</div>
          )}
          {log.map((entry, i) => (
            <div
              key={i}
              className={
                entry.kind === "err"
                  ? "text-red-warning"
                  : entry.kind === "ok"
                    ? "text-green-700"
                    : "text-brand-600"
              }
            >
              {entry.text}
            </div>
          ))}
        </div>
      </section>

      {/* Users */}
      <section className="glass overflow-hidden">
        <SectionHeader
          icon={<UsersIcon className="w-3.5 h-3.5" />}
          title="Users"
          right={
            <span className="text-[11px] text-brand-400">
              {users ? `${users.length} total` : "loading…"}
            </span>
          }
        />
        <div className="px-5 py-4">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-brand-500">
              <tr>
                <th className="text-left py-2 font-semibold">Name</th>
                <th className="text-left py-2 font-semibold">Email</th>
                <th className="text-left py-2 font-semibold">Role</th>
                <th className="text-left py-2 font-semibold">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => {
                // me.current returns the seeded overlay row when the auth row
                // is roleless, exposing the true auth-row id as `_authId`.
                // We need the real auth row id here so "you" labels and the
                // merge target line up with what the mutation will see.
                const authId =
                  (me as any)?._authId ?? (me as any)?._id;
                const myEmail = (me as any)?.email;
                const isAuthRow = authId && u._id === authId;
                const sharesEmail =
                  !isAuthRow && myEmail && u.email === myEmail;
                const label = u.name ?? u.email ?? "this user";
                return (
                  <tr key={u._id} className="border-t border-brand-100/70">
                    <td className="py-2 text-brand-950">
                      {u.name ?? "—"}
                      {isAuthRow && (
                        <span className="ml-1.5 text-[10px] text-foresight font-semibold">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-brand-700">{u.email ?? "—"}</td>
                    <td className="py-2">
                      <div className="inline-flex items-center gap-2">
                        {u.role ? (
                          <RoleBadge role={u.role} />
                        ) : (
                          <span className="text-[10px] text-brand-400 italic">
                            (no role)
                          </span>
                        )}
                        <select
                          value={u.role ?? ""}
                          onChange={(e) =>
                            handleSetRole(
                              u._id,
                              e.target.value as "nurse" | "patient",
                              label,
                            )
                          }
                          disabled={running !== null}
                          aria-label={`Change role for ${label}`}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-brand-100 text-brand-700 hover:border-foresight focus:outline-none focus:ring-1 focus:ring-foresight"
                        >
                          <option value="" disabled>
                            change…
                          </option>
                          <option value="nurse">→ Nurse</option>
                          <option value="patient">→ Patient</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2">
                      {u.status ? (
                        <StatusBadge status={u.status} />
                      ) : (
                        <span className="text-[10px] text-brand-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        {sharesEmail && (
                          <button
                            onClick={() => handleMergeFromDonor(u._id, label)}
                            disabled={running !== null}
                            title="Merge this user's role/name into your account, then delete it"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-brand-600 hover:text-foresight hover:bg-foresight/10 transition disabled:opacity-30"
                          >
                            Merge → me
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u._id, label)}
                          disabled={running !== null || isAuthRow}
                          title={
                            isAuthRow
                              ? "You can't delete your own row"
                              : "Delete user"
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-brand-600 hover:text-red-warning hover:bg-red-50 transition disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3 border-b border-brand-100/70 flex items-center justify-between bg-white/40">
      <h2 className="text-xs font-semibold tracking-wider uppercase text-brand-700 inline-flex items-center gap-1.5">
        <span className="text-foresight">{icon}</span>
        {title}
      </h2>
      {right}
    </div>
  );
}

function OpCard({
  title,
  description,
  actionLabel,
  onClick,
  disabled,
  primary,
  icon,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white/60 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-foresight/10 text-foresight">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-brand-950">{title}</h3>
      </div>
      <p className="text-[11px] text-brand-600 leading-relaxed">{description}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`mt-auto text-xs font-medium rounded-full px-4 py-1.5 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
          primary
            ? "bg-foresight hover:bg-foresight-dark text-white"
            : "bg-white text-brand-700 border border-brand-100 hover:bg-brand-50 hover:text-foresight"
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles =
    role === "admin"
      ? "bg-foresight/10 text-foresight"
      : role === "nurse"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-brand-50 text-brand-700";
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles} capitalize`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "active"
      ? "bg-green-50 text-green-700"
      : "bg-brand-50 text-brand-600";
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles} capitalize`}
    >
      {status}
    </span>
  );
}
