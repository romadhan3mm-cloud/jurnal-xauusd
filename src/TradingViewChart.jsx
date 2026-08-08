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

      const isLight = theme === "light";
      const gridColor = "rgba(0,0,0,0)"; // grid disembunyikan (transparan)

      // eslint-disable-next-line no-new
      new window.TradingView.widget({
        autosize: true,
        symbol: "OANDA:XAUUSD",
        interval: "15",
        timezone: "Etc/UTC",
        theme: isLight ? "light" : "dark",
        style: "1",
        locale: "id",
        toolbar_bg: isLight ? "#F6F4EF" : "#12161C",
        enable_publishing: false,
        allow_symbol_change: true,

        // === Toolbar & fitur lengkap, disamakan dengan tradingview.com ===
        hide_top_toolbar: false,
        hide_legend: false,
        hide_side_toolbar: false, // toolbar tools gambar di kiri
        hide_volume: false,
        withdateranges: true,
        details: true,
        hotlist: true,
        calendar: true,
        watchlist: [],
        studies: ["Volume@tv-basicstudies"],
        show_popup_button: true,
        popup_width: "1000",
        popup_height: "650",
        save_image: true,
        support_host: "https://www.tradingview.com",

        // === Warna candle & garis grid (disembunyikan) ===
        overrides: {
          // candle naik = hijau, candle turun = merah (standar TradingView)
          "mainSeriesProperties.candleStyle.upColor": "#26A69A",
          "mainSeriesProperties.candleStyle.downColor": "#EF5350",
          "mainSeriesProperties.candleStyle.borderUpColor": "#26A69A",
          "mainSeriesProperties.candleStyle.borderDownColor": "#EF5350",
          "mainSeriesProperties.candleStyle.wickUpColor": "#26A69A",
          "mainSeriesProperties.candleStyle.wickDownColor": "#EF5350",
          "mainSeriesProperties.candleStyle.drawWick": true,
          "mainSeriesProperties.candleStyle.drawBorder": true,
          "mainSeriesProperties.candleStyle.barColorsOnPrevClose": false,

          // hilangkan garis grid horizontal & vertikal
          "paneProperties.vertGridProperties.color": gridColor,
          "paneProperties.horzGridProperties.color": gridColor,
          "paneProperties.background": isLight ? "#FFFFFF" : "#12161C",
          "paneProperties.backgroundType": "solid",
          "paneProperties.topMargin": 10,
          "paneProperties.bottomMargin": 8,

          // crosshair
          "paneProperties.crossHairProperties.color": isLight ? "#837C6E" : "#7C828C",
          "paneProperties.crossHairProperties.style": 2,

          // sumbu harga & waktu mengikuti tema
          "scalesProperties.textColor": isLight ? "#837C6E" : "#7C828C",
          "scalesProperties.lineColor": isLight ? "#DDD7C9" : "#232A34",
          "scalesProperties.fontSize": 11,
          "scalesProperties.showSeriesLastValue": true,

          // volume panel
          "volumePaneSize": "medium",
        },

        studies_overrides: {
          "volume.volume.color.0": "#EF5350",
          "volume.volume.color.1": "#26A69A",
          "volume.volume.transparency": 60,
        },

        disabled_features: [
          "header_saveload", // simpan layout butuh akun TradingView, disembunyikan
          "use_localstorage_for_settings",
        ],
        enabled_features: [
          "study_templates",
          "side_toolbar_in_fullscreen_mode",
          "header_in_fullscreen_mode",
          "left_toolbar",
          "control_bar",
          "timeframes_toolbar",
          "edit_buttons_in_legend",
          "context_menus",
          "border_around_the_chart",
          "header_symbol_search",
          "symbol_search_hot_key",
          "header_resolutions",
          "header_chart_type",
          "header_settings",
          "header_indicators",
          "header_compare",
          "header_undo_redo",
          "header_screenshot",
          "header_fullscreen_button",
          "volume_force_overlay",
          "create_volume_indicator_by_default",
        ],

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
