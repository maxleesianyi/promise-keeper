# Testing Do Already?

## Dashboard flow — no setup required

1. Open the live demo on a phone or narrow browser window.
2. Confirm the starter dashboard has two **MISS** cards, one **DONE** card, and a $200 Penalty Meter.
3. Tap **Edit reward**, change the reward name or value in $10 SGD steps, and save. Confirm the meter copy updates.
4. Tap a card in **Recent tasks**. Change the wording, switch it between **Do already** and **Miss**, and save. Confirm the card and Penalty Meter update.
5. Confirm exactly one character follows the Penalty Meter progress: she is delighted at 0% and 100%, annoyed on either side of the middle, and most unhappy around 50%.
6. Tap the theme icon, refresh, and confirm the theme choice is remembered on that device.
7. Tap **Reset demo** and confirm the dashboard returns to its starter task state.

## Telegram demo — optional configured path

1. Configure the six values in `.env.local` and deploy the application.
2. Add the bot, the user, and the allowlisted wife account to the configured private group. Both people must start a private chat with the bot once.
3. Send a clear task from the allowlisted wife account, such as “Buy eggs and milk.” Confirm it appears as an active task automatically.
4. Send “Oh I forgot, buy carrots as well.” Confirm the existing grocery task updates to include carrots instead of a second task being created.
5. Send an ambiguous message that could refer to multiple active tasks. Confirm no task changes and no duplicate is added.
6. Send a medium-confidence task. Confirm the private approval card offers **Save promise** or **Not a promise**.
7. Send ordinary chat from the allowlisted sender, or any text from another account or group. Confirm no promise is created.

## Safety checks

- The webhook rejects requests that do not contain the configured Telegram secret.
- The original Telegram message text is not written to durable task storage.
- No payment, Telegram message, calendar event, or notification is sent automatically.
- A user can correct a saved task’s outcome in the dashboard.
