// Sci-fi "targeting frame" corner brackets around content.
export function CornerFrame({ children, className = "", color = "lavender", hover = false }) {
  const c = {
    lavender: "border-lavender/40",
    violet: "border-violet/50",
    coral: "border-coral/60",
  }[color] || "border-lavender/40";
  const corner = `absolute w-4 h-4 border-${color === "lavender" ? "lavender" : color}/50`;
  return (
    <div className={`relative ${className}`}>
      <span className={`pointer-events-none absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 ${c} rounded-tl-md transition-colors ${hover ? "group-hover:border-coral" : ""}`} />
      <span className={`pointer-events-none absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 ${c} rounded-tr-md transition-colors ${hover ? "group-hover:border-coral" : ""}`} />
      <span className={`pointer-events-none absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 ${c} rounded-bl-md transition-colors ${hover ? "group-hover:border-coral" : ""}`} />
      <span className={`pointer-events-none absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 ${c} rounded-br-md transition-colors ${hover ? "group-hover:border-coral" : ""}`} />
      {children}
    </div>
  );
}
