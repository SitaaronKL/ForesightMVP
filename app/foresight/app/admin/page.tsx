"use client";

import { Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { LoginScreen } from "../../components/LoginScreen";
import { Sidebar } from "../../components/Sidebar";
import { useMe } from "../../components/useMe";
import { useState } from "react";

export default function AdminPage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center text-brand-700">
          <div className="glass px-8 py-6">Loading…</div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <LoginScreen />
      </Unauthenticated>
      <Authenticated>
        <Admin />
      </Authenticated>
    </>
  );
}

function Admin() {
  const me = useMe();
  const users = useQuery(api.queries.admin.listUsers, {});
  const nurse = users?.find((u) => u.role === "nurse");

  const seedAction = useAction(api.seed.seed);
  const recompute = useMutation(api.scheduled.risk.recomputeAll);
  const triggerBriefing = useAction(api.admin.triggerMorningBriefing);
  const triggerEOD = useAction(api.admin.triggerEndOfDay);

  const [running, setRunning] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const push = (msg: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${msg}`, ...l]);

  async function withSpinner(label: string, fn: () => Promise<any>) {
    setRunning(label);
    push(`Starting: ${label}`);
    try {
      const result = await fn();
      push(`✓ ${label}: ${JSON.stringify(result)?.slice(0, 200) ?? "ok"}`);
    } catch (err: any) {
      push(`✗ ${label}: ${err?.message ?? "error"}`);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={me} />
      <main className="min-h-screen pl-[13.5rem] pr-6 py-6 space-y-5">
        <div className="max-w-5xl mx-auto space-y-5">
        <h1 className="text-2xl font-semibold text-brand-900">Admin console</h1>

        <section className="glass p-5">
          <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wide mb-4">
            Seed data
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={running !== null}
              onClick={() =>
                withSpinner("Seed 50 patients (fresh)", () => seedAction({ reset: true }))
              }
              className="px-4 py-2 rounded-lg bg-brand-900 text-white text-sm hover:bg-brand-800 disabled:opacity-50"
            >
              Seed 50 patients (wipe + reseed)
            </button>
            <button
              disabled={running !== null}
              onClick={() =>
                withSpinner("Recompute all risk scores", () => recompute({}))
              }
              className="px-4 py-2 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm disabled:opacity-50"
            >
              Recompute all risk scores
            </button>
            {nurse && (
              <>
                <button
                  disabled={running !== null}
                  onClick={() =>
                    withSpinner("Generate morning briefing", () =>
                      triggerBriefing({ targetNurseId: nurse._id }),
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-700 text-white text-sm disabled:opacity-50"
                >
                  Trigger morning briefing
                </button>
                <button
                  disabled={running !== null}
                  onClick={() =>
                    withSpinner("Generate EOD wrap", () =>
                      triggerEOD({ targetNurseId: nurse._id }),
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm disabled:opacity-50"
                >
                  Trigger end-of-day wrap
                </button>
              </>
            )}
          </div>
          {running && (
            <div className="mt-3 text-xs text-brand-600 italic">
              Running: {running}…
            </div>
          )}
        </section>

        <section className="glass p-5">
          <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wide mb-3">
            Activity log
          </h2>
          <div className="space-y-1 font-mono text-xs text-brand-700 max-h-64 overflow-y-auto">
            {log.length === 0 && (
              <div className="text-brand-400 italic">No activity yet.</div>
            )}
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </section>

        <section className="glass p-5">
          <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wide mb-3">
            Users
          </h2>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-brand-500">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u._id} className="border-t border-brand-50">
                  <td className="py-1.5">{u.name ?? "—"}</td>
                  <td className="py-1.5 text-brand-700">{u.email ?? "—"}</td>
                  <td className="py-1.5">{u.role ?? "(no role)"}</td>
                  <td className="py-1.5">{u.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        </div>
      </main>
    </div>
  );
}
