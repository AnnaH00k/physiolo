type OrnamentProps = {
  className?: string;
};

export function CornerMark({ className = "" }: OrnamentProps) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      className={className}
      aria-hidden="true"
    >
      <path
        className="alchemy-diagram"
        d="M24 4H10C6.686 4 4 6.686 4 10V24"
      />
      <path
        className="alchemy-diagram"
        d="M18 4C18 8 16 10 12 10"
      />
      <circle cx="24" cy="4" r="1.4" fill="currentColor" className="text-[var(--foreground)] opacity-60" />
      <circle cx="4" cy="24" r="1.4" fill="currentColor" className="text-[var(--foreground)] opacity-60" />
    </svg>
  );
}

export function AnatomicalRosette({ className = "", size = 40 }: OrnamentProps & { size?: number }) {
  const c = size / 2;
  const r = size / 2 - 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <circle cx={c} cy={c} r={r} className="alchemy-diagram" />
      <circle cx={c} cy={c} r={r * 0.62} className="alchemy-diagram" />
      <path className="alchemy-diagram" d={`M ${c} ${4} V ${size - 4}`} />
      <path className="alchemy-diagram" d={`M 4 ${c} H ${size - 4}`} />
      <path className="alchemy-diagram" d={`M ${c - r * 0.8} ${c - r * 0.8} L ${c + r * 0.8} ${c + r * 0.8}`} />
      <path className="alchemy-diagram" d={`M ${c + r * 0.8} ${c - r * 0.8} L ${c - r * 0.8} ${c + r * 0.8}`} />
      <circle cx={c} cy={c} r={2.2} className="alchemy-fill" />
    </svg>
  );
}

export function FolioPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`paper-panel relative rounded-sm ${className}`}>
      <div className="pointer-events-none absolute left-2 top-2">
        <CornerMark />
      </div>
      <div className="pointer-events-none absolute right-2 top-2 rotate-90">
        <CornerMark />
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 -rotate-90">
        <CornerMark />
      </div>
      <div className="pointer-events-none absolute bottom-2 right-2 rotate-180">
        <CornerMark />
      </div>
      {children}
    </div>
  );
}