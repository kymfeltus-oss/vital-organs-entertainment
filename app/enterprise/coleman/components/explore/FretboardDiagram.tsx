type FretboardDiagramProps = {
  markers: Array<number | "o" | "x">;
  fingerDots: Array<{ string: number; fret: number }>;
  className?: string;
};

export default function FretboardDiagram({ markers, fingerDots, className = "" }: FretboardDiagramProps) {
  const stringCount = 6;
  const fretCount = 4;
  const width = 58;
  const height = 78;
  const padX = 10;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      width={width}
      height={height}
    >
      {[0, 1, 2, 3, 4].map((fret) => (
        <line
          key={`f${fret}`}
          x1={padX}
          y1={padY + (innerH / fretCount) * fret}
          x2={width - padX}
          y2={padY + (innerH / fretCount) * fret}
          stroke="var(--exo-muted)"
          strokeWidth={fret === 0 ? 1.5 : 0.75}
          opacity={0.72}
        />
      ))}

      {Array.from({ length: stringCount }).map((_, stringIndex) => {
        const x = padX + (innerW / (stringCount - 1)) * stringIndex;
        return (
          <line
            key={`s${stringIndex}`}
            x1={x}
            y1={padY}
            x2={x}
            y2={height - padY}
            stroke="var(--exo-muted)"
            strokeWidth={0.75}
            opacity={0.62}
          />
        );
      })}

      {markers.map((marker, stringIndex) => {
        const x = padX + (innerW / (stringCount - 1)) * stringIndex;
        const y = padY - 4;
        if (marker === "x") {
          return (
            <text key={`m${stringIndex}`} x={x} y={y} textAnchor="middle" fontSize="8" fill="var(--exo-cream)">
              ×
            </text>
          );
        }
        if (marker === "o") {
          return (
            <circle key={`m${stringIndex}`} cx={x} cy={y - 1} r={2.6} fill="none" stroke="var(--exo-cream)" strokeWidth="1" />
          );
        }
        return null;
      })}

      {fingerDots.map((dot, index) => {
        const x = padX + (innerW / (stringCount - 1)) * dot.string;
        const y = padY + (innerH / fretCount) * (dot.fret - 0.5);
        return <circle key={`d${index}`} cx={x} cy={y} r={5} fill="var(--exo-cream)" />;
      })}
    </svg>
  );
}
