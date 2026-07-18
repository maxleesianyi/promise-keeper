# Testing Do Already?

## Core flow

1. Open the site on a narrow browser window or phone.
2. Confirm the dashboard begins at $200 with two missed promises and one completed promise.
3. Select **Jason needs his swimming gear tomorrow** and choose **Find the promise**.
4. Confirm the editable AI draft appears; save it.
5. Mark the saved promise **Aiya I forgot**.
6. Choose **Edit reward**, set a different reward and SGD value, then save it. Confirm the Penalty Meter and reward note update immediately.
7. Confirm the meter reaches the chosen value and the reward message can be copied.
8. Select **Reset demo** and confirm the starting task state returns.

## Safety checks

- The original pasted message is never stored in browser storage.
- Every draft is editable before saving.
- No payment, Telegram message, calendar event, or notification is sent.
- A non-commitment such as “Traffic is terrible today” is declined.

## GPT check

With `OPENAI_API_KEY` configured, paste a new harmless fictional message. Confirm a fresh structured draft is returned. Without a key, the three built-in samples use a clearly limited local demo fallback so the interface remains testable.

## Telegram demo check

1. Configure all `TELEGRAM_*` values and deploy the app.
2. Send a clear fictional commitment from the allowlisted wife account in the private demo group.
3. Confirm it appears on the dashboard automatically, without a private approval card.
4. Send an ambiguous but plausible task. Confirm the user receives a private Telegram card with **Save promise** and **Not a promise**; tap **Save promise** and confirm it appears on the dashboard.
5. Send a vague conversational message and confirm no card or promise is created.
6. Send a message from another account or group and confirm no card or promise is created.
