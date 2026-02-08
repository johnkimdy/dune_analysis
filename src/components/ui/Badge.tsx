interface BadgeProps {
  variant: "inflow" | "outflow" | "neutral";
  children: React.ReactNode;
}

const colors = {
  inflow: "bg-green-500/10 text-green-400 border-green-500/20",
  outflow: "bg-red-500/10 text-red-400 border-red-500/20",
  neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[variant]}`}
    >
      {children}
    </span>
  );
}
