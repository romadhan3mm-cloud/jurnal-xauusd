import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import { setStorageUser } from "./storageShim.js";
import Auth from "./Auth.jsx";
import TradingJournalApp from "./TradingJournal.jsx";

export default function App() {
  // undefined = masih cek sesi, null = belum login, object = sudah login
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setStorageUser(data.session?.user?.id || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStorageUser(nextSession?.user?.id || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0D10",
          color: "#7C828C",
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
        }}
      >
        Memuat…
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <TradingJournalApp
      userEmail={session.user.email}
      onLogout={() => supabase.auth.signOut()}
    />
  );
}
