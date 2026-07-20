# Decisions

## 16 July 2026 — MVP scope

- **Product:** Do Already?, a playful relationship assistant that turns commitments hidden in everyday messages into editable promises.
- **User:** The initial demo is for one person keeping promises made to their wife; all extracted commitments are assigned to the user.
- **Input:** Pasted text and fictional sample messages only. No WhatsApp or Telegram access, screenshot uploads, or private-message harvesting.
- **AI:** GPT-5.6 performs the core extraction. It creates a draft rather than an automatic record, uses Singapore time, and can return “No date yet.”
- **Storage:** Confirmed fields remain only in that browser. Original message text is not retained. No accounts or cloud database in this MVP.
- **Accountability:** The user marks a task complete or missed. Each missed task adds $100; at three misses, a pre-agreed $300 spa voucher unlocks. No purchase or message sending occurs.
- **Experience:** A mobile-first web app with a warm, playful tone, while avoiding shaming, surveillance, or relationship-health claims.

## Build summary — 16 July 2026

### What we built today

- A complete mobile-first Promise Keeper dashboard with fictional starting data: two missed promises, one completed promise, and a $200 meter.
- Pasted-message capture, fictional sample conversations, an editable AI draft, a browser-only promise dashboard, complete/missed actions, a $100-per-miss meter, and a $300 spa-voucher unlock with a copyable message.
- A protected server-side GPT-5.6 extraction route, plus a deliberately limited local sample fallback when no API key is configured.
- Build Week records: README, testing steps, changelog, environment template, and this decision log.
- A public GitHub repository with separate commits for the product, documentation, and environment template.

### Alternatives considered

- **Native mobile app:** rejected for the MVP because a mobile-friendly web app is faster to build, test, and share.
- **Supabase, accounts, and cloud history:** postponed. Browser-only storage keeps the first version fast and private.
- **WhatsApp/Telegram access, screenshots, calendar sync, push reminders, and real Telegram sends:** excluded to avoid permissions, unsupported integrations, and privacy risk.
- **Automatic penalties or purchases:** excluded. The user marks a task missed; no purchase or message is sent automatically.
- **A generic task-list approach:** rejected because the main value is GPT extracting an editable promise from conversational wording.

### What Codex accelerated

Codex challenged the initial concept one decision at a time, narrowed it to a demoable working loop, set up the project, implemented the mobile interface and server route, prepared privacy language and testing instructions, created the repository, and maintained the Build Week documentation and commit history.

### Decisions made by the project owner

- The initial working name was **Promise Keeper**; the final submitted product name is **Do Already?**.
- The initial story is you and your wife; every saved instruction is assigned to you.
- The MVP uses Singapore time and permits promises with **No date yet**.
- The product is playful by default but avoids shaming or relationship-health claims.
- Every missed task adds **$100**. At **$300**, the fixed pre-agreed reward is a **$300 spa voucher** chosen by the wife.
- The demo begins with two missed fictional promises, then uses “Jason needs his swimming gear tomorrow” as the final AI extraction and reward-unlock moment.

### Verification note

The source code and interaction flow are complete. The first local build verification is currently blocked by a package-linking failure in the OneDrive-synchronised workspace (`pnpm` reports missing linked package files after setup). Move or clone the repository to a normal local folder, run `pnpm install`, set `OPENAI_API_KEY`, and run `pnpm build` before the final submission. This is an environment issue, not a known product-flow issue.

## 16 July 2026 — Telegram demo enhancement

- The filmed demo uses a private Telegram group containing the user, wife, and bot; the public demo retains pasted text and fictional samples.
- The webhook accepts only the configured group and the wife's exact Telegram account ID. It ignores all other messages.
- GPT sends a private one-tap **Save promise** or **Not a promise** card only for high-confidence commitments. No promise is saved without the user's approval.
- Confirmed Telegram promises are stored in D1 so they appear in the web dashboard. Original Telegram message text is never stored.

## 18 July 2026 â€” Confidence-based Telegram routing

- Clear, high-confidence tasks from the allowlisted sender are saved to Do Already? automatically, without a private approval card.
- Medium-confidence tasks require the user's existing private **Save promise** or **Not a promise** decision.
- Low-confidence and ordinary chat messages are ignored, avoiding unnecessary notifications and accidental promises.

## 18 July 2026 â€” Cost-conscious model choice

- The Telegram commitment classifier uses GPT-5.6 Luna, the cost-sensitive tier of the GPT-5.6 family, while preserving the same structured extraction and confidence-routing behaviour.

## 18 July 2026 â€” Reward ownership and dashboard tone

- The dashboard adopts the Interviewer Buddy’s midnight, blue, teal, amber, and coral visual language while retaining Do Already?’s playful copy.
- The fixed spa voucher is now only the default. The reward name and its SGD value are editable in the dashboard and stored on that device, which keeps the no-login MVP simple.

## 18 July 2026 — Adaptive Interviewer Buddy theme

- Do Already? keeps the midnight dashboard as its default, while adding the Interviewer Buddy’s cool-light theme as a user-controlled alternative.
- The theme switch is remembered on the current device. It changes only presentation, never Telegram tasks, promises, or reward data.

## 18 July 2026 — Light-first dashboard refinements

- The cool-light Interviewer Buddy theme is now the default, while midnight remains one tap away through an icon-only, labelled theme control.
- The product name is the primary heading, the task count is supporting one-line copy, and the reward stamp is removed from the Penalty Meter.
- Reward values are constrained to clear SGD $10 increments, preventing the earlier $1-offset values such as $491 or $501.

## 18 July 2026 — Header clarity correction

- The compact theme and reset controls sit above the product heading. The product name is reduced to a single unbroken mobile line, followed by the supporting task count.
- The theme control now uses a simple half-light, half-dark appearance glyph instead of the earlier custom sun-and-moon treatment.

## 18 July 2026 — Task section refinement

- “Recent tasks” stands on its own without the redundant “The Story So Far” label.
- The active and recent-task sections use a clearer theme-aware outline for better separation from the dashboard background.

## 18 July 2026 — Active-task continuity and repair

- GPT receives a compact list of active saved tasks when analysing a Telegram message. It may automatically merge a high-confidence, explicitly linked follow-up into exactly one active task; it must not guess when the target is unclear.
- Recent tasks are now editable records: the user can correct the task wording and toggle an outcome between **Do already** and **Miss**. The saved dashboard record and Penalty Meter follow that correction.
- The Penalty Meter keeps **Edit reward** at its top-right. Its character marker makes the intended win-win framing explicit: finishing helps today, and a miss funds her chosen reward.

## 18 July 2026 — Demo address and meter character journey

- The hosted demo’s visible title is **Do already demo**. Its provider-generated `promise-keeper-demo` URL slug is fixed; a future `do-already-demo` address requires a domain owned by the project owner, rather than a rename that might break the live Telegram webhook.
- One CSS-drawn character now travels above the Penalty Meter instead of sitting at both ends. Her expression follows the meter: extremely happy at 0%, annoyed as it moves toward the centre, most unhappy around 50%, then annoyed and finally extremely happy again once The Wife’s reward is unlocked. It intentionally depicts a generic character rather than claiming to portray a real person.

## 21 July 2026 — Public Telegram-style task demo

- The dashboard now includes a **Try it out** entry point to a Telegram-style group-chat simulation. Visitors can type a request as The Wife, let the existing GPT extraction route assess it, and see a high-confidence task land immediately in the dashboard.
- The simulation is clearly disclosed as local-only: it never sends a Telegram message and never writes a visitor’s demonstration task into the shared Telegram database. Medium-confidence suggestions preserve the real product’s human-approval step.
- The demo is a companion surface rather than a blocking pop-up: it sits to the left of the dashboard on wider screens and above it on smaller screens, keeping the saved task visible in the dashboard.
- The chat now inherits the dashboard’s light and midnight themes, uses the same mildly annoyed wife character as the Penalty Meter, sends with Enter, and is toggled open or closed through the same **Try it out** button.
