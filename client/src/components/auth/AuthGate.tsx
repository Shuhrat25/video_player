import { useState } from "react";
import LoginPage from "./LoginPage";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("admin_token"));

  if (!authed) {
    return <LoginPage onLoggedIn={() => setAuthed(true)} />;
  }

  return <>{children}</>;
}

export function logout() {
  localStorage.removeItem("admin_token");
  window.location.href = "/";
}
