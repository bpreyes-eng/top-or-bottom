export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
        padding: "24px 18px 100px",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <div
          style={{
            color: "#d4af37",
            fontSize: "13px",
            letterSpacing: "4px",
            fontWeight: "bold",
          }}
        >
          PICK YOUR POSITION
        </div>

        <h1
          style={{
            margin: "8px 0 4px",
            fontSize: "34px",
            letterSpacing: "1px",
          }}
        >
          TOP <span style={{ color: "#d4af37" }}>OR</span> BOTTOM
        </h1>

        <div style={{ color: "#888", fontSize: "14px" }}>
          2026 NFL Season
        </div>
      </header>

      <section
        style={{
          border: "1px solid #333",
          borderRadius: "18px",
          padding: "20px",
          background: "#111",
          maxWidth: "500px",
          margin: "0 auto 16px",
        }}
      >
        <div style={{ color: "#999", fontSize: "12px" }}>CURRENT POT</div>
        <div
          style={{
            color: "#d4af37",
            fontSize: "36px",
            fontWeight: "bold",
            marginTop: "4px",
          }}
        >
          $200
        </div>

        <div style={{ color: "#aaa", marginTop: "4px" }}>
          10 owners • $20 entry
        </div>
      </section>

      <section
        style={{
          border: "1px solid #333",
          borderRadius: "18px",
          padding: "20px",
          background: "#111",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            color: "#d4af37",
            fontWeight: "bold",
            marginBottom: "14px",
          }}
        >
          SCORING
        </div>

        <div style={{ marginBottom: "8px" }}>🏈 NFL win = 1 point</div>
        <div style={{ marginBottom: "8px" }}>🤝 NFL tie = 0.5 point</div>
        <div style={{ marginBottom: "8px" }}>🏆 Highest score = 50% of pot</div>
        <div>🔥 Lowest score = 50% of pot</div>
      </section>
    </main>
  );
}