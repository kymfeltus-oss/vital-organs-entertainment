type MetricSparklineProps = {
  samples: number[];
  strokeClass?: string;
  label: string;
};

export default function MetricSparkline({
  samples,
  strokeClass = "stroke-brand-blue",
  label,
}: MetricSparklineProps) {
  const width = 120;
  const height = 32;
  const padding = 2;

  if (samples.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-8 w-full opacity-40"
        aria-label={`${label} sparkline unavailable`}
        role="img"
      >
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          className="stroke-brand-border"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min || 1;

  const points = samples
    .map((value, index) => {
      const x =
        padding + (index / Math.max(samples.length - 1, 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-8 w-full"
      aria-label={`${label} sparkline`}
      role="img"
    >
      <polyline
        fill="none"
        className={strokeClass}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
