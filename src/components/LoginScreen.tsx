"use client";

import { useState } from "react";

interface LoginScreenProps {
  onLogin: (secret: string, name: string) => Promise<string | false>;
  hasLocalData: boolean;
  onMigrate?: (userUid: string) => Promise<void>;
}

export default function LoginScreen({ onLogin, hasLocalData, onMigrate }: LoginScreenProps) {
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [migrating, setMigrating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSecret = secret.trim();
    const trimmedName = name.trim();
    if (!trimmedSecret || !trimmedName) return;
    setLoading(true);
    setError("");
    const userUid = await onLogin(trimmedSecret, trimmedName);
    setLoading(false);
    if (!userUid) {
      setError("Не удалось войти. Проверьте настройки подключения.");
    }
  };

  const handleMigrate = async () => {
    const trimmedSecret = secret.trim();
    const trimmedName = name.trim();
    if (!trimmedSecret || !trimmedName || !onMigrate) return;
    setMigrating(true);
    setError("");
    const userUid = await onLogin(trimmedSecret, trimmedName);
    if (!userUid) {
      setMigrating(false);
      setError("Не удалось войти. Проверьте настройки подключения.");
      return;
    }
    try {
      await onMigrate(userUid);
    } catch {
      setError("Не удалось перенести данные.");
    }
    setMigrating(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#202833] p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3a4653] bg-[#242f3a] text-3xl shadow-xl shadow-black/30">
              🌿
            </div>
            <h1 className="text-lg font-black uppercase tracking-[0.2em] text-[#edf5f8]">
              Habbit Garden
            </h1>
            <p className="text-xs font-semibold text-[#657486]">
              Выполняй привычки • выращивай сад
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
            <div>
              <label
                htmlFor="secret-input"
                className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.12em] text-[#8795a4]"
              >
                Секретный ключ
              </label>
              <input
                id="secret-input"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="придумайте секретный ключ"
                autoComplete="off"
                autoFocus
                className="w-full rounded-lg border border-[#3a4653] bg-[#1b222c] px-4 py-3 text-sm font-semibold text-[#edf5f8] placeholder:text-[#4d5a68] focus:border-[#5e8a6a] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="name-input"
                className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.12em] text-[#8795a4]"
              >
                Имя
              </label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="как вас зовут?"
                autoComplete="off"
                className="w-full rounded-lg border border-[#3a4653] bg-[#1b222c] px-4 py-3 text-sm font-semibold text-[#edf5f8] placeholder:text-[#4d5a68] focus:border-[#5e8a6a] focus:outline-none transition-colors"
              />
              <p className="mt-1.5 text-[10px] font-semibold text-[#4d5a68]">
                Секретный ключ и имя — ваш вход. Вводите их на любом устройстве, чтобы загрузить свой сад.
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-[#543a3a] bg-[#3a2a2a]/50 px-3 py-2 text-xs font-semibold text-[#ff8d8d]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!secret.trim() || !name.trim() || loading}
              className={`rounded-lg px-4 py-3 text-sm font-black uppercase tracking-[0.1em] transition-all ${
                secret.trim() && name.trim() && !loading
                  ? "bg-[#4d9e6d] text-[#edf5f8] hover:bg-[#5ab87d] active:scale-[0.98]"
                  : "cursor-not-allowed bg-[#2d3a47] text-[#5c6b7a]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#edf5f8]/30 border-t-[#edf5f8]" />
                  Входим...
                </span>
              ) : (
                "Войти"
              )}
            </button>

            {hasLocalData && onMigrate && (
              <button
                type="button"
                onClick={handleMigrate}
                disabled={!secret.trim() || !name.trim() || migrating}
                className={`rounded-lg border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                  secret.trim() && name.trim() && !migrating
                    ? "border-[#4d9e6d] bg-[#2a3a33]/50 text-[#6ecf8a] hover:bg-[#2d3a47]"
                    : "cursor-not-allowed border-[#3a4653] bg-[#242f3a]/50 text-[#5c6b7a]"
                }`}
              >
                {migrating ? "Перенос..." : "Перенести локальные данные"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
