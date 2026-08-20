import { useState } from "react";
import { api } from "../../api/client";

export default function AdminLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await api.login(email, password);
      localStorage.setItem("admin_token", token);
      onLoggedIn();
    } catch (err: any) {
      setError(err.message || "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          padding: 28,
          borderRadius: 16,
          border: "1px solid var(--line)",
          background: "var(--panel-solid)",
        }}
      >
        <h2 style={{ fontFamily: "var(--display-font)", fontSize: 26, marginBottom: 20 }}>
          Вход в админку
        </h2>
        <label style={{ display: "block", fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <label style={{ display: "block", fontSize: 12, color: "var(--text-dim)", margin: "14px 0 4px" }}>
          Пароль
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 12 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            background: "var(--accent)",
            color: "#14171e",
            fontWeight: 700,
          }}
        >
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "#00000066",
  color: "var(--text)",
};
