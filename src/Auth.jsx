import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { AUTH_CSS } from "./authStyles.js";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [loginMethod, setLoginMethod] = useState("password"); // "password" | "magiclink"
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
      } else if (mode === "login" && loginMethod === "magiclink") {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        setInfo("Link masuk sudah dikirim ke email kamu. Buka email itu di perangkat ini untuk langsung masuk.");
      } else if (mode === "login") {
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

  const title = mode === "forgot" ? "Lupa Password" : "Jurnal Trading";
  const subtitle =
    mode === "forgot"
      ? "Masukkan email akun kamu, kami kirim link reset password."
      : mode === "login"
      ? loginMethod === "magiclink"
        ? "Masuk tanpa password lewat link email"
        : "Masuk ke akun kamu"
      : "Buat akun baru";

  return (
    <div className="auth-root">
      <style>{AUTH_CSS}</style>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column" }}>
        <div className="auth-watermark">
          <span style={{ fontSize: 13 }}>©</span> adunfx
        </div>
        <div className="auth-card">
          {mode === "forgot" && (
            <button type="button" className="auth-back" onClick={() => switchMode("login")}>
              <ArrowLeft size={13} /> Kembali ke login
            </button>
          )}

          <h1 className="auth-title">
            {mode === "forgot" ? (
              title
            ) : (
              <>
                Jurnal Trading <span style={{ color: "#C6A15B" }}>XAUUSD</span>
              </>
            )}
          </h1>
          <p className="auth-sub">{subtitle}</p>

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

            {mode !== "forgot" && !(mode === "login" && loginMethod === "magiclink") && (
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

            {mode === "login" && loginMethod === "password" && (
              <div className="auth-link-row">
                <button type="button" onClick={() => switchMode("forgot")}>
                  Lupa password?
                </button>
              </div>
            )}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={14} className="auth-spin" />
              ) : mode === "login" && loginMethod === "magiclink" ? (
                <Mail size={14} />
              ) : null}
              {mode === "forgot"
                ? "Kirim Link Reset"
                : mode === "login"
                ? loginMethod === "magiclink"
                  ? "Kirim Link Masuk"
                  : "Masuk"
                : "Daftar"}
            </button>
          </form>

          {mode === "login" && (
            <div className="auth-method-toggle">
              {loginMethod === "password" ? "Tidak mau pakai password?" : "Mau pakai password?"}
              <button
                type="button"
                onClick={() => {
                  setLoginMethod((m) => (m === "password" ? "magiclink" : "password"));
                  resetMessages();
                }}
              >
                {loginMethod === "password" ? "Pakai magic link" : "Pakai password"}
              </button>
            </div>
          )}

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
