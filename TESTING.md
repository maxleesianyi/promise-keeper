# Testing Promise Keeper

## Core flow

1. Open the site on a narrow browser window or phone.
2. Confirm the dashboard begins at $200 with two missed promises and one completed promise.
3. Select **Jason needs his swimming gear tomorrow** and choose **Find the promise**.
4. Confirm the editable AI draft appears; save it.
5. Mark the saved promise **Missed +$100**.
6. Confirm the meter reaches $300 and the spa-voucher message can be copied.
7. Select **Reset demo data** and confirm the starting state returns.

## Safety checks

- The original pasted message is never stored in browser storage.
- Every draft is editable before saving.
- No payment, Telegram message, calendar event, or notification is sent.
- A non-commitment such as “Traffic is terrible today” is declined.

## GPT check

With `OPENAI_API_KEY` configured, paste a new harmless fictional message. Confirm a fresh structured draft is returned. Without a key, the three built-in samples use a clearly limited local demo fallback so the interface remains testable.
