# Testing Do Already?

## Core flow

1. Open the site on a narrow browser window or phone.
2. Confirm the dashboard begins at $200 with two missed promises and one completed promise.
3. Select **Jason needs his swimming gear tomorrow** and choose **Find the promise**.
4. Confirm the editable AI draft appears; save it.
5. Mark the saved promise **Aiya I forgot**.
6. Choose **Edit reward**, set a different reward and a value in $10 SGD steps, then save it. Confirm the Penalty Meter and reward note update immediately.
7. Confirm the meter reaches the chosen value and the reward message can be copied.
8. Select **Reset demo** and confirm the starting task state returns.
9. Confirm the dashboard starts in cool-light mode. Tap the theme icon to switch to midnight, refresh, and confirm the chosen theme remains.
10. Tap a card in **Recent tasks**, correct its task wording, switch it between **Do already** and **Miss**, and save. Confirm the card and Penalty Meter update.
11. Confirm **Edit reward** sits at the Penalty Meter’s top-right and that matching happy-wife markers sit above both ends of the progress bar.

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
7. Send a clear task, then a clearly linked addition such as “oh I forgot, buy carrots as well.” Confirm the original active task is updated with the combined items instead of creating a second task.
8. Send a vague follow-up that could refer to more than one task. Confirm no task is changed or created.
