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
  confidence: "High" | "Medium" | "Needs your input";
  status: Status;
};

const starterPromises: PromiseItem[] = [
  {
    id: "dog-food",
    title: "Buy dog food before coming home",
    category: "Errand",
    dueText: "Missed · Tue, 14 Jul",
    relevantPerson: "Maya",
    preparation: "Pick up the usual brand on the way home.",
    confidence: "High",
    status: "missed",
  },
  {
    id: "dinner",
    title: "Book anniversary dinner",
    category: "Important date",
    dueText: "Missed · Wed, 15 Jul",
    relevantPerson: "Maya",
    preparation: "Choose a restaurant and reserve a table.",
    confidence: "High",
    status: "missed",
  },
  {
    id: "groceries",
    title: "Pick up groceries for the weekend",
    category: "Errand",
    dueText: "Completed · Today",
    relevantPerson: "Maya",
    preparation: "Milk, fruit, and coffee.",
    confidence: "High",
    status: "completed",
  },
];

const samples = [
  "Jason needs his swimming gear tomorrow.",
  "Can you buy dog food before coming home?",
  "Please book the restaurant for my birthday.",
];

function getStoredPromises() {
  if (typeof window === "undefined") return starterPromises;
  const saved = window.localStorage.getItem("promise-keeper-promises");
  if (!saved) return starterPromises;
  try {
    return JSON.parse(saved) as PromiseItem[];
  } catch {
    return starterPromises;
  }
}

export default function Home() {
  const [promises, setPromises] = useState<PromiseItem[]>(starterPromises);
  const [message, setMessage] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [draft, setDraft] = useState<PromiseItem | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => setPromises(getStoredPromises()), []);
  useEffect(() => {
    window.localStorage.setItem("promise-keeper-promises", JSON.stringify(promises));
  }, [promises]);

  const missedTotal = useMemo(
    () => promises.filter((item) => item.status === "missed").length * 100,
    [promises],
  );
  const rewardUnlocked = missedTotal >= 300;
  const activePromises = promises.filter((item) => item.status === "due" || item.status === "needs-date");

  async function analyseMessage(event?: FormEvent) {
    event?.preventDefault();
    if (!message.trim()) return;
    setNotice("");
    setIsAnalysing(true);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.promise) {
        setNotice(result.message || "I couldn’t find a clear promise in that message.");
        return;
      }
      setDraft({ id: crypto.randomUUID(), ...result.promise, status: result.promise.dueText === "No date yet" ? "needs-date" : "due" });
    } catch {
      setNotice("Something went wrong. Please try a sample message or try again.");
    } finally {
      setIsAnalysing(false);
    }
  }

  function saveDraft() {
    if (!draft?.title.trim()) return;
    setPromises((current) => [draft, ...current]);
    setDraft(null);
    setMessage("");
    setNotice("Promise saved. You’ve got this.");
  }

  function updateStatus(id: string, status: Status) {
    setPromises((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function resetDemo() {
    setPromises(starterPromises);
    setDraft(null);
    setMessage("");
    setNotice("Demo reset to the starting scenario.");
  }

  async function copyReward() {
    await navigator.clipboard.writeText(
      "I’ve reached our playful promise-meter limit. I owe you the $300 spa voucher we agreed on. Pick a spa you’d love and I’ll make it happen ❤️",
    );
    setNotice("Spa-voucher message copied.");
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">PROMISE KEEPER</p>
            <h1>Hey, you.</h1>
          </div>
          <button className="reset-button" onClick={resetDemo} aria-label="Reset demo data">↻</button>
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">YOUR PROMISE METER</p>
            <p className="meter-value">${missedTotal}</p>
            <p className="meter-caption">of $300 toward Maya’s spa day</p>
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

        <section className="capture-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CATCH IT NOW</p>
              <h2>Turn a message into a promise</h2>
            </div>
            <span className="sparkle">✦</span>
          </div>
          <form onSubmit={analyseMessage}>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Paste something Maya said…"
              rows={3}
              aria-label="Message to analyse"
            />
            <button className="primary-button" type="submit" disabled={isAnalysing || !message.trim()}>
              {isAnalysing ? "Finding the promise…" : "Find the promise"}
            </button>
          </form>
          <div className="sample-row">
            {samples.map((sample) => <button key={sample} onClick={() => setMessage(sample)}>{sample}</button>)}
          </div>
          <p className="privacy-note">Use only messages you’re comfortable sharing. Original message text is not kept after analysis.</p>
        </section>

        {notice && <p className="notice" role="status">{notice}</p>}

        {draft && (
          <section className="draft-card">
            <div className="section-heading"><div><p className="eyebrow">AI’S DRAFT</p><h2>Does this look right?</h2></div><span className={`confidence ${draft.confidence.toLowerCase().replaceAll(" ", "-")}`}>{draft.confidence}</span></div>
            <label>Promise<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <div className="two-fields"><label>When<input value={draft.dueText} onChange={(event) => setDraft({ ...draft, dueText: event.target.value })} /></label><label>For<input value={draft.relevantPerson} onChange={(event) => setDraft({ ...draft, relevantPerson: event.target.value })} /></label></div>
            <label>Preparation<input value={draft.preparation} onChange={(event) => setDraft({ ...draft, preparation: event.target.value })} /></label>
            <div className="draft-actions"><button className="text-button" onClick={() => setDraft(null)}>Discard</button><button className="primary-button" onClick={saveDraft}>Save promise</button></div>
          </section>
        )}

        <section className="promises-section">
          <div className="section-heading"><div><p className="eyebrow">KEEP YOUR WORD</p><h2>{activePromises.length ? "Due soon" : "You’re all caught up"}</h2></div><span className="count-pill">{activePromises.length}</span></div>
          {activePromises.length ? activePromises.map((item) => <PromiseCard key={item.id} item={item} onStatus={updateStatus} />) : <p className="empty-state">Add a promise above, or reset the demo to replay the story.</p>}
        </section>

        <section className="history-section">
          <p className="eyebrow">THE STORY SO FAR</p>
          {promises.filter((item) => item.status === "completed" || item.status === "missed").map((item) => <HistoryCard key={item.id} item={item} />)}
        </section>
      </section>
    </main>
  );
}

function PromiseCard({ item, onStatus }: { item: PromiseItem; onStatus: (id: string, status: Status) => void }) {
  return <article className="promise-card"><div className="promise-icon">{item.category === "Preparation" ? "◌" : item.category === "Important date" ? "♡" : "✓"}</div><div className="promise-content"><div className="promise-title-row"><h3>{item.title}</h3><span>{item.category}</span></div><p>{item.dueText} · For {item.relevantPerson}</p><p className="prep">{item.preparation}</p><div className="status-actions"><button onClick={() => onStatus(item.id, "completed")}>Completed</button><button onClick={() => onStatus(item.id, "missed")}>Missed <b>+$100</b></button></div></div></article>;
}

function HistoryCard({ item }: { item: PromiseItem }) {
  const missed = item.status === "missed";
  return <article className="history-card"><span className={missed ? "history-icon missed" : "history-icon complete"}>{missed ? "!" : "✓"}</span><div><h3>{item.title}</h3><p>{item.dueText}</p></div><strong>{missed ? "+$100" : "Done"}</strong></article>;
}
