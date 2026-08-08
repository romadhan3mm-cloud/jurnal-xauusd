import React, { useEffect, useRef, useId } from "react";

// Widget chart TradingView asli (gratis, resmi) — lengkap dengan indikator
// dan tools gambar bawaan TradingView. Simbol default XAUUSD, timeframe M15.
export default function TradingViewChart({ theme = "dark" }) {
  const containerRef = useRef(null);
  const widgetId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const scriptExisting = document.getElementById("tv-widget-script");

    const createWidget = () => {
      if (!window.TradingView || !containerRef.current) return;
      // eslint-disable-next-line no-new
      new window.TradingView.widget({
        autosize: true,
        symbol: "OANDA:XAUUSD",
        interval: "15",
        timezone: "Etc/UTC",
        theme: theme === "light" ? "light" : "dark",
        style: "1",
        locale: "id",
        toolbar_bg: theme === "light" ? "#F6F4EF" : "#12161C",
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        withdateranges: true,
        container_id: `tv-chart-${widgetId}`,
      });
    };

    if (window.TradingView) {
      createWidget();
    } else if (scriptExisting) {
      scriptExisting.addEventListener("load", createWidget, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = "tv-widget-script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.addEventListener("load", createWidget, { once: true });
      document.body.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, widgetId]);

  return (
    <div
      style={{
        width: "100%",
        height: "72vh",
        minHeight: 420,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <div id={`tv-chart-${widgetId}`} ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
