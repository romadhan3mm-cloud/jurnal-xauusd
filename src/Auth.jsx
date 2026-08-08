import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";
import { Loader2, Eye, EyeOff } from "lucide-react";

const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap');
.auth-root { font-family: 'Inter', sans-serif; background: #0A0D10; color: #ECE9E2; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
.auth-card { width: 100%; max-width: 360px; background: #12161C; border: 1px solid #232A34; border-radius: 14px; padding: 28px 24px; box-sizing: border-box; }
.auth-title { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; margin: 0 0 4px; }
.auth-sub { font-size: 12px; color: #7C828C; margin: 0 0 20px; }
.auth-input { width: 100%; background: #171D25; border: 1px solid #232A34; color: #ECE9E2; border-radius: 8px; padding: 10px 12px; font-size: 13px; outline: none; margin-bottom: 10px; box-sizing: border-box; }
.auth-input:focus { border-color: #8A7240; }
.auth-pass-wrap { position: relative; margin-bottom: 10px; }
.auth-pass-wrap .auth-input { margin-bottom: 0; padding-right: 38px; }
.auth-pass-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #7C828C; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; }
.auth-pass-toggle:hover { color: #C6A15B; }
.auth-btn { width: 100%; background: #C6A15B; color: #0A0D10; font-weight: 600; font-size: 13px; padding: 10px 0; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-switch { text-align: center; font-size: 12px; color: #7C828C; margin-top: 14px; }
.auth-switch button { background: none; border: none; color: #C6A15B; cursor: pointer; font-size: 12px; padding: 0; margin-left: 4px; }
.auth-watermark { text-align: center; margin-bottom: 18px; font-size: 11px; color: #4A5158; letter-spacing: 0.04em; display: flex; align-items: center; justify-content: center; gap: 5px; }
.auth-error { background: rgba(239,91,80,0.1); border: 1px solid rgba(239,91,80,0.3); color: #EF5B50; font-size: 12px; padding: 8px 10px; border-radius: 6px; margin-bottom: 12px; }
.auth-info { background: rgba(63,195,126,0.1); border: 1px solid rgba(63,195,126,0.3); color: #3FC37E; font-size: 12px; padding: 8px 10px; border-radius: 6px; margin-bottom: 12px; }
.auth-spin { animation: auth-spin-kf 1s linear infinite; }
@keyframes auth-spin-kf { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const switchMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setInfo("Akun berhasil dibuat. Jika konfirmasi email diaktifkan, cek inbox kamu dulu sebelum login.");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{AUTH_CSS}</style>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column" }}>
        <div className="auth-watermark">
          <span style={{ fontSize: 13 }}>©</span> adunfx
        </div>
        <div className="auth-card">
        <h1 className="auth-title">
          Jurnal Trading <span style={{ color: "#C6A15B" }}>XAUUSD</span>
        </h1>
        <p className="auth-sub">{mode === "login" ? "Masuk ke akun kamu" : "Buat akun baru"}</p>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

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
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading && <Loader2 size={14} className="auth-spin" />}
            {mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}
          <button type="button" onClick={switchMode}>
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
