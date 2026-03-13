"use client";

interface ProbabilityGaugeProps {
  probability: number;
  size?: number;
}

export function ProbabilityGauge({ probability, size = 180 }: ProbabilityGaugeProps) {
  const pct = Math.round(probability * 100);
  const r = 72;
  const circ = 2 * Math.PI * r;
  const offset = circ - probability * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
        <circle
          cx="90" cy="90" r={r} fill="none"
          stroke="var(--c-primary)" strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ animation: "gauge-fill 0.8s ease-out both" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-medium tracking-tight c-primary">{pct}%</span>
        <span className="text-xs tracking-wide mt-1 c-dim">probability</span>
      </div>
    </div>
  );
}
