"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "due" | "completed" | "missed" | "needs-date";
type PromiseItem = {
  id: string;
  title: string;
  category: "Errand" | "Preparation" | "Important date" | "Promise";
  dueText: string;
  relevantPerson: string;
  preparation: string;
  confidence: "High" | "Medium" | "Low";
  status: Status;
};
type Reward = { title: string; value: number };
type RewardDraft = { title: string; value: string };
type Theme = "dark" | "light";
type Notice = {
  message: string;
  tone: "success" | "warning" | "neutral";
  undo?: { id: string; status: Status };
};

const DEFAULT_REWARD: Reward = { title: "Spa day", value: 300 };
const starterPromises: PromiseItem[] = [
  { id: "dog-food", title: "Buy dog food before coming home", category: "Errand", dueText: "Missed · Tue, 14 Jul", relevantPerson: "The Wife", preparation: "Pick up the usual brand on the way home.", confidence: "High", status: "missed" },
  { id: "dinner", title: "Book anniversary dinner", category: "Important date", dueText: "Missed · Wed, 15 Jul", relevantPerson: "The Wife", preparation: "Choose a restaurant and reserve a table.", confidence: "High", status: "missed" },
  { id: "groceries", title: "Pick up groceries for the weekend", category: "Errand", dueText: "Completed · Today", relevantPerson: "The Wife", preparation: "Milk, fruit, and coffee.", confidence: "High", status: "completed" },
];

function getStoredPromises() {
  if (typeof window === "undefined") return starterPromises;
  const saved = window.localStorage.getItem("do-already-promises");
  if (!saved) return starterPromises;
  try {
    return JSON.parse(saved) as PromiseItem[];
  } catch {
    return starterPromises;
  }
}

function getStoredReward(): Reward {
  if (typeof window === "undefined") return DEFAULT_REWARD;
  const saved = window.localStorage.getItem("do-already-reward");
  if (!saved) return DEFAULT_REWARD;
  try {
    const parsed = JSON.parse(saved) as Partial<Reward>;
    if (typeof parsed.title !== "string" || !parsed.title.trim() || !Number.isFinite(parsed.value) || parsed.value! < 1) {
      return DEFAULT_REWARD;
    }
    return { title: parsed.title.trim(), value: Math.max(10, Math.round(parsed.value! / 10) * 10) };
  } catch {
    return DEFAULT_REWARD;
  }
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("do-already-theme-v2");
  return saved === "light" || saved === "dark" ? saved : "light";
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-SG")}`;
}

function rewardMark(title: string) {
  return title.trim().split(/\s+/)[0]?.slice(0, 4).toUpperCase() || "GIFT";
}

export default function Home() {
  const [promises, setPromises] = useState<PromiseItem[]>(starterPromises);
  const [reward, setReward] = useState<Reward>(DEFAULT_REWARD);
  const [rewardDraft, setRewardDraft] = useState<RewardDraft>({ title: DEFAULT_REWARD.title, value: String(DEFAULT_REWARD.value) });
  const [theme, setTheme] = useState<Theme>("light");
  const [hasLoadedLocalSettings, setHasLoadedLocalSettings] = useState(false);
  const [isEditingReward, setIsEditingReward] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const storedReward = getStoredReward();
    setPromises(getStoredPromises());
    setReward(storedReward);
    setRewardDraft({ title: storedReward.title, value: String(storedReward.value) });
    setTheme(getStoredTheme());
    setHasLoadedLocalSettings(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!hasLoadedLocalSettings) return;
    window.localStorage.setItem("do-already-theme-v2", theme);
  }, [hasLoadedLocalSettings, theme]);

  useEffect(() => {
    if (!hasLoadedLocalSettings) return;
    window.localStorage.setItem("do-already-promises", JSON.stringify(promises));
  }, [hasLoadedLocalSettings, promises]);

  useEffect(() => {
    if (!hasLoadedLocalSettings) return;
    window.localStorage.setItem("do-already-reward", JSON.stringify(reward));
  }, [hasLoadedLocalSettings, reward]);

  useEffect(() => {
    const loadTelegramPromises = async () => {
      try {
        const response = await fetch("/api/promises", { cache: "no-store" });
        const payload = await response.json() as { promises?: PromiseItem[] };
        if (!payload.promises?.length) return;
        setPromises((current) => {
          const byId = new Map(current.map((item) => [item.id, item]));
          payload.promises.forEach((item) => byId.set(item.id, item));
          return [...byId.values()];
        });
      } catch { /* Telegram storage is optional for the dashboard. */ }
    };
    void loadTelegramPromises();
    const timer = window.setInterval(loadTelegramPromises, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const missedTotal = useMemo(
    () => promises.filter((item) => item.status === "missed").length * 100,
    [promises],
  );
  const rewardUnlocked = missedTotal >= reward.value;
  const activePromises = promises.filter((item) => item.status === "due" || item.status === "needs-date");
  const meterProgress = Math.min((missedTotal / reward.value) * 100, 100);
  const waitingLabel = activePromises.length === 1 ? "1 task waiting" : `${activePromises.length} tasks waiting`;

  function persistStatus(id: string, status: Status) {
    void fetch(`/api/promises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => setNotice({ message: "Saved on this device. We’ll try Telegram again shortly.", tone: "warning" }));
  }

  function updateStatus(id: string, status: Status) {
    const previous = promises.find((item) => item.id === id)?.status;
    if (!previous) return;
    setPromises((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    persistStatus(id, status);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
    setNotice({
      message: status === "completed" ? "Done already. Nice one." : "Aiya. $100 added to the meter.",
      tone: status === "completed" ? "success" : "warning",
      undo: { id, status: previous },
    });
  }

  function undoLastUpdate() {
    if (!notice?.undo) return;
    setPromises((current) => current.map((item) => (item.id === notice.undo?.id ? { ...item, status: notice.undo.status } : item)));
    persistStatus(notice.undo.id, notice.undo.status);
    setNotice({ message: "Back on your list.", tone: "neutral" });
  }

  function startRewardEdit() {
    setRewardDraft({ title: reward.title, value: String(reward.value) });
    setIsEditingReward(true);
  }

  function cancelRewardEdit() {
    setRewardDraft({ title: reward.title, value: String(reward.value) });
    setIsEditingReward(false);
  }

  function saveReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = rewardDraft.title.trim();
    const value = Math.round(Number(rewardDraft.value));
    if (!title || !Number.isFinite(value) || value < 10 || value % 10 !== 0) {
      setNotice({ message: "Use a reward name and a value in $10 steps.", tone: "warning" });
      return;
    }
    setReward({ title, value });
    setRewardDraft({ title, value: String(value) });
    setIsEditingReward(false);
    setNotice({ message: `${title} is now the reward at ${formatCurrency(value)}.`, tone: "success" });
  }

  async function resetDemo() {
    setIsResetting(true);
    try {
      const response = await fetch("/api/promises/reset", { method: "POST" });
      if (!response.ok) throw new Error("Reset failed");
      setPromises(starterPromises);
      setNotice({ message: "Demo reset to its original state.", tone: "neutral" });
    } catch {
      setNotice({ message: "Couldn’t reset the saved Telegram tasks. Please try again.", tone: "warning" });
    } finally {
      setIsResetting(false);
    }
  }

  async function copyReward() {
    try {
      await navigator.clipboard.writeText(`I’ve reached our playful penalty-meter limit. I owe you the ${formatCurrency(reward.value)} ${reward.title} we agreed on. Pick what you’d love and I’ll make it happen.`);
      setNotice({ message: "Reward note copied.", tone: "success" });
    } catch {
      setNotice({ message: "Couldn’t copy the reward note. Please try again.", tone: "warning" });
    }
  }

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="Do Already dashboard">
        <header className="topbar">
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="theme-icon" aria-hidden="true" />
            </button>
            <button className="reset-button" onClick={resetDemo} disabled={isResetting}>{isResetting ? "Resetting…" : "Reset demo"}</button>
          </div>
          <div className="header-copy">
            <h1 className="wordmark"><span>You </span><strong>Do Already</strong><span> or not?</span></h1>
            <p className="waiting-label">{waitingLabel}</p>
            <p className="header-subtitle">Live from your chat with The Wife</p>
          </div>
        </header>

        <section className="promises-section" aria-labelledby="promises-heading">
          <div className="section-heading">
            <div><h2 id="promises-heading">{activePromises.length ? "Don’t forget ah" : "You’re all caught up"}</h2></div>
            <span className="count-pill" aria-label={`${activePromises.length} active tasks`}>{activePromises.length}</span>
          </div>
          {activePromises.length ? activePromises.map((item) => <PromiseCard key={item.id} item={item} onStatus={updateStatus} />) : <p className="empty-state">You’re all clear for now. New tasks arrive from Telegram.</p>}
        </section>

        <section className="hero-card" aria-label={`Penalty meter: ${formatCurrency(missedTotal)} of ${formatCurrency(reward.value)}`}>
          <div className="hero-copy">
            <p className="eyebrow inverse-eyebrow">PENALTY METER</p>
            <p className="meter-value">{formatCurrency(missedTotal)}</p>
            <p className="meter-caption">of {formatCurrency(reward.value)} toward The Wife’s {reward.title}</p>
          </div>
          <button className="reward-edit-button" onClick={startRewardEdit} aria-expanded={isEditingReward} aria-controls="reward-settings">Edit reward</button>
          <div className="meter-track" aria-hidden="true"><span style={{ width: `${meterProgress}%` }} /></div>
          <p className="playful-note">Every miss brings the reward closer.</p>
        </section>

        {isEditingReward && (
          <form className="reward-editor" id="reward-settings" onSubmit={saveReward}>
            <div className="reward-editor-heading"><div><p className="eyebrow">SET THE REWARD</p><h2>What does The Wife want?</h2></div><button type="button" className="editor-close" onClick={cancelRewardEdit} aria-label="Close reward editor">×</button></div>
            <label>Reward<input value={rewardDraft.title} onChange={(event) => setRewardDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Spa day, staycation…" /></label>
            <label>Value (SGD)<input type="number" min="10" step="10" inputMode="numeric" value={rewardDraft.value} onChange={(event) => setRewardDraft((draft) => ({ ...draft, value: event.target.value }))} /></label>
            <div className="reward-editor-actions"><button type="button" className="editor-cancel" onClick={cancelRewardEdit}>Cancel</button><button className="editor-save" type="submit">Save reward</button></div>
          </form>
        )}

        {rewardUnlocked && (
          <section className="reward-card" aria-label={`${reward.title} unlocked`}>
            <div className="reward-stamp small" aria-hidden="true"><span>{rewardMark(reward.title)}</span></div>
            <div><p className="eyebrow">REWARD UNLOCKED</p><h2>{reward.title} unlocked</h2><p>The {formatCurrency(reward.value)} reward is ready for The Wife.</p></div>
            <button className="copy-button" onClick={copyReward}>Copy reward note</button>
          </section>
        )}

        <section className="history-section" aria-labelledby="history-heading">
          <div className="section-heading"><div><h2 id="history-heading">Recent tasks</h2></div></div>
          {promises.filter((item) => item.status === "completed" || item.status === "missed").map((item) => <HistoryCard key={item.id} item={item} />)}
        </section>
      </section>

      {notice && <aside className={`notice ${notice.tone}`} role="status"><p>{notice.message}</p>{notice.undo && <button onClick={undoLastUpdate}>Undo</button>}</aside>}
    </main>
  );
}

function PromiseCard({ item, onStatus }: { item: PromiseItem; onStatus: (id: string, status: Status) => void }) {
  const relevantPerson = item.relevantPerson === "Maya" ? "The Wife" : item.relevantPerson;
  const hasPreparation = Boolean(item.preparation.trim());
  return (
    <article className="promise-card">
      <span className="promise-marker" aria-hidden="true" />
      <div className="promise-content">
        <div className="promise-title-row"><h3>{item.title}</h3><span>{item.category}</span></div>
        <p className="promise-meta"><span>{item.dueText}</span><span>For {relevantPerson}</span></p>
        {hasPreparation && <p className="prep">{item.preparation}</p>}
        <div className="status-actions"><button className="complete-action" onClick={() => onStatus(item.id, "completed")} aria-label={`Mark ${item.title} as done`}>Do already</button><button className="missed-action" onClick={() => onStatus(item.id, "missed")} aria-label={`Mark ${item.title} as forgotten`}>Aiya I forgot</button></div>
      </div>
    </article>
  );
}

function HistoryCard({ item }: { item: PromiseItem }) {
  const missed = item.status === "missed";
  return <article className="history-card"><span className={`history-status ${missed ? "missed" : "complete"}`}>{missed ? "AIYA" : "DONE"}</span><div><h3>{item.title}</h3><p>{item.dueText}</p></div><strong>{missed ? "+$100" : "Done already"}</strong></article>;
}
