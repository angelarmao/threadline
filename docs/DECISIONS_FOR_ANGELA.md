# Decisions for Angela

These are the choices I need from you before the final two-week build sprint.

## 1. Product Angle

Recommended: closet and shopping decision system.

This keeps the project more novel than a normal digital closet because the app answers: "Should I buy this, or can I style what I already own?"

Other viable angles:

- Outfit diary: track what you wore and how it felt.
- Sustainable shopping coach: emphasize avoided purchases and cost per wear.
- Personal styling assistant: emphasize outfit generation and event dressing.

## 2. Photo Flow

Recommended: upload-first with mobile camera capture.

The current prototype uses an image file input with `accept=image/*` and `capture=environment`, so phones can open the camera and laptops can upload existing photos. This is much simpler and more reliable than building a live camera interface for the milestone.

Later upgrade:

- Add live webcam capture with `getUserMedia`.
- Add background removal or automatic tags.
- Add batch upload for many closet photos.

## 3. UI Direction

Recommended current direction: "editorial closet cockpit."

It feels like a clean productivity app for wardrobe decisions: inventory, metrics, and decision cards.

Alternatives I can switch to:

- Minimal boutique: more image-led, airy, and fashion-forward.
- Spreadsheet chic: denser tables, filters, and budgeting controls.
- Social moodboard: outfit boards, inspiration pins, and visual collections.

## 4. MVP Feature Set

Recommended milestone scope:

- Add closet item with photo, category, colors, price, wears, and notes.
- Closet grid with filters.
- Wear logging.
- Shopping queue with price and planned wears.
- Cost-per-wear and buy/wait/style-first decision hints.
- Gap radar based on closet categories.

Defer:

- Account login.
- Real retailer integrations.
- AI styling.
- Computer vision auto-tagging.
- Cloud sync.

## 5. Novelty Claim

Recommended claim:

Threadline is not just a digital closet. It connects owned items to future shopping decisions, helping users avoid redundant purchases by showing closet gaps, category saturation, and cost-per-wear tradeoffs.

## 6. Data Model

Recommended:

- `items`: closet pieces.
- `shopping`: possible purchases.
- `outfits`: planned combinations, added next.
- `events`: future wear history, added if time allows.

## 7. Questions to Answer

- Do you want the app to feel more like a fashion tool, a budgeting tool, or a sustainability tool?
- Should the final demo use your real closet photos, sample photos, or generated placeholder data?
- Should outfit planning be visual drag-and-drop, or a simpler form that combines existing pieces?
- Do you want to target college students specifically, or broader shoppers?
- What are 2-3 apps or sites whose UI you like?
