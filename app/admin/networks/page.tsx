"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TenantThemeRow = {
  tenant_id: string;
  app_name: string | null;
  primary_color: string | null;
  created_at: string;
};

export default function AdminNetworksDashboard() {
  const [tenants, setTenants] = useState<TenantThemeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenants() {
      const { data, error } = await supabase
        .from("tenant_themes")
        .select("tenant_id, app_name, primary_color, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) setTenants(data);
      setLoading(false);
    }

    void fetchTenants();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 p-8 font-sans text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Network Ecosystem</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Global administrative management of multi-tenant white-label layers.
            </p>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm">
            Total Active Deployments:{" "}
            <span className="font-bold text-[#00f2ff]">{tenants.length}</span>
          </div>
        </header>

        {loading ? (
          <div className="text-sm text-neutral-500">Querying database cluster infrastructure...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-neutral-900/20">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-900/60 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="p-4">App/Network Identity</th>
                  <th className="p-4">Subdomain Identifier</th>
                  <th className="p-4">Theme Configuration</th>
                  <th className="p-4">Deployment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-sm">
                {tenants.map((tenant) => (
                  <tr key={tenant.tenant_id} className="transition-colors hover:bg-neutral-900/30">
                    <td className="p-4 font-semibold">{tenant.app_name || "Generic Platform"}</td>
                    <td className="p-4 font-mono text-xs text-neutral-400">
                      {tenant.tenant_id}.yourplatform.com
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border border-neutral-800"
                          style={{ backgroundColor: tenant.primary_color ?? "#00f2ff" }}
                        />
                        <span className="font-mono text-xs uppercase text-neutral-300">
                          {tenant.primary_color ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-full border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        ● Online
                      </span>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-neutral-500">
                      No networks currently provisioned in database rows.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
