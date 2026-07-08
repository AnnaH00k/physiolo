type SteampunkGaugeProps = {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
};

export function SteampunkGauge({
  value,
  max = 100,
  label,
  sublabel,
  size = "md",
}: SteampunkGaugeProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percentage = max === 0 ? 0 : (clamped / max) * 100;
  const angle = (percentage / 100) * 180 - 90;

  const dimensions = {
    sm: { width: 120, height: 70, r: 48, stroke: 6 },
    md: { width: 180, height: 100, r: 72, stroke: 8 },
    lg: { width: 240, height: 130, r: 96, stroke: 10 },
  }[size];

  const cx = dimensions.width / 2;
  const cy = dimensions.height - 8;
  const needleX = cx + dimensions.r * 0.75 * Math.cos((angle * Math.PI) / 180);
  const needleY = cy + dimensions.r * 0.75 * Math.sin((angle * Math.PI) / 180);

  const arcPath = `M ${cx - dimensions.r} ${cy} A ${dimensions.r} ${dimensions.r} 0 0 1 ${cx + dimensions.r} ${cy}`;
  const circumference = Math.PI * dimensions.r;
  const gaugeId = `gaugeBrass-${size}`;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="drop-shadow-md"
      >
        <path
          d={arcPath}
          fill="none"
          stroke="#3d2914"
          strokeWidth={dimensions.stroke + 4}
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gaugeId})`}
          strokeWidth={dimensions.stroke}
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
        />
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#c9a227"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill="#8b6914" stroke="#c9a227" strokeWidth={2} />
        <defs>
          <linearGradient id={gaugeId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b6914" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#c9a227" />
          </linearGradient>
        </defs>
      </svg>

      <p className="font-display text-xs uppercase tracking-[0.15em] text-brass-300">
        {label}
      </p>

      {sublabel && (
        <p className="font-mono text-lg font-semibold text-brass-100">{sublabel}</p>
      )}
    </div>
  );
}