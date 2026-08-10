import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { AUTH_CSS } from "./authStyles.js";

// Sama seperti di TradingJournal.jsx — otomatis ikut package.json (lihat vite.config.js)
const APP_VERSION = __APP_VERSION__;
const APP_CREATED_YEAR = 2026;

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  // Coba tutup aplikasi/tab. Kalau browser tidak mengizinkan (tab dibuka manual,
  // bukan lewat script), browser akan menahannya secara diam-diam — ini wajar
  // dan paling mulus jalan saat app dibuka sebagai PWA (hasil "Tombol Unduh App").
  const handleExitApp = () => {
    window.close();
  };

  const switchMode = (next) => {
    setMode(next);
    resetMessages();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setInfo("Link reset password sudah dikirim ke email kamu. Cek inbox (dan folder spam), lalu klik link-nya.");
      } else if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        setInfo("Akun berhasil dibuat. Jika konfirmasi email diaktifkan, cek inbox kamu dulu sebelum login.");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "forgot" ? "Lupa Password" : "Jurnal Trading";
  const subtitle =
    mode === "forgot"
      ? "Masukkan email akun kamu, kami kirim link reset password."
      : mode === "login"
      ? "Masuk ke akun kamu"
      : "Buat akun baru";

  return (
    <div className="auth-root">
      <style>{AUTH_CSS}</style>
      <button
        type="button"
        className="auth-close-btn"
        onClick={handleExitApp}
        title="Keluar aplikasi"
        aria-label="Keluar aplikasi"
      >
        <X size={18} />
      </button>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column" }}>
        <div className="auth-card">
          {mode === "forgot" && (
            <button type="button" className="auth-back" onClick={() => switchMode("login")}>
              <ArrowLeft size={13} /> Kembali ke login
            </button>
          )}

          {/* Brandmark — 3 candle naik, senada dengan icon aplikasi (icon-512.png) */}
          <svg
            className="auth-brandmark"
            viewBox="0 0 120 76"
            width="72"
            height="46"
            aria-hidden="true"
          >
            <line x1="31" y1="32" x2="31" y2="70" stroke="#8A7240" strokeWidth="3" />
            <rect x="24" y="40" width="14" height="22" rx="3" fill="#8A7240" />
            <line x1="60" y1="16" x2="60" y2="64" stroke="#C6A15B" strokeWidth="3" />
            <rect x="53" y="26" width="14" height="30" rx="3" fill="#C6A15B" />
            <line x1="89" y1="0" x2="89" y2="56" stroke="#3FC37E" strokeWidth="3" />
            <rect x="82" y="8" width="14" height="40" rx="3" fill="#3FC37E" />
          </svg>

          <div className="auth-header">
            <h1 className="auth-title">
              {mode === "forgot" ? (
                title
              ) : (
                <>
                  Jurnal Trading <span style={{ color: "#C6A15B" }}>XAUUSD</span>
                </>
              )}
            </h1>
            <div className="auth-watermark">
              <span style={{ fontSize: 13 }}>©</span> {APP_CREATED_YEAR} adunfx
              <span style={{ opacity: 0.5, margin: "0 2px" }}>·</span>
              v{APP_VERSION}
            </div>
            <p className="auth-sub">{subtitle}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {info && (
            <div className="auth-info" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            {mode !== "forgot" && (
              <div className="auth-pass-wrap">
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min. 6 karakter)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth-pass-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {mode === "login" && (
              <div className="auth-link-row">
                <button type="button" onClick={() => switchMode("forgot")}>
                  Lupa password?
                </button>
              </div>
            )}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading && <Loader2 size={14} className="auth-spin" />}
              {mode === "forgot" ? "Kirim Link Reset" : mode === "login" ? "Masuk" : "Daftar"}
            </button>
          </form>

          {mode !== "forgot" && (
            <div className="auth-switch">
              {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}
              <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
