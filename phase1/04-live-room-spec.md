# 04 — Live Assessment Room Specification (S12)

The most important build item. Everything here serves the hard requirement:

> **select checklist item → one click or hotkey → auto-labelled evidence thumbnail →
> no modal → assessor stays in the video.**
> Perceived capture < 3 s; capture-to-thumbnail < 1 s; the conversation never pauses.

## 4.1 Layout

**Assessor (desktop, three zones):**

```
+--------------------------------------+----------------------+
|                                      |  CHECKLIST PANEL     |
|         CLIENT VIDEO (60%)           |  (40%)               |
|                                      |  section > items     |
|  [overlay: Capture  Request-photo    |  progress bar        |
|   Flip-prompt  Torch-prompt  Mute    |                      |
|   Cam  End]                          |                      |
+--------------------------------------+----------------------+
|  CAPTURE TRAY: last 5 thumbnails · click = relabel/discard  |
+-------------------------------------------------------------+
```

- Client video dominant; controls as a slim overlay strip, never covering the centre.
- Connection quality indicators for both sides in a corner.
- Session timer + grace-period countdown (pre-admit) in the header.

**Client (mobile):** own camera view large (what they're showing), assessor thumbnail
small, instruction banner top, flip-camera + torch buttons persistent bottom, Leave
button behind a confirm. Nothing else, ever. On capture: brief "photo taken ✓" flash.

## 4.2 Checklist behaviour

- Template sections collapsed except current; tapping an item makes it **active**
  (highlight + its client-instruction ready to push).
- Item anatomy: prompt · answer control (yes/no = one tap, choice = chips, text =
  inline field) · evidence count badge · note icon · Concern flag toggle ·
  "Can't capture now" (missing) action.
- **Free navigation** — completeness tracked, sequence never enforced. Progress bar
  = answered+evidenced items / required items.
- Answer taps must not steal focus from hotkeys (see 4.4).
- Physical-trigger shortcut: a "Recommend physical" action (per phase0 doc 08) on the
  panel header — records trigger + reason, marks the session outcome, does not end
  the call.

## 4.3 Capture tray

- Horizontal strip, last 5 captures, newest first; count badge for the session total.
- Click a thumbnail → inline popover (not modal): relabel (text prefilled), reassign
  item (dropdown), discard (reason). Two taps max, video never covered.
- Captures with no active item land here tagged **UNFILED** (amber) — the
  shoot-first mode the workshop asked about (W7); filing happens here or in the
  gallery later.

## 4.4 Screenshot capture (the loop)

1. Trigger: on-screen Capture button **or hotkey**. Hotkey plan: `C` and `Space`
   both capture **when focus is not in a text field**; while typing, only `Ctrl+Space`
   captures. (Hotkey scheme validated in usability testing, chunk 1J.)
2. Implementation: grab current frame from the client's remote video track →
   canvas → JPEG (quality ~0.85) → optimistic thumbnail rendered **immediately from
   the local canvas** (this is what makes <1 s achievable regardless of upload
   speed) → upload in background → retry silently on failure, badge if it keeps
   failing.
3. Auto-label: `{section} – {item} – {HH:mm:ss}` (or `UNFILED – {HH:mm:ss}`);
   server receives capture timestamp + item ref + session ref.
4. Feedback: soft shutter sound + 100 ms frame flash. No dialog. No confirmation.
5. Burst-friendly: repeated presses queue; no debounce lockout beyond ~300 ms.

## 4.5 High-res photo request

1. Assessor taps **Request photo** (on the active item; disabled if none active —
   high-res always files to an item).
2. Client's screen switches to full-resolution camera capture view with the item's
   client instruction ("Photograph the sticker with the serial number — fill the
   screen") + big shutter button.
3. Client: capture → preview → **Use photo / Retake** → upload with progress bar →
   auto-return to video. Call audio continues throughout (video may pause on the
   client side while the camera is re-used — spike question SP6).
4. Assessor sees the thumbnail arrive tagged "high-res client capture"; opens
   full-size in the popover to **confirm legibility on the spot** before moving on.
5. Cancel paths: either side can cancel the request; timeout after 60 s returns the
   client to video automatically.

## 4.6 Notes

- Note icon on any item → inline text field under the item (not a modal); Enter
  saves. General session notes in a collapsible drawer at panel bottom.
- Notes never visible to the client. Notes attach to the item and flow to the report
  builder.

## 4.7 Concern flag

- Toggle beside each item's note icon; one tap sets, optional short reason inline.
- UI label: **"Concern flag"** (templates keep the internal red-flag concept).
- Flag state visible only to staff roles; flows to report builder as factual
  observations (flag status itself not printed — phase0 doc 09 rule).

## 4.8 Missing item flag

- "Can't capture now" on any item → inline reason picker (not available / client
  can't access / will upload later / other + free text) → item turns amber, joins
  the missing list shown in the end-session summary and the gallery panel.
- One tap to undo if it turns up later in the session.

## 4.9 Client instruction banner

- Each checklist item carries `client_instruction_text` (from template). Assessor
  taps a small "push" icon on the active item → text appears in the client's banner
  with a gentle chime. Banner persists until replaced or cleared.
- Assessor can also send one of ~6 canned prompts (closer / further / slower /
  more light / switch to back camera / hold steady).
- Language: plain, no jargon (template copy already written that way).

## 4.10 Rear camera / torch prompts

- Assessor taps Flip-prompt or Torch-prompt → client's corresponding button pulses
  with a banner hint. **The client always performs the action** — we never remotely
  switch their camera (control + trust + platform reliability).
- Torch availability is device-dependent (spike SP4): when unsupported, the client
  button hides and the assessor's prompt button shows "torch unavailable — ask for
  more light".

## 4.11 Drop / reconnect handling

- Client drop: room persists; assessor sees "client reconnecting…" with elapsed
  time; same link rejoins straight into the room (skips consent/device check on
  rejoin within the same session). All captured state is server-side — nothing lost.
- Assessor drop: client sees a calm holding screen ("reconnecting you…"); assessor
  rejoin restores checklist state exactly (active item, tray, answers) from the
  server.
- Grace logic: 5 min of client absence → assessor prompted: wait / end + flag
  missing items / mark no-show (if never meaningfully started).
- All connect/disconnect events go to the event log with timestamps.

## 4.12 Room definition-of-done checklist

- ☐ Capture loop measured <1 s to thumbnail, <3 s perceived, on office Wi-Fi AND
  simulated 4G.
- ☐ Hotkeys never fire while typing; capture never opens any modal.
- ☐ High-res round-trip produces a legible geyser rating plate photo from 1.5 m.
- ☐ Client view audited against the visibility rule (no internal data reachable).
- ☐ Kill the client's connection mid-session → rejoin → zero data loss.
- ☐ A full geyser template session (~25 items) completes without scrolling jank or
  video interruption.
