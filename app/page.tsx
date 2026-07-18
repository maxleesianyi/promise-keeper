"use client";

import { useEffect, useMemo, useState } from "react";

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
type Notice = {
  message: string;
  tone: "success" | "warning" | "neutral";
  undo?: { id: string; status: Status };
};

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

export default function Home() {
  const [promises, setPromises] = useState<PromiseItem[]>(starterPromises);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => setPromises(getStoredPromises()), []);
  useEffect(() => {
    window.localStorage.setItem("do-already-promises", JSON.stringify(promises));
  }, [promises]);
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
  const rewardUnlocked = missedTotal >= 300;
  const activePromises = promises.filter((item) => item.status === "due" || item.status === "needs-date");
  const meterProgress = Math.min((missedTotal / 300) * 100, 100);
  const waitingLabel = activePromises.length === 1 ? "1 promise waiting" : `${activePromises.length} promises waiting`;

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
      await navigator.clipboard.writeText("I’ve reached our playful promise-meter limit. I owe you the $300 spa voucher we agreed on. Pick a spa you’d love and I’ll make it happen ❤️");
      setNotice({ message: "Voucher note copied.", tone: "success" });
    } catch {
      setNotice({ message: "Couldn’t copy the voucher note. Please try again.", tone: "warning" });
    }
  }

  return (
    <main className="app-shell">
      <section className="phone-frame" aria-label="Do Already dashboard">
        <header className="topbar">
          <div>
            <p className="wordmark">DO ALREADY?</p>
            <h1>{waitingLabel}</h1>
            <p className="header-subtitle">Live from your Telegram approvals</p>
          </div>
          <button className="reset-button" onClick={resetDemo} disabled={isResetting}>{isResetting ? "Resetting…" : "Reset demo"}</button>
        </header>

        <section className="promises-section" aria-labelledby="promises-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">KEEP YOUR WORD</p>
              <h2 id="promises-heading">{activePromises.length ? "Your next moves" : "You’re all caught up"}</h2>
            </div>
            <span className="count-pill" aria-label={`${activePromises.length} active promises`}>{activePromises.length}</span>
          </div>
          {activePromises.length ? activePromises.map((item) => <PromiseCard key={item.id} item={item} onStatus={updateStatus} />) : <p className="empty-state">You’re all clear for now. New promises arrive from Telegram.</p>}
        </section>

        <section className="hero-card" aria-label={`Promise meter: ${missedTotal} of 300 dollars`}>
          <div className="hero-copy">
            <p className="eyebrow inverse-eyebrow">YOUR PROMISE METER</p>
            <p className="meter-value">${missedTotal}</p>
            <p className="meter-caption">of $300 toward The Wife’s spa day</p>
          </div>
          <div className="reward-stamp" aria-hidden="true"><span>SPA</span></div>
          <div className="meter-track" aria-hidden="true"><span style={{ width: `${meterProgress}%` }} /></div>
          <p className="playful-note">Every miss moves the spa day closer.</p>
        </section>

        {rewardUnlocked && (
          <section className="reward-card" aria-label="Spa voucher unlocked">
            <div className="reward-stamp small" aria-hidden="true"><span>SPA</span></div>
            <div>
              <p className="eyebrow">REWARD UNLOCKED</p>
              <h2>Spa day unlocked</h2>
              <p>The $300 voucher is ready for The Wife.</p>
            </div>
            <button className="copy-button" onClick={copyReward}>Copy voucher note</button>
          </section>
        )}

        <section className="history-section" aria-labelledby="history-heading">
          <div className="section-heading"><div><p className="eyebrow">THE STORY SO FAR</p><h2 id="history-heading">Recent promises</h2></div></div>
          {promises.filter((item) => item.status === "completed" || item.status === "missed").map((item) => <HistoryCard key={item.id} item={item} />)}
        </section>
      </section>

      {notice && (
        <aside className={`notice ${notice.tone}`} role="status">
          <p>{notice.message}</p>
          {notice.undo && <button onClick={undoLastUpdate}>Undo</button>}
        </aside>
      )}
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
        <div className="status-actions">
          <button className="complete-action" onClick={() => onStatus(item.id, "completed")} aria-label={`Mark ${item.title} as done`}>Do already</button>
          <button className="missed-action" onClick={() => onStatus(item.id, "missed")} aria-label={`Mark ${item.title} as forgotten`}>Aiya I forgot</button>
        </div>
      </div>
    </article>
  );
}

function HistoryCard({ item }: { item: PromiseItem }) {
  const missed = item.status === "missed";
  return <article className="history-card"><span className={`history-status ${missed ? "missed" : "complete"}`}>{missed ? "AIYA" : "DONE"}</span><div><h3>{item.title}</h3><p>{item.dueText}</p></div><strong>{missed ? "+$100" : "Done already"}</strong></article>;
}
