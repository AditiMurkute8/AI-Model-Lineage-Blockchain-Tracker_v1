function CodeSnippetBox({ code }) {
  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "20px",
        overflowX: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: "#e2e8f0",
        fontSize: "14px",
        fontFamily: "Consolas, monospace",
        lineHeight: "1.7",
      }}
    >
      {code || "No code snippet available."}
    </div>
  );
}

export default CodeSnippetBox;