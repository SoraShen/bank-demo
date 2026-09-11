export function Logo({ light = false }: { light?: boolean }) {
  const word = light ? "#fff" : "#0b4f8a";
  return (
    <svg className="sb-logo" width="160" height="40" viewBox="0 0 160 40" aria-label="Bank">
      <text x="8" y="28" fill={word} fontFamily="Arial, Helvetica, sans-serif" fontSize="22" fontWeight="700">
        Bank
      </text>
    </svg>
  );
}
