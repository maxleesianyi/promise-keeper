# Do Already?

**Do Already?** is a playful, mobile-first accountability assistant for everyday household commitments. It turns a Telegram instruction from the user's partner into a task, helps the user record whether it was done or missed, and makes the agreed reward visible while keeping it fun and light hearted.

Built for **OpenAI Build Week** with Codex and GPT-5.6.

## Links for judges

- **Code repository:** [github.com/maxleesianyi/do-already](https://github.com/maxleesianyi/do-already)
- **Live demo:** [Do already demo](https://promise-keeper-demo.leesianyi.chatgpt.site)
- **Licence:** [MIT](LICENSE)

The GitHub repository is public. The live demo is usable without signing in.

## What to try

1. Open the live demo on a phone or narrow browser window.
2. Review the active task list, **Penalty Meter**, editable reward, and recent task history.
3. Tap a recent task to correct its wording or toggle between **Do already** and **Miss**.
4. Use **Reset demo** to return the sample dashboard to its original state.

The optional Telegram flow is included for the filmed hackathon demonstration. It needs the configured private group, allowlisted Telegram accounts, and environment values listed below.

## Sample data

The dashboard is immediately explorable without credentials. Its starter state contains two missed household tasks and one completed grocery task; this makes the $200 Penalty Meter understandable before connecting Telegram. The sample data is defined in [app/page.tsx](app/page.tsx) and restored by **Reset demo**.

## How it works

```text
Allowlisted Telegram message
        ↓
GPT-5.6 Luna via the OpenAI Responses API
        ↓
Structured task + confidence + optional active-task update
        ↓
High: save automatically | Medium: private approval card | Low: ignore
        ↓
D1-backed dashboard task history
```

### GPT-5.6 implementation

- The server calls the **OpenAI Responses API** with `gpt-5.6-luna` and a strict JSON Schema response format.
- The model extracts a title, category, due timing, preparation, confidence, and whether the message is a **new** task or a clear **update** to an active task.
- For a clear follow-up such as “oh I forgot, buy carrots as well,” the model receives only the compact structured context for active tasks and can merge the item into the matching task. It preserves the original due date unless the new message explicitly changes it.
- Only the structured task is stored. Original Telegram message text is not retained.
- The webhook accepts text only from the configured private demo group and allowlisted sender. It ignores everyone else.

## Run locally

### Prerequisites

- Node.js 22 or later
- pnpm
- An OpenAI API key for real GPT-5.6 extraction

### Setup

```bash
git clone https://github.com/maxleesianyi/do-already.git
cd do-already
pnpm install
cp .env.example .env.local
pnpm dev
```

Open the local URL shown by the development server. You can inspect the sample dashboard without any keys.

### Environment values

Add this to `.env.local` for the full Telegram demonstration. Never commit this file.

| Variable | Required for | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | GPT extraction | Server-side access to GPT-5.6 Luna |
| `TELEGRAM_BOT_TOKEN` | Telegram demo | Bot API access |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram demo | Verifies webhook requests from Telegram |
| `TELEGRAM_DEMO_CHAT_ID` | Telegram demo | The consented private demo group |
| `TELEGRAM_WIFE_USER_ID` | Telegram demo | The allowlisted sender |
| `TELEGRAM_USER_ID` | Telegram demo | The user allowed to approve medium-confidence tasks |

For Telegram, point the bot webhook to:

```text
https://YOUR-DEPLOYED-URL/api/telegram/webhook
```

Use the same value for Telegram’s secret token and `TELEGRAM_WEBHOOK_SECRET`.

## Verification

```bash
pnpm build
```

The complete manual test flow, including the optional Telegram update scenario, is in [TESTING.md](TESTING.md).

## Where Codex accelerated the project

Codex was used as the implementation partner throughout the Build Week build:

- Challenged and narrowed the initial concept into a demoable, no-login MVP.
- Built the mobile-first dashboard, task state transitions, editable reward, light/dark themes, and playful visual system.
- Implemented the OpenAI structured-output integration, Telegram webhook, confidence routing, private approval cards, D1 persistence, and active-task merge behaviour.
- Iterated quickly on real interaction feedback: reset behaviour, task editing, dashboard hierarchy, and the Penalty Meter character badges.
- Prepared this documentation, the testing guide, release history, public repository hygiene, clean production builds, and live deployments.

## Key decisions

The decision record is maintained in [DECISIONS.md](DECISIONS.md). The most important choices are:

- Singapore time, no login, and a mobile-first demo experience.
- High-confidence Telegram tasks save automatically; medium-confidence tasks require approval; low-confidence or ambiguous messages are ignored.
- A clear addition can update one active task, but the app never guesses which task to modify.
- The user marks completion or a miss; no payment, penalty, or message is automated.
- Each miss adds $100 toward a reward chosen and editable by The Wife.

## Privacy and limitations

- Do not use this project with confidential or sensitive conversations.
- The Telegram integration is intentionally limited to a consented private demo group and exact sender IDs.
- There are no accounts, shared partner dashboards, calendar sync, push notifications, payments, or WhatsApp access in this MVP.

## Build Week submission checklist

See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for the final Devpost handoff, including the one user-owned `/feedback` step.
