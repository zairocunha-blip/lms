"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function CompletionsChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE1E6" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={{ stroke: "#DDE1E6" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "#F5F6F8" }}
          contentStyle={{ border: "1px solid #DDE1E6", borderRadius: 6, fontSize: 13 }}
          labelStyle={{ color: "#12141A", fontWeight: 500 }}
        />
        <Bar dataKey="total" name="Concluídos" fill="#24399B" radius={[3, 3, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
