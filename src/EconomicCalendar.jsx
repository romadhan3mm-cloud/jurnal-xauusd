import React from "react";

// Widget kalender ekonomi resmi dari investing.com (gratis, real-time,
// tampilan tabel Actual/Forecast/Previous mirip Forex Factory).
export default function EconomicCalendar() {
  const src =
    "https://sslecal2.investing.com?" +
    "columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous" +
    "&features=datepicker,timezone" +
    "&countries=110,17,29,25,32,6,37,36,26,5,22,39,14,48,10,35,7,43,38,4,12,72" +
    "&calType=week";

  return (
    <div
      style={{
        width: "100%",
        height: "78vh",
        minHeight: 480,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <iframe
        title="Kalender Ekonomi"
        src={src}
        style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
        frameBorder="0"
      />
      <div style={{ padding: "6px 10px", fontSize: 10.5, color: "#888", textAlign: "right", background: "#FFFFFF" }}>
        Kalender Ekonomi disediakan oleh{" "}
        <a href="https://www.investing.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#06529D", fontWeight: 600 }}>
          Investing.com
        </a>
      </div>
    </div>
  );
}

