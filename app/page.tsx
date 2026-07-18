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
  confidence: "High" | "Medium" | "Needs your input";
  status: Status;
};

const starterPromises: PromiseItem[] = [
  {
    id: "dog-food",
    title: "Buy dog food before coming home",
    category: "Errand",
    dueText: "Missed · Tue, 14 Jul",
    relevantPerson: "The Wife",
    preparation: "Pick up the usual brand on the way home.",
    confidence: "High",
    status: "missed",
  },
  {
    id: "dinner",
    title: "Book anniversary dinner",
    category: "Important date",
    dueText: "Missed · Wed, 15 Jul",
    relevantPerson: "The Wife",
    preparation: "Choose a restaurant and reserve a table.",
    confidence: "High",
    status: "missed",
  },
  {
    id: "groceries",
    title: "Pick up groceries for the weekend",
    category: "Errand",
    dueText: "Completed · Today",
    relevantPerson: "The Wife",
    preparation: "Milk, fruit, and coffee.",
    confidence: "High",
    status: "completed",
  },
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
      } catch { /* Telegram storage is optional for the paste demo. */ }
    };
    void loadTelegramPromises();
    const timer = window.setInterval(loadTelegramPromises, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const missedTotal = useMemo(
    () => promises.filter((item) => item.status === "missed").length * 100,
    [promises],
  );
  const rewardUnlocked = missedTotal >= 300;
  const activePromises = promises.filter((item) => item.status === "due" || item.status === "needs-date");

  function updateStatus(id: string, status: Status) {
    setPromises((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    void fetch(`/api/promises/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  }

  function resetDemo() {
    setPromises(starterPromises);
  }

  async function copyReward() {
    await navigator.clipboard.writeText(
      "I’ve reached our playful promise-meter limit. I owe you the $300 spa voucher we agreed on. Pick a spa you’d love and I’ll make it happen ❤️",
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">DO ALREADY?</p>
            <h1>Hey, you.</h1>
          </div>
          <button className="reset-button" onClick={resetDemo} aria-label="Reset demo data">↻</button>
        </header>

        <section className="promises-section">
          <div className="section-heading"><div><p className="eyebrow">KEEP YOUR WORD</p><h2>{activePromises.length ? "Due soon" : "You’re all caught up"}</h2></div><span className="count-pill">{activePromises.length}</span></div>
          {activePromises.length ? activePromises.map((item) => <PromiseCard key={item.id} item={item} onStatus={updateStatus} />) : <p className="empty-state">You’re all clear for now. New promises arrive from Telegram.</p>}
        </section>

        <section className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">YOUR PROMISE METER</p>
            <p className="meter-value">${missedTotal}</p>
            <p className="meter-caption">of $300 toward The Wife’s spa day</p>
          </div>
          <div className="meter-orb" aria-hidden="true"><span>✦</span></div>
          <div className="meter-track" aria-label={`${missedTotal} of 300 dollars`}>
            <span style={{ width: `${Math.min((missedTotal / 300) * 100, 100)}%` }} />
          </div>
          <p className="playful-note">Playful accountability, mutually agreed.</p>
        </section>

        {rewardUnlocked && (
          <section className="reward-card">
            <div className="reward-icon">✦</div>
            <div>
              <p className="eyebrow">REWARD UNLOCKED</p>
              <h2>$300 spa voucher</h2>
              <p>Your pre-agreed make-good is ready.</p>
            </div>
            <button className="copy-button" onClick={copyReward}>Copy message</button>
          </section>
        )}

        <section className="history-section">
          <p className="eyebrow">THE STORY SO FAR</p>
          {promises.filter((item) => item.status === "completed" || item.status === "missed").map((item) => <HistoryCard key={item.id} item={item} />)}
        </section>
      </section>
    </main>
  );
}

function PromiseCard({ item, onStatus }: { item: PromiseItem; onStatus: (id: string, status: Status) => void }) {
  const relevantPerson = item.relevantPerson === "Maya" ? "The Wife" : item.relevantPerson;
  return <article className="promise-card"><div className="promise-icon">{item.category === "Preparation" ? "◌" : item.category === "Important date" ? "♡" : "✓"}</div><div className="promise-content"><div className="promise-title-row"><h3>{item.title}</h3><span>{item.category}</span></div><p>{item.dueText} · For {relevantPerson}</p><p className="prep">{item.preparation}</p><div className="status-actions"><button onClick={() => onStatus(item.id, "completed")}>Do already</button><button onClick={() => onStatus(item.id, "missed")}>Aiya I forgot</button></div></div></article>;
}

function HistoryCard({ item }: { item: PromiseItem }) {
  const missed = item.status === "missed";
  return <article className="history-card"><span className={missed ? "history-icon missed" : "history-icon complete"}>{missed ? "!" : "✓"}</span><div><h3>{item.title}</h3><p>{item.dueText}</p></div><strong>{missed ? "+$100" : "Done"}</strong></article>;
}
