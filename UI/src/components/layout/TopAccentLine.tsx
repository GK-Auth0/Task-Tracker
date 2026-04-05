type TopAccentLineProps = {
  className?: string;
};

export default function TopAccentLine({ className = "" }: TopAccentLineProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 ${className}`.trim()}
    />
  );
}
