"use client";

import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

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
type MeterMood = "delighted" | "annoyed" | "unhappy";
type ExtractedDemoPromise = Omit<PromiseItem, "id" | "status"> & {
  action: "new" | "update";
  targetPromiseId: string;
};
type DemoChatMessage = {
  id: string;
  kind: "message" | "status" | "review";
  sender?: "wife" | "do-already";
  text: string;
  task?: PromiseItem;
};
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
const demoChatWelcome: DemoChatMessage[] = [
  { id: "demo-wife-welcome", kind: "message", sender: "wife", text: "Try typing a clear request as The Wife. Do Already? will check whether it should become a task." },
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
  const [editingTask, setEditingTask] = useState<PromiseItem | null>(null);
  const [taskTitleDraft, setTaskTitleDraft] = useState("");
  const [taskStatusDraft, setTaskStatusDraft] = useState<"completed" | "missed">("completed");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isDemoChatOpen, setIsDemoChatOpen] = useState(false);
  const [demoMessageDraft, setDemoMessageDraft] = useState("");
  const [demoChatMessages, setDemoChatMessages] = useState<DemoChatMessage[]>(demoChatWelcome);
  const [isDemoAnalysing, setIsDemoAnalysing] = useState(false);
  const taskEditorRef = useRef<HTMLDivElement>(null);
  const demoChatRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!editingTask) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFirstField = window.setTimeout(() => taskEditorRef.current?.querySelector<HTMLInputElement>("input")?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setEditingTask(null);
        return;
      }
      if (event.key !== "Tab" || !taskEditorRef.current) return;
      const focusable = Array.from(taskEditorRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusFirstField);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [editingTask]);

  useEffect(() => {
    if (!isDemoChatOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusComposer = window.setTimeout(() => demoChatRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsDemoChatOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusComposer);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isDemoChatOpen]);

  const missedTotal = useMemo(
    () => promises.filter((item) => item.status === "missed").length * 100,
    [promises],
  );
  const rewardUnlocked = missedTotal >= reward.value;
  const activePromises = promises.filter((item) => item.status === "due" || item.status === "needs-date");
  const meterProgress = Math.min((missedTotal / reward.value) * 100, 100);
  const meterMood: MeterMood = meterProgress <= 12 || meterProgress >= 88 ? "delighted" : meterProgress <= 35 || meterProgress >= 65 ? "annoyed" : "unhappy";
  const meterMoodLabel = meterMood === "delighted" ? "extremely happy" : meterMood === "annoyed" ? "annoyed" : "most unhappy";
  const waitingLabel = activePromises.length === 1 ? "1 task waiting" : `${activePromises.length} tasks waiting`;

  function persistTask(id: string, updates: Partial<Pick<PromiseItem, "status" | "title">>) {
    void fetch(`/api/promises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => setNotice({ message: "Saved on this device. We’ll try Telegram again shortly.", tone: "warning" }));
  }

  function updateStatus(id: string, status: Status) {
    const previous = promises.find((item) => item.id === id)?.status;
    if (!previous) return;
    setPromises((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    persistTask(id, { status });
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
    persistTask(notice.undo.id, { status: notice.undo.status });
    setNotice({ message: "Back on your list.", tone: "neutral" });
  }

  function startTaskEdit(item: PromiseItem) {
    if (item.status !== "completed" && item.status !== "missed") return;
    setEditingTask(item);
    setTaskTitleDraft(item.title);
    setTaskStatusDraft(item.status);
  }

  function cancelTaskEdit() {
    setEditingTask(null);
  }

  function saveTaskEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask) return;
    const title = taskTitleDraft.trim();
    if (!title) {
      setNotice({ message: "Give this task a clear name first.", tone: "warning" });
      return;
    }
    setPromises((current) => current.map((item) => (
      item.id === editingTask.id ? { ...item, title, status: taskStatusDraft } : item
    )));
    persistTask(editingTask.id, { title, status: taskStatusDraft });
    setEditingTask(null);
    setNotice({
      message: taskStatusDraft === "completed" ? "Task updated — done already." : "Task updated — $100 is on the meter.",
      tone: taskStatusDraft === "completed" ? "success" : "warning",
    });
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

  function makeDemoTask(extracted: ExtractedDemoPromise): PromiseItem {
    return {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: extracted.title,
      category: extracted.category,
      dueText: extracted.dueText,
      relevantPerson: extracted.relevantPerson || "The Wife",
      preparation: extracted.preparation,
      confidence: extracted.confidence,
      status: extracted.dueText === "No date yet" ? "needs-date" : "due",
    };
  }

  function saveDemoTask(task: PromiseItem, reviewId?: string) {
    setPromises((current) => [task, ...current]);
    if (reviewId) {
      setDemoChatMessages((current) => current.map((message) => (
        message.id === reviewId ? { id: `${reviewId}-saved`, kind: "status", text: `Saved to your dashboard: ${task.title}` } : message
      )));
    } else {
      setDemoChatMessages((current) => [...current, { id: `demo-saved-${task.id}`, kind: "status", text: `Saved to your dashboard: ${task.title}` }]);
    }
    setNotice({ message: "Demo task saved to Don’t forget ah.", tone: "success" });
  }

  async function sendDemoMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = demoMessageDraft.trim();
    if (!message || isDemoAnalysing) return;

    const sentId = `demo-sent-${Date.now()}`;
    setDemoChatMessages((current) => [...current, { id: sentId, kind: "message", sender: "wife", text: message }]);
    setDemoMessageDraft("");
    setIsDemoAnalysing(true);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json() as { promise?: ExtractedDemoPromise; message?: string };
      if (!response.ok || !payload.promise || payload.promise.confidence === "Low") {
        setDemoChatMessages((current) => [...current, { id: `demo-no-task-${sentId}`, kind: "status", text: payload.message || "No clear task found. Try a specific request with an action." }]);
        return;
      }

      const task = makeDemoTask(payload.promise);
      if (task.confidence === "High") {
        saveDemoTask(task);
        return;
      }
      setDemoChatMessages((current) => [...current, { id: `demo-review-${task.id}`, kind: "review", text: "This sounds like a task. Save it to the dashboard?", task }]);
    } catch {
      setDemoChatMessages((current) => [...current, { id: `demo-error-${sentId}`, kind: "status", text: "The task checker could not respond. Try again in a moment." }]);
    } finally {
      setIsDemoAnalysing(false);
    }
  }

  function sendDemoMessageOnEnter(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <main className={`app-shell ${isDemoChatOpen ? "demo-chat-open" : ""}`}>
      <div className="dashboard-column">
        <div className="app-controls" aria-label="Dashboard controls">
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
        <section className="phone-frame" aria-label="Do Already dashboard">
          <header className="topbar">
          <div className="header-copy">
            <h1 className="wordmark"><span>You </span><strong>Do Already</strong><span> or not?</span></h1>
            <p className="waiting-label">{waitingLabel}</p>
            <p className="header-subtitle">Live from your chat with The Wife</p>
            <button className="try-demo-button" type="button" onClick={() => setIsDemoChatOpen((current) => !current)} aria-expanded={isDemoChatOpen} aria-controls="try-it-out-chat"><span aria-hidden="true">←</span>Try it out</button>
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
          <button className="reward-edit-button" type="button" onClick={startRewardEdit} aria-expanded={isEditingReward} aria-controls="reward-settings">Edit reward</button>
          <div className="meter-journey" role="img" aria-label={`The Wife is ${meterMoodLabel} at ${Math.round(meterProgress)} percent of the Penalty Meter. She wins whether tasks are done or her reward is unlocked.`}>
            <div className="meter-character-rail" aria-hidden="true"><WifeAvatar mood={meterMood} progress={meterProgress} /></div>
            <div className="meter-track" aria-hidden="true"><span style={{ width: `${meterProgress}%` }} /></div>
          </div>
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
          {promises.filter((item) => item.status === "completed" || item.status === "missed").map((item) => <HistoryCard key={item.id} item={item} onEdit={startTaskEdit} />)}
        </section>
        </section>
      </div>

      {editingTask && (
        <div className="task-editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelTaskEdit(); }}>
          <div className="task-editor" ref={taskEditorRef} role="dialog" aria-modal="true" aria-labelledby="task-editor-title" aria-describedby="task-editor-description">
            <form onSubmit={saveTaskEdit}>
              <div className="task-editor-heading">
                <div><p className="eyebrow">EDIT RECENT TASK</p><h2 id="task-editor-title">Set the record straight</h2><p id="task-editor-description">Tidy the task wording or change how it ended.</p></div>
                <button type="button" className="editor-close" onClick={cancelTaskEdit} aria-label="Close task editor">×</button>
              </div>
              <label className="task-editor-label">Task<input value={taskTitleDraft} onChange={(event) => setTaskTitleDraft(event.target.value)} /></label>
              <fieldset className="task-status-picker">
                <legend>How did it go?</legend>
                <div>
                  <button type="button" className={`task-status-choice complete ${taskStatusDraft === "completed" ? "selected" : ""}`} aria-pressed={taskStatusDraft === "completed"} onClick={() => setTaskStatusDraft("completed")}><span>Do already</span><small>Completed</small></button>
                  <button type="button" className={`task-status-choice missed ${taskStatusDraft === "missed" ? "selected" : ""}`} aria-pressed={taskStatusDraft === "missed"} onClick={() => setTaskStatusDraft("missed")}><span>Miss</span><small>Forgot it</small></button>
                </div>
              </fieldset>
              <div className="task-editor-actions"><button type="button" className="editor-cancel" onClick={cancelTaskEdit}>Cancel</button><button className="editor-save" type="submit">Save task</button></div>
            </form>
          </div>
        </div>
      )}

      {isDemoChatOpen && (
        <aside className="demo-chat-panel" id="try-it-out-chat" aria-label="Telegram-style task demo">
          <section className="demo-chat" ref={demoChatRef} aria-labelledby="demo-chat-title">
            <header className="demo-chat-header">
              <WifeAvatar mood="annoyed" className="demo-chat-avatar" />
              <div><p id="demo-chat-title">The Wife + Do Already?</p><span>Demo group chat · 2 members</span></div>
              <button type="button" className="demo-chat-close" onClick={() => setIsDemoChatOpen(false)} aria-label="Close demo chat">×</button>
            </header>
            <div className="demo-chat-wall" aria-live="polite">
              <p className="demo-chat-date">TODAY</p>
              {demoChatMessages.map((message) => (
                message.kind === "message" ? <div className={`demo-message ${message.sender}`} key={message.id}><p>{message.sender === "wife" ? "The Wife" : "Do Already?"}</p><span>{message.text}</span><time>now</time></div>
                  : message.kind === "review" && message.task ? <div className="demo-review" key={message.id}><p>{message.text}</p><strong>{message.task.title}</strong><span>{message.task.dueText}</span><button type="button" onClick={() => saveDemoTask(message.task!, message.id)}>Save task</button></div>
                    : <p className="demo-chat-status" key={message.id}>{message.text}</p>
              ))}
              {isDemoAnalysing && <p className="demo-chat-status demo-chat-checking">Do Already? is checking…</p>}
              <div className="demo-suggestions"><p>Try a clear task:</p><button type="button" onClick={() => setDemoMessageDraft("Can you pack Jason’s swimming gear for tomorrow?")}>Pack Jason’s swimming gear for tomorrow</button><button type="button" onClick={() => setDemoMessageDraft("Please buy dog food before coming home.")}>Buy dog food before coming home</button></div>
            </div>
            <form className="demo-chat-composer" onSubmit={sendDemoMessage}>
              <label className="sr-only" htmlFor="demo-chat-message">Type a message from The Wife</label>
              <textarea id="demo-chat-message" value={demoMessageDraft} onChange={(event) => setDemoMessageDraft(event.target.value)} onKeyDown={sendDemoMessageOnEnter} placeholder="Type a message from The Wife" rows={1} maxLength={280} disabled={isDemoAnalysing} enterKeyHint="send" />
              <button type="submit" disabled={!demoMessageDraft.trim() || isDemoAnalysing}>{isDemoAnalysing ? "Checking" : "Send"}</button>
            </form>
          </section>
        </aside>
      )}

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

function HistoryCard({ item, onEdit }: { item: PromiseItem; onEdit: (item: PromiseItem) => void }) {
  const missed = item.status === "missed";
  return <article className="history-card"><button type="button" className="history-edit-button" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}><span className={`history-status ${missed ? "missed" : "complete"}`}>{missed ? "MISS" : "DONE"}</span><span className="history-copy"><h3>{item.title}</h3><p>{item.dueText}</p></span><strong>{missed ? "+$100" : "Done already"}</strong><span className="history-chevron" aria-hidden="true">›</span></button></article>;
}

function WifeAvatar({ mood, progress, className }: { mood: MeterMood; progress?: number; className?: string }) {
  const style = progress === undefined ? undefined : { left: `clamp(21px, ${progress}%, calc(100% - 21px))` };
  return <span className={`wife-avatar wife-avatar-${mood}${className ? ` ${className}` : ""}`} style={style} aria-hidden={className ? true : undefined}><span className="wife-avatar-hair" /><span className="wife-avatar-face"><span className="wife-avatar-brows" /><span className="wife-avatar-eyes" /><span className="wife-avatar-mouth" /><span className="wife-avatar-blush" /></span><span className="wife-avatar-earring" /><span className="wife-avatar-sparkle" /></span>;
}
