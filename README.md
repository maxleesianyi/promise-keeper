# Do Already?

Do Already? is a playful, mobile-first relationship assistant that turns commitments hidden in everyday messages into organised, editable promises. It was created for the OpenAI Build Week Hackathon.

## The idea

Everyday messages can hide important commitments: picking up dog food, packing swimming gear, or booking a special dinner. Normal task apps expect people to interpret and rewrite those messages themselves. Do Already? uses GPT-5.6 to produce an editable draft, then lets the user decide what to save and whether it was completed or missed.

The demo uses a fictional husband-and-wife scenario. The broader idea is suitable for couples, families, roommates, and caregivers.

## MVP features

- Paste a message or select a fictional sample.
- GPT-5.6 extracts a promise, due timing, relevant person, preparation, category, and confidence.
- Edit every field before saving.
- Store confirmed promise details locally in the browser.
- Mark promises completed or missed.
- Add $100 per missed promise and work toward a reward chosen in the dashboard; both the reward and its SGD value are editable on that device.
- Start in the Interviewer Buddy-inspired cool-light dashboard, or switch to midnight mode with the theme icon; the choice is remembered on that device.
- Copy a warm reward message; no automatic purchase or message is sent.
- Optional hackathon demo integration: a consented private Telegram group automatically saves only clear, high-confidence tasks; medium-confidence messages receive a one-tap **Save promise** card.
- A clear follow-up from The Wife can update an active Telegram task instead of creating a duplicate. For example, a later “buy carrots as well” message can be merged into an existing grocery task.
- Tap a recent task to correct its wording or switch its outcome between **Do already** and **Miss**.

## Safety and privacy

- Do not submit confidential or highly sensitive conversations.
- The app displays a privacy note beside the input.
- Original pasted message text is not retained after analysis.
- High-confidence Telegram tasks are saved automatically; medium-confidence tasks require the user's approval. Clear additions to one active task are merged automatically; ambiguous follow-ups are ignored rather than creating a duplicate. Vague or low-confidence messages are ignored.
- The playful meter is mutually agreed, optional product framing—not a judgement of relationship health.
- The Telegram webhook accepts only the configured demo group and sender ID. It stores only the structured promise after one-tap approval, never the original message text.

## Telegram hackathon demo setup

This optional path is for the filmed demo. The normal pasted-message path remains available to everyone.

1. Create a bot with `@BotFather`; keep its token secret.
2. Add the bot, you, and your wife to a private demo group. Make the bot an admin, then both people press **Start** in a private chat with the bot once.
3. Configure the five `TELEGRAM_*` values in the hosted environment. Use numeric Telegram IDs, not names.
4. Set the bot webhook to `https://YOUR-DEPLOYED-URL/api/telegram/webhook` and supply the same `TELEGRAM_WEBHOOK_SECRET` as Telegram's secret token.

The bot ignores all messages except text from the configured group and your wife's exact account ID. GPT automatically saves only clear, high-confidence commitments. When a clear message explicitly adds to one active task, GPT updates that task instead of saving another one. Medium-confidence commitments receive a private **Save promise** or **Not a promise** card; low-confidence or ambiguous update messages create no notification.

## Run locally

1. Install Node.js 22 or later.
2. In this project folder, install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env.local` and add your OpenAI API key:

   ```text
   OPENAI_API_KEY=your_key_here
   ```

4. Start the project with `pnpm dev`.
5. Open the local address shown in your terminal.

Without an API key, the three built-in fictional samples remain available through a deliberately limited demo fallback. Add an API key before presenting the real GPT-powered experience.

## How the app works

The browser sends a pasted message to a protected server-side route. That route calls the OpenAI Responses API with GPT-5.6 and returns only a structured draft. The browser saves only the fields the user confirms. The OpenAI key stays on the server and must never be committed to GitHub.

## Testing

Follow [TESTING.md](TESTING.md) for the complete demo and safety checks.

## Build Week records

- [BUILD_WEEK_CHANGELOG.md](BUILD_WEEK_CHANGELOG.md) records features built during the event.
- [DECISIONS.md](DECISIONS.md) records product and scope decisions.

## Known limitations

This MVP has no accounts, database, shared partner view, calendar connection, push notifications, Telegram sending, WhatsApp access, screenshot input, or payment flow. Those are intentional exclusions to keep the core promise-to-follow-through loop reliable.

## Codex and GPT-5.6

Codex accelerated the project by helping refine the product scope, set up the app, implement the interface and interaction flow, create documentation, and test the experience. GPT-5.6 powers the core behaviour: extracting structured commitments from natural conversation.

## Demo link

[Do already demo](https://promise-keeper-demo.leesianyi.chatgpt.site)

## Hackathon reminder

Before submitting, retrieve the `/feedback` Codex Session ID from the main Codex session where the core functionality was built.
