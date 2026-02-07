# Spam Call Prevention Implementation

Resolves **Issue 5: prevent spam calls from buyer to seller**.

## Changes Implemented

### 1. Call Session Governance (`src/app/orders/[id]/page.tsx`)
- **Single Session Limit**: Implemented a strict **1 call per order** policy. This prevents buyers from repeatedly calling sellers.
- **Cooldown Mechanism**: Added a 10-minute cooldown (in case limit is increased in future) to prevent rapid-fire call attempts.
- **Call Counting**: Tracks previous calls by analyzing system messages ("Started a live...") in the order history.
- **UI Locking**: Call buttons are replaced with a **Locked** state ("Session limit reached") when criteria are not met.
- **Active Call Exception**: If a call is currently active (via Supabase broadcast), users can always "Join", ensuring they can reconnect if dropped.

### 2. Duration Enforcement (`src/components/WebRTCVideoCall.tsx`)
- **Auto-Disconnect**: Added a countdown timer that automatically ends the call when time runs out.
- **Dynamic Duration**: Defaults to **30 minutes**, but parses duration from product features (e.g., "60 min consultation" feature in product will set timer to 60 mins).
- **Time Display**: Shows remaining time in the call header (pulsing red when < 1 minute).

## ongoing Maintenance
- To change the max calls allowed, update `MAX_CALLS` constant in `src/app/orders/[id]/page.tsx`.
- To change default duration, update the fallback value (30) in `callDurationMinutes` logic.
