import { formatUSD } from "@/lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

export function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg p-3 shadow-xl">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p
          key={idx}
          className="text-sm font-medium"
          style={{ color: entry.color }}
        >
          {entry.name}: {formatUSD(entry.value)}
        </p>
      ))}
    </div>
  );
}
