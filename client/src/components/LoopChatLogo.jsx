// LoopChatLogo — reusable SVG brand component
// size: controls width/height in px (default 36)
// showText: if true, renders the "LoopChat" wordmark beside the icon
function LoopChatLogo({ size = 36, showText = true, textSize = "1.25rem" }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.55rem",
        userSelect: "none",
      }}
    >
      {/* Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        width={size}
        height={size}
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="loopGradLogo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0078d4" />
          </linearGradient>
        </defs>
        <path
          d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4z"
          stroke="url(#loopGradLogo)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark — solid white */}
      {showText && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 700,
            letterSpacing: "-0.4px",
            color: "#ffffff",
            lineHeight: 1,
          }}
        >
          LoopChat
        </span>
      )}
    </div>
  );
}

export default LoopChatLogo;
