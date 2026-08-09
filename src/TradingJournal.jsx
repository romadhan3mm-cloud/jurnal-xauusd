import React, { useState, useEffect, useCallback, useRef } from "react";
// Jurnal Trading XAUUSD — versi dengan sesi trading & perbandingan bulan
import { Plus, Download, Trash2, ChevronDown, ChevronUp, Loader2, MoreVertical, Archive, ArchiveRestore, X, Check, TrendingUp, TrendingDown, Lock, Sun, Moon, LogOut, LineChart as ChartIcon, BookOpen, CalendarClock } from "lucide-react";
import TradingViewChart from "./TradingViewChart.jsx";
import EconomicCalendar from "./EconomicCalendar.jsx";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import * as XLSX from "xlsx";

const FONTS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

.tj-root {
  --bg: #0A0D10;
  --surface: #12161C;
  --surface-raised: #171D25;
  --border: #232A34;
  --text: #ECE9E2;
  --muted: #7C828C;
  --gold: #C6A15B;
  --gold-dim: #8A7240;
  --green: #3FC37E;
  --red: #EF5B50;
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  box-sizing: border-box;
}
.tj-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
.tj-display { font-family: 'Space Grotesk', sans-serif; }
.tj-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
.tj-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
.tj-input {
  background: var(--surface-raised);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 13px;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}
.tj-input:focus { border-color: var(--gold-dim); }
.tj-input::-webkit-outer-spin-button, .tj-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
@media (max-width: 600px) {
  .tj-input, select.tj-input, textarea.tj-input { font-size: 16px; }
}

.tj-root.tj-light {
  --bg: #F6F4EF;
  --surface: #FFFFFF;
  --surface-raised: #EFEBE2;
  --border: #DDD7C9;
  --text: #201C15;
  --muted: #837C6E;
  --gold: #A9793A;
  --gold-dim: #C6A15B;
  --green: #1E8E56;
  --red: #C63B2E;
}
.tj-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.tj-theme-toggle:hover { color: var(--gold); border-color: var(--gold-dim); }
.tj-install-btn { color: var(--gold); border-color: var(--gold-dim); }
.tj-install-btn:hover { background: rgba(169,121,58,0.12); }
.tj-watermark { text-align: left; font-size: 10.5px; color: var(--muted); opacity: 0.6; letter-spacing: 0.04em; display: flex; align-items: center; gap: 4px; margin: 4px 0 0; }
.tj-user-wrap { position: relative; }
.tj-user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; z-index: 30; background: var(--surface-raised); border: 1px solid var(--border); border-radius: 9px; padding: 10px; min-width: 190px; box-shadow: 0 10px 24px rgba(0,0,0,0.35); }
.tj-user-email { font-size: 11.5px; color: var(--text); word-break: break-all; padding: 4px 6px 10px; border-bottom: 1px solid var(--border); margin-bottom: 6px; }
.tj-user-logout-btn { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 6px; background: none; border: none; color: var(--red); font-size: 12.5px; cursor: pointer; text-align: left; border-radius: 6px; }
.tj-user-logout-btn:hover { background: rgba(239,91,80,0.1); }

.flex { display: flex; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 8px; }
.gap-8 { gap: 32px; }
.animate-spin { animation: tj-spin 1s linear infinite; }
@keyframes tj-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const MAX_ROWS = 500;

const SESSIONS = [
  { id: "asia", label: "Asia" },
  { id: "london", label: "London" },
  { id: "newyork", label: "New York" },
];

function fmtMoney(n, opts = {}) {
  const v = Number(n) || 0;
  const sign = opts.forceNeg && v > 0 ? "-" : v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMoneyInputValue(raw, prefix) {
  if (raw === "" || raw === null || raw === undefined) return "";
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  if (cleaned === "") return "";
  return `${prefix}${cleaned}`;
}

function parseMoneyInputValue(text) {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function monthKeyToLabel(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function monthKeyToShortLabel(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
}

function todayMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function computeRows(entries, initialBalance) {
  let bal = initialBalance;
  return entries.map((e) => {
    const start = bal;
    const target = start * 0.03;
    const lossLimit = start * -0.04;
    const end = start + (Number(e.profit) || 0) - (Number(e.loss) || 0) - (Number(e.withdraw) || 0);
    bal = end;
    return { ...e, start, target, lossLimit, end };
  });
}

function computeStats(rows) {
  const totalProfit = rows.reduce((s, r) => s + (Number(r.profit) || 0), 0);
  const totalLoss = rows.reduce((s, r) => s + (Number(r.loss) || 0), 0);
  const winTrades = rows.filter((r) => Number(r.profit) > 0).length;
  const lossTrades = rows.filter((r) => Number(r.loss) > 0).length;
  const winrate = winTrades + lossTrades > 0 ? winTrades / (winTrades + lossTrades) : null;
  const rr = totalLoss > 0 ? Math.abs(totalProfit / totalLoss) : null;
  return { totalProfit, totalLoss, winTrades, lossTrades, winrate, rr };
}

function sessionLabel(id) {
  return SESSIONS.find((s) => s.id === id)?.label || "-";
}

const CAPITAL_LOT_REF = [
  { capital: 100, lot: "0.01", layers: 3 },
  { capital: 200, lot: "0.01", layers: 4 },
  { capital: 300, lot: "0.02", layers: 3 },
  { capital: 500, lot: "0.02", layers: 4 },
  { capital: 1000, lot: "0.03", layers: 4 },
  { capital: 2000, lot: "0.05", layers: 4 },
];

export default function TradingJournalApp({ userEmail, onLogout } = {}) {
  const [months, setMonths] = useState(null); // { [key]: { initialBalance, entries: [] } }
  const [order, setOrder] = useState([]);
  const [activeMonth, setActiveMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCapitalRef, setShowCapitalRef] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [confirmDeleteFor, setConfirmDeleteFor] = useState(null);
  const [newMonthOpen, setNewMonthOpen] = useState(false);
  const [newMonthBalance, setNewMonthBalance] = useState("100");
  const [selectedSession, setSelectedSession] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [activeView, setActiveView] = useState("journal"); // "journal" | "chart"
  const [fundamentalOpen, setFundamentalOpen] = useState(false);
  const [balanceChartType, setBalanceChartType] = useState("line"); // "line" | "bar" | "area"
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const saveTimer = useRef(null);

  // Deteksi apakah app bisa/sudah di-install (PWA)
  useEffect(() => {
    const standaloneMql = window.matchMedia && window.matchMedia("(display-mode: standalone)");
    const checkStandalone = () =>
      (standaloneMql && standaloneMql.matches) || window.navigator.standalone === true;
    setIsInstalled(checkStandalone());

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } catch {}
    setInstallPrompt(null);
  };

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("journal-data");
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          setMonths(parsed.months || {});
          setOrder(parsed.order || []);
          setActiveMonth(parsed.order?.[parsed.order.length - 1] || null);
        } else {
          setMonths({});
          setOrder([]);
        }
      } catch (e) {
        setMonths({});
        setOrder([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load theme preference
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("tj-theme");
        if (result && result.value) setTheme(result.value);
      } catch (e) {
        // no preference saved yet, keep default
      }
    })();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.storage.set("tj-theme", next).catch(() => {});
      return next;
    });
  };

  const persist = useCallback((nextMonths, nextOrder) => {
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(
          "journal-data",
          JSON.stringify({ months: nextMonths, order: nextOrder })
        );
      } catch (e) {
        console.error("Gagal menyimpan:", e);
      } finally {
        setSaving(false);
      }
    }, 300);
  }, []);

  const updateMonths = (updater) => {
    setMonths((prev) => {
      const next = updater(prev);
      persist(next, order);
      return next;
    });
  };

  const createMonth = () => {
    const key = todayMonthKey();
    let finalKey = key;
    let n = 2;
    while (months[finalKey]) {
      finalKey = `${key}-${n}`;
      n++;
    }
    const bal = Number(newMonthBalance) || 0;
    const next = { ...months, [finalKey]: { initialBalance: bal, entries: [], archived: false } };
    const nextOrder = [...order, finalKey];
    setMonths(next);
    setOrder(nextOrder);
    setActiveMonth(finalKey);
    persist(next, nextOrder);
    setNewMonthOpen(false);
    setNewMonthBalance("100");
  };

  const addEntry = () => {
    if (!activeMonth || !selectedSession) return;
    const m = months[activeMonth];
    if (m.entries.length >= MAX_ROWS) return;
    const todayKey = fmtDayKey(new Date().toISOString());
    const usedToday = m.entries.filter((e) => fmtDayKey(e.date) === todayKey).map((e) => e.session);
    if (usedToday.includes(selectedSession)) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      session: selectedSession,
      profit: "",
      loss: "",
      withdraw: "",
    };
    updateMonths((prev) => ({
      ...prev,
      [activeMonth]: { ...m, entries: [...m.entries, entry] },
    }));
    setSelectedSession(null);
  };

  const updateEntry = (id, field, value) => {
    if (!activeMonth) return;
    const m = months[activeMonth];
    updateMonths((prev) => ({
      ...prev,
      [activeMonth]: {
        ...m,
        entries: m.entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
      },
    }));
  };

  const deleteEntry = (id) => {
    if (!activeMonth) return;
    const m = months[activeMonth];
    updateMonths((prev) => ({
      ...prev,
      [activeMonth]: { ...m, entries: m.entries.filter((e) => e.id !== id) },
    }));
  };

  const archiveMonth = (key) => {
    const next = { ...months, [key]: { ...months[key], archived: true } };
    setMonths(next);
    persist(next, order);
    setMenuOpenFor(null);
    if (activeMonth === key) {
      const stillActive = order.filter((k) => k !== key && !next[k]?.archived);
      setActiveMonth(stillActive.length ? stillActive[stillActive.length - 1] : null);
    }
  };

  const restoreMonth = (key) => {
    const next = { ...months, [key]: { ...months[key], archived: false } };
    setMonths(next);
    persist(next, order);
    setActiveMonth(key);
  };

  const deleteMonthPermanent = (key) => {
    const next = { ...months };
    delete next[key];
    const nextOrder = order.filter((k) => k !== key);
    setMonths(next);
    setOrder(nextOrder);
    persist(next, nextOrder);
    setMenuOpenFor(null);
    setConfirmDeleteFor(null);
    if (activeMonth === key) {
      const stillActive = nextOrder.filter((k) => !next[k]?.archived);
      setActiveMonth(stillActive.length ? stillActive[stillActive.length - 1] : null);
    }
  };

  const exportToExcel = async () => {
    if (!activeMonth || !months[activeMonth]) return;
    const m = months[activeMonth];
    const rows = computeRows(m.entries, m.initialBalance);
    const stats = computeStats(rows);

    const header = [
      "No", "Tanggal", "Sesi", "Start Balance ($)", "Target 3% ($)", "Loss -4% ($)",
      "Profit ($)", "Loss -($)", "Withdraw ($)", "End Balance ($)",
    ];
    const data = rows.map((r, i) => [
      i + 1,
      fmtDate(r.date),
      sessionLabel(r.session),
      Number(r.start.toFixed(2)),
      Number(r.target.toFixed(2)),
      Number(r.lossLimit.toFixed(2)),
      Number(r.profit) || 0,
      -(Number(r.loss) || 0),
      Number(r.withdraw) || 0,
      Number(r.end.toFixed(2)),
    ]);

    const statsBlock = [
      ["Statistics", ""],
      ["Total Profit", Number(stats.totalProfit.toFixed(2))],
      ["Total Loss", -Number(stats.totalLoss.toFixed(2))],
      ["Win Trades", stats.winTrades],
      ["Loss Trades", stats.lossTrades],
      ["Winrate", stats.winrate === null ? "N/A" : `${(stats.winrate * 100).toFixed(1)}%`],
      ["RR", stats.rr === null ? "N/A" : stats.rr.toFixed(2)],
      ["End Balance", Number((rows.length ? rows[rows.length - 1].end : m.initialBalance).toFixed(2))],
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    XLSX.utils.sheet_add_aoa(ws, statsBlock, { origin: "L1" });
    ws["!cols"] = header.map(() => ({ wch: 16 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthKeyToLabel(activeMonth).slice(0, 31));

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
    const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
    const opened = window.open(dataUri, "_blank");
    if (!opened) {
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = dataUri;
      a.download = `Jurnal_Trading_${activeMonth}_${dateStr}.xlsx`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (loading) {
    return (
      <div className={`tj-root ${theme === "light" ? "tj-light" : ""} flex items-center justify-center`} style={{ minHeight: "400px" }}>
        <style>{FONTS_CSS}</style>
        <Loader2 className="animate-spin" size={22} color="#C6A15B" />
      </div>
    );
  }

  const m = activeMonth ? months[activeMonth] : null;
  const rows = m ? computeRows(m.entries, m.initialBalance) : [];
  const stats = m ? computeStats(rows) : null;
  const endBalance = rows.length ? rows[rows.length - 1].end : m ? m.initialBalance : 0;

  const todayKey = fmtDayKey(new Date().toISOString());
  const usedSessionsToday = m
    ? m.entries.filter((e) => fmtDayKey(e.date) === todayKey).map((e) => e.session)
    : [];
  const sessionsExhausted = usedSessionsToday.length >= SESSIONS.length;

  // Cross-month comparison data (chronological by key)
  const compareData = [...order]
    .sort((a, b) => a.localeCompare(b))
    .map((key) => {
      const mm = months[key];
      if (!mm) return null;
      const mRows = computeRows(mm.entries, mm.initialBalance);
      const mStats = computeStats(mRows);
      const end = mRows.length ? mRows[mRows.length - 1].end : mm.initialBalance;
      const growth = mm.initialBalance !== 0 ? ((end - mm.initialBalance) / mm.initialBalance) * 100 : 0;
      return {
        key,
        label: monthKeyToShortLabel(key),
        fullLabel: monthKeyToLabel(key),
        start: mm.initialBalance,
        end,
        growth,
        profit: mStats.totalProfit,
        loss: mStats.totalLoss,
        winrate: mStats.winrate,
        archived: !!mm.archived,
      };
    })
    .filter(Boolean);

  const chartColors = theme === "light"
    ? { grid: "#DDD7C9", tick: "#837C6E", tooltipBg: "#FFFFFF", tooltipBorder: "#DDD7C9", tooltipLabel: "#837C6E", dotFill: "#F6F4EF", refLine: "#837C6E" }
    : { grid: "#232A34", tick: "#7C828C", tooltipBg: "#171D25", tooltipBorder: "#232A34", tooltipLabel: "#7C828C", dotFill: "#0A0D10", refLine: "#7C828C" };

  return (
    <div className={`tj-root ${theme === "light" ? "tj-light" : ""}`}>
      <style>{FONTS_CSS}</style>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 28px 60px" }}>
        {/* Header */}
        <div className="flex items-start justify-between" style={{ marginBottom: 18 }}>
          <div>
            <h1 className="tj-display" style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
              Jurnal Trading <span style={{ color: "var(--gold)" }}>XAUUSD</span>
            </h1>
            <div className="tj-watermark">
              <span style={{ fontSize: 12 }}>©</span> adunfx
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saving && <span style={{ fontSize: 10, color: "var(--muted)" }}>Menyimpan…</span>}
            {installPrompt && !isInstalled && (
              <button
                className="tj-theme-toggle tj-install-btn"
                onClick={handleInstallClick}
                title="Unduh / install aplikasi"
                aria-label="Unduh aplikasi"
              >
                <Download size={15} />
              </button>
            )}
            <button
              className="tj-theme-toggle"
              onClick={toggleTheme}
              title={theme === "dark" ? "Tukar ke tema terang" : "Tukar ke tema gelap"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {onLogout && (
              <div className="tj-user-wrap">
                <button
                  className="tj-theme-toggle"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  title="Akun"
                  aria-label="Akun"
                >
                  <LogOut size={15} />
                </button>
                {userMenuOpen && (
                  <>
                    <div onClick={() => setUserMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
                    <div className="tj-user-dropdown">
                      {userEmail && <div className="tj-user-email tj-mono">{userEmail}</div>}
                      <button className="tj-user-logout-btn" onClick={onLogout}>
                        <LogOut size={13} /> Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View tabs: Jurnal / Chart */}
        <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
          <button
            onClick={() => setActiveView("journal")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              border: `1px solid ${activeView === "journal" ? "var(--gold-dim)" : "var(--border)"}`,
              background: activeView === "journal" ? "rgba(198,161,91,0.1)" : "var(--surface)",
              color: activeView === "journal" ? "var(--gold)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            <BookOpen size={14} /> Jurnal
          </button>
          <button
            onClick={() => setActiveView("chart")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              border: `1px solid ${activeView === "chart" ? "var(--gold-dim)" : "var(--border)"}`,
              background: activeView === "chart" ? "rgba(198,161,91,0.1)" : "var(--surface)",
              color: activeView === "chart" ? "var(--gold)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            <ChartIcon size={14} /> Chart
          </button>
        </div>

        {activeView === "chart" && (
          <>
            <TradingViewChart theme={theme} />
            <button
              onClick={() => setFundamentalOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                marginTop: 14,
                padding: "9px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--muted)",
                cursor: "pointer",
              }}
            >
              <CalendarClock size={14} />
              Fundamental &amp; News
              <ChevronDown
                size={15}
                style={{
                  transition: "transform 0.2s",
                  transform: fundamentalOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            {fundamentalOpen && (
              <div style={{ marginTop: 10 }}>
                <EconomicCalendar theme={theme} />
              </div>
            )}
          </>
        )}

        {activeView === "journal" && (
        <>
        {/* Month tabs */}
        <div className="flex items-center gap-2 tj-scrollbar" style={{ overflowX: "auto", paddingBottom: 8, marginBottom: 6 }}>
          {order.filter((key) => !months[key]?.archived).map((key) => (
            <div key={key} style={{ position: "relative", display: "flex", alignItems: "stretch" }}>
              <button
                onClick={() => setActiveMonth(key)}
                className="tj-mono"
                style={{
                  whiteSpace: "nowrap",
                  padding: "6px 8px 6px 12px",
                  borderRadius: "7px 0 0 7px",
                  fontSize: 12,
                  lineHeight: 1.2,
                  border: `1px solid ${activeMonth === key ? "var(--gold-dim)" : "var(--border)"}`,
                  borderRight: "none",
                  background: activeMonth === key ? "rgba(198,161,91,0.1)" : "var(--surface)",
                  color: activeMonth === key ? "var(--gold)" : "var(--muted)",
                  cursor: "pointer",
                }}
              >
                {monthKeyToLabel(key)}
              </button>
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPos({ top: rect.bottom + 6, left: rect.left });
                  setMenuOpenFor(menuOpenFor === key ? null : key);
                  setConfirmDeleteFor(null);
                }}
                style={{
                  padding: "6px 8px",
                  borderRadius: "0 7px 7px 0",
                  border: `1px solid ${activeMonth === key ? "var(--gold-dim)" : "var(--border)"}`,
                  background: activeMonth === key ? "rgba(198,161,91,0.1)" : "var(--surface)",
                  color: "var(--muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MoreVertical size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setNewMonthOpen((v) => !v)}
            style={{
              whiteSpace: "nowrap",
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12,
              border: "1px dashed var(--border)",
              background: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Plus size={12} /> Bulan Baru
          </button>
        </div>

        {menuOpenFor && menuPos && (
          <>
            <div
              onClick={() => { setMenuOpenFor(null); setConfirmDeleteFor(null); }}
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
            />
            <div
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                zIndex: 41,
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                minWidth: 180,
                boxShadow: "0 10px 24px rgba(0,0,0,0.5)",
              }}
            >
              {confirmDeleteFor === menuOpenFor ? (
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 11.5, color: "var(--text)", marginBottom: 8 }}>Hapus permanen? Data tidak bisa dikembalikan.</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => deleteMonthPermanent(menuOpenFor)} style={{ flex: 1, background: "var(--red)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 0", fontSize: 11.5, cursor: "pointer" }}>Ya, Hapus</button>
                    <button onClick={() => setConfirmDeleteFor(null)} style={{ flex: 1, background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 0", fontSize: 11.5, cursor: "pointer" }}>Batal</button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => archiveMonth(menuOpenFor)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none", border: "none", color: "var(--text)", fontSize: 12.5, cursor: "pointer", textAlign: "left" }}
                  >
                    <Archive size={13} /> Arsipkan
                  </button>
                  <button
                    onClick={() => setConfirmDeleteFor(menuOpenFor)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none", border: "none", color: "var(--red)", fontSize: 12.5, cursor: "pointer", textAlign: "left", borderTop: "1px solid var(--border)" }}
                  >
                    <Trash2 size={13} /> Hapus Permanen
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {order.some((key) => months[key]?.archived) && (
          <button
            onClick={() => setShowArchive((v) => !v)}
            style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0 }}
          >
            <Archive size={11} /> Arsip ({order.filter((k) => months[k]?.archived).length}) {showArchive ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}

        {showArchive && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
            {Object.entries(
              order
                .filter((key) => months[key]?.archived)
                .reduce((groups, key) => {
                  const year = key.split("-")[0];
                  (groups[year] = groups[year] || []).push(key);
                  return groups;
                }, {})
            )
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([year, keys], gi, garr) => (
                <div key={year} style={{ borderBottom: gi < garr.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ padding: "8px 14px", background: "var(--surface)", fontSize: 10.5, color: "var(--gold)", letterSpacing: "0.05em", fontWeight: 600 }}>
                    {year} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({keys.length} bulan)</span>
                  </div>
                  {keys
                    .sort((a, b) => a.localeCompare(b))
                    .map((key, i, arr) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
                        <span className="tj-mono" style={{ fontSize: 12.5, color: "var(--muted)" }}>{monthKeyToLabel(key)}</span>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => restoreMonth(key)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--gold)", fontSize: 11.5, cursor: "pointer" }}>
                            <ArchiveRestore size={12} /> Aktifkan
                          </button>
                          <button onClick={() => setConfirmDeleteFor(confirmDeleteFor === key ? null : key)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--red)", fontSize: 11.5, cursor: "pointer" }}>
                            <Trash2 size={12} /> Hapus
                          </button>
                        </div>
                        {confirmDeleteFor === key && (
                          <div style={{ position: "absolute", marginTop: 30, background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, zIndex: 10 }}>
                            <div style={{ fontSize: 11.5, marginBottom: 8 }}>Hapus permanen?</div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => deleteMonthPermanent(key)} style={{ background: "var(--red)", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>Ya</button>
                              <button onClick={() => setConfirmDeleteFor(null)} style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>Batal</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
          </div>
        )}

        {newMonthOpen && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Start Balance ($)</span>
            <input
              type="number"
              className="tj-input tj-mono"
              style={{ width: 100 }}
              value={newMonthBalance}
              onChange={(e) => setNewMonthBalance(e.target.value)}
            />
            <button
              onClick={createMonth}
              style={{ background: "var(--gold)", color: "#0A0D10", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer" }}
            >
              Buat Bulan Ini
            </button>
          </div>
        )}

        {/* Cross-month comparison */}
        {compareData.length > 1 && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
            <button
              onClick={() => setShowCompare((v) => !v)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface)", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={13} color="var(--gold)" /> Perbandingan Antar Bulan
              </span>
              {showCompare ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showCompare && (
              <div style={{ padding: "12px 10px 4px" }}>
                <div style={{ fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 8px 10px" }}>
                  Growth % per Bulan
                </div>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={compareData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={chartColors.grid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                    <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                    <ReferenceLine y={0} stroke={chartColors.refLine} strokeOpacity={0.6} />
                    <Tooltip
                      contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: chartColors.tooltipLabel, fontSize: 10.5 }}
                      formatter={(v) => [`${Number(v).toFixed(2)}%`, "Growth"]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullLabel || label}
                    />
                    <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                      {compareData.map((d) => (
                        <Cell key={d.key} fill={d.growth >= 0 ? "#3FC37E" : "#EF5B50"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="tj-scrollbar" style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                    <thead>
                      <tr>
                        {["Bulan", "Start", "End Balance", "Growth", "Profit", "Loss", "Winrate"].map((h) => (
                          <th key={h} style={{ padding: "7px 10px", fontSize: 10, color: "var(--muted)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.03em", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {compareData.map((d) => (
                        <tr key={d.key} style={{ opacity: d.key === activeMonth ? 1 : d.archived ? 0.55 : 0.85 }}>
                          <td className="tj-mono" style={{ padding: "7px 10px", fontSize: 12, borderBottom: "1px solid var(--border)", color: d.key === activeMonth ? "var(--gold)" : "var(--text)" }}>
                            {d.fullLabel}
                          </td>
                          <td className="tj-mono" style={{ padding: "7px 10px", fontSize: 12, borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{fmtMoney(d.start)}</td>
                          <td className="tj-mono" style={{ padding: "7px 10px", fontSize: 12, borderBottom: "1px solid var(--border)" }}>{fmtMoney(d.end)}</td>
                          <td className="tj-mono" style={{ padding: "7px 10px", fontSize: 12, borderBottom: "1px solid var(--border)", color: d.growth >= 0 ? "var(--green)" : "var(--red)", display: "flex", alignItems: "center", gap: 4 }}>
                            {d.growth >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {d.growth.toFixed(2)}%
                          </td>
                          <td className="tj-mono" style={{ padding: "7px 10px", fontSize: 12, borderBottom: "1px solid var(--border)", color: "var(--green)" }}>{fmtMoney(d.profit)}</td>
                          <td className="tj-mono" style={{ padding: "7px 10px", fontSize: 12, borderBottom: "1px solid var(--border)", color: "var(--red)" }}>{d.loss > 0 ? `-${fmtMoney(d.loss).slice(1)}` : fmtMoney(0)}</td>
                          <td className="tj-mono" style={{ padding: "7px 10px", fontSize: 12, borderBottom: "1px solid var(--border)" }}>{d.winrate === null ? "—" : `${(d.winrate * 100).toFixed(0)}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!m && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--muted)", fontSize: 13, border: "1px dashed var(--border)", borderRadius: 12 }}>
            Belum ada jurnal bulan. Klik "+ Bulan Baru" untuk mulai.
          </div>
        )}

        {m && (
          <>
            {/* End balance hero */}
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>End Balance</div>
              <div className="tj-mono" style={{ fontSize: 34, fontWeight: 600, color: "var(--gold)", background: "linear-gradient(90deg, var(--gold), #E8CE94)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {fmtMoney(endBalance)}
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", marginBottom: 8 }}>
              Statistik
            </div>
            <div className="tj-scrollbar" style={{ display: "flex", gap: 0, overflowX: "auto", marginBottom: 20, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
              {[
                ["Total Profit", fmtMoney(stats.totalProfit), "var(--green)"],
                ["Total Loss", stats.totalLoss > 0 ? `-${fmtMoney(stats.totalLoss).slice(1)}` : fmtMoney(0), "var(--red)"],
                ["Win", stats.winTrades, "var(--text)"],
                ["Loss", stats.lossTrades, "var(--text)"],
                ["Winrate", stats.winrate === null ? "—" : `${(stats.winrate * 100).toFixed(0)}%`, "var(--text)"],
                ["RR", stats.rr === null ? "—" : `${stats.rr.toFixed(2)}x`, "var(--text)"],
              ].map(([label, val, color], i) => (
                <div key={label} style={{ flex: "1 0 90px", padding: "10px 12px", borderRight: i < 5 ? "1px solid var(--border)" : "none", textAlign: "center" }}>
                  <div style={{ fontSize: 9.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3, textAlign: "center" }}>{label}</div>
                  <div className="tj-mono" style={{ fontSize: 14, fontWeight: 600, color, textAlign: "center" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Balance growth chart */}
            {rows.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)", padding: "14px 10px 6px", marginBottom: 20 }}>
                <div className="flex items-center justify-between" style={{ padding: "0 8px 10px" }}>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Pertumbuhan Saldo
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      ["line", "Garis"],
                      ["bar", "Batang"],
                      ["area", "Area"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setBalanceChartType(key)}
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 10.5,
                          fontWeight: 600,
                          border: `1px solid ${balanceChartType === key ? "var(--gold-dim)" : "var(--border)"}`,
                          background: balanceChartType === key ? "rgba(198,161,91,0.1)" : "transparent",
                          color: balanceChartType === key ? "var(--gold)" : "var(--muted)",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  {balanceChartType === "bar" ? (
                    <BarChart
                      data={[
                        { label: "Start", balance: m.initialBalance },
                        ...rows.map((r, i) => ({ label: `#${i + 1}`, balance: r.end, date: fmtDate(r.date) })),
                      ]}
                      margin={{ top: 6, right: 14, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke={chartColors.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                      <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                      <ReferenceLine y={m.initialBalance} stroke={chartColors.refLine} strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Tooltip
                        contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: chartColors.tooltipLabel, fontSize: 10.5 }}
                        itemStyle={{ color: "#C6A15B" }}
                        formatter={(v) => [`$${Number(v).toFixed(2)}`, "Balance"]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                      />
                      <Bar dataKey="balance" fill="#C6A15B" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  ) : balanceChartType === "area" ? (
                    <AreaChart
                      data={[
                        { label: "Start", balance: m.initialBalance },
                        ...rows.map((r, i) => ({ label: `#${i + 1}`, balance: r.end, date: fmtDate(r.date) })),
                      ]}
                      margin={{ top: 6, right: 14, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="balanceAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C6A15B" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#C6A15B" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={chartColors.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                      <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                      <ReferenceLine y={m.initialBalance} stroke={chartColors.refLine} strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Tooltip
                        contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: chartColors.tooltipLabel, fontSize: 10.5 }}
                        itemStyle={{ color: "#C6A15B" }}
                        formatter={(v) => [`$${Number(v).toFixed(2)}`, "Balance"]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#C6A15B" strokeWidth={2} fill="url(#balanceAreaFill)" dot={{ r: 3, fill: chartColors.dotFill, stroke: "#C6A15B", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  ) : (
                    <LineChart
                      data={[
                        { label: "Start", balance: m.initialBalance },
                        ...rows.map((r, i) => ({ label: `#${i + 1}`, balance: r.end, date: fmtDate(r.date) })),
                      ]}
                      margin={{ top: 6, right: 14, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke={chartColors.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                      <YAxis tick={{ fill: chartColors.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                      <ReferenceLine y={m.initialBalance} stroke={chartColors.refLine} strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Tooltip
                        contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: chartColors.tooltipLabel, fontSize: 10.5 }}
                        itemStyle={{ color: "#C6A15B" }}
                        formatter={(v) => [`$${Number(v).toFixed(2)}`, "Balance"]}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                      />
                      <Line type="monotone" dataKey="balance" stroke="#C6A15B" strokeWidth={2} dot={{ r: 3, fill: chartColors.dotFill, stroke: "#C6A15B", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            {/* Entries table */}
            <div className="tj-scrollbar" style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <thead>
                  <tr style={{ background: "var(--surface)" }}>
                    {["No", "Tanggal", "Sesi", "Start", "Target 3%", "Loss -4%", "Profit ($)", "Loss ($)", "WD ($)", "End Balance", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", fontSize: 10.5, color: "var(--muted)", textAlign: "center", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <td className="tj-mono" style={{ padding: "8px 10px", fontSize: 12, color: "var(--muted)", textAlign: "center" }}>{i + 1}</td>
                      <td className="tj-mono" style={{ padding: "8px 10px", fontSize: 12, whiteSpace: "nowrap", textAlign: "center" }}>{fmtDate(r.date)}</td>
                      <td style={{ padding: "8px 10px", fontSize: 11, whiteSpace: "nowrap", textAlign: "center" }}>
                        <span style={{ display: "inline-block", width: 72, background: "rgba(198,161,91,0.12)", color: "var(--gold)", padding: "3px 0", borderRadius: 5, fontSize: 10.5, textAlign: "center" }}>
                          {sessionLabel(r.session)}
                        </span>
                      </td>
                      <td className="tj-mono" style={{ padding: "8px 10px", fontSize: 12, color: "var(--muted)", textAlign: "center" }}>{fmtMoney(r.start)}</td>
                      <td className="tj-mono" style={{ padding: "8px 10px", fontSize: 12, color: "var(--green)", opacity: 0.85, textAlign: "center" }}>{fmtMoney(r.target)}</td>
                      <td className="tj-mono" style={{ padding: "8px 10px", fontSize: 12, color: "var(--red)", opacity: 0.85, textAlign: "center" }}>{fmtMoney(r.lossLimit)}</td>
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="tj-input tj-mono"
                          placeholder="0"
                          value={formatMoneyInputValue(r.profit, "$")}
                          onChange={(e) => updateEntry(r.id, "profit", parseMoneyInputValue(e.target.value))}
                          style={{ color: "var(--green)", width: 72, textAlign: "center" }}
                        />
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="tj-input tj-mono"
                          placeholder="0"
                          value={formatMoneyInputValue(r.loss, "-$")}
                          onChange={(e) => updateEntry(r.id, "loss", parseMoneyInputValue(e.target.value))}
                          style={{ color: "var(--red)", width: 72, textAlign: "center" }}
                        />
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="tj-input tj-mono"
                          placeholder="0"
                          value={formatMoneyInputValue(r.withdraw, "$")}
                          onChange={(e) => updateEntry(r.id, "withdraw", parseMoneyInputValue(e.target.value))}
                          style={{ width: 72, textAlign: "center" }}
                        />
                      </td>
                      <td className="tj-mono" style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600, textAlign: "center" }}>{fmtMoney(r.end)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <button onClick={() => deleteEntry(r.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "inline-flex" }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ padding: "24px 10px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
                        Belum ada entry. Tambahkan trade pertama.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Session picker + add entry */}
            <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: 10, padding: 12, background: "var(--surface)" }}>
              <div style={{ fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                Sesi Hari Ini {sessionsExhausted && <span style={{ color: "var(--red)" }}>· jatah 3x sudah habis</span>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SESSIONS.map((s) => {
                  const used = usedSessionsToday.includes(s.id);
                  const active = selectedSession === s.id;
                  return (
                    <button
                      key={s.id}
                      disabled={used}
                      onClick={() => setSelectedSession(active ? null : s.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        flex: "1 1 0",
                        minWidth: 110,
                        padding: "7px 12px",
                        borderRadius: 7,
                        fontSize: 12.5,
                        textAlign: "center",
                        cursor: used ? "not-allowed" : "pointer",
                        border: `1px solid ${active ? "var(--gold)" : used ? "var(--border)" : "var(--border)"}`,
                        background: active ? "rgba(198,161,91,0.14)" : used ? "var(--surface-raised)" : "transparent",
                        color: used ? "var(--muted)" : active ? "var(--gold)" : "var(--text)",
                        opacity: used ? 0.55 : 1,
                      }}
                    >
                      {used ? <Lock size={12} /> : active ? <Check size={12} /> : <span style={{ width: 12, height: 12, borderRadius: 3, border: "1px solid var(--muted)", display: "inline-block" }} />}
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-8" style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={addEntry}
                  disabled={!selectedSession}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: selectedSession ? "var(--gold)" : "var(--surface-raised)",
                    border: `1px solid ${selectedSession ? "var(--gold)" : "var(--border)"}`,
                    color: selectedSession ? "#0A0D10" : "var(--muted)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "8px 14px",
                    borderRadius: 8,
                    cursor: selectedSession ? "pointer" : "not-allowed",
                  }}
                >
                  <Plus size={14} /> Tambah Entry
                </button>
                <button
                  onClick={exportToExcel}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--gold-dim)", color: "var(--gold)", fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}
                >
                  <Download size={14} /> Export Excel
                </button>
              </div>
            </div>

            {/* Capital lot reference */}
            <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <button
                onClick={() => setShowCapitalRef((v) => !v)}
                style={{ width: "100%", position: "relative", display: "flex", justifyContent: "center", alignItems: "center", padding: "10px 14px", background: "var(--surface)", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}
              >
                <span>Capital Lot Reference</span>
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "inline-flex" }}>
                  {showCapitalRef ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              {showCapitalRef && (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Capital ($)", "Lot Size", "Max Layers"].map((h) => (
                        <th key={h} style={{ padding: "7px 12px", fontSize: 10.5, color: "var(--muted)", textAlign: "center", borderTop: "1px solid var(--border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CAPITAL_LOT_REF.map((row) => (
                      <tr key={row.capital} className="tj-mono">
                        <td style={{ padding: "7px 12px", fontSize: 12, borderTop: "1px solid var(--border)", textAlign: "center" }}>${row.capital}</td>
                        <td style={{ padding: "7px 12px", fontSize: 12, borderTop: "1px solid var(--border)", textAlign: "center" }}>{row.lot}</td>
                        <td style={{ padding: "7px 12px", fontSize: 12, borderTop: "1px solid var(--border)", textAlign: "center" }}>{row.layers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
}
