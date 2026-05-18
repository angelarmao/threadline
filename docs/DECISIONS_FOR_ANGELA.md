# Decisions for Angela

These are the choices I need from you before the final two-week build sprint.

## 1. Product Angle

Recommended: daily outfit memory plus closet and purchase tracking.

This keeps the project more novel than a normal digital closet because the app captures the daily behavior loop: what you wore, what you own, what you bought, and what your friends are wearing.

Other viable angles:

- Outfit diary: track what you wore and how it felt.
- Sustainable shopping coach: emphasize avoided purchases and cost per wear.
- Personal styling assistant: emphasize outfit generation and event dressing.

## 2. Photo Flow

Recommended: upload-first with mobile camera capture.

The current prototype uses an image file input with `accept=image/*` and `capture=environment`, so phones can open the camera and laptops can upload existing photos. This is much simpler and more reliable than building a live camera interface for the milestone.

Later upgrade:

- Add live webcam capture with `getUserMedia`.
- Add editable auto-recognition chips.
- Add batch upload for many closet photos.

## 3. UI Direction

Recommended current direction: retro fashion desktop.

It feels like a playful mix of MS Paint, fashion collages, closet boards, and tiny desktop windows.

Alternatives I can switch to:

- Minimal boutique: more image-led, airy, and fashion-forward.
- Spreadsheet chic: denser tables, filters, and budgeting controls.
- Social moodboard: outfit boards, inspiration pins, and visual collections.

## 4. MVP Feature Set

Recommended milestone scope:

- Daily outfit upload.
- Prototype recognition chips.
- Closet board with filters.
- Purchase and wishlist tracker.
- Friends feed demo.

Defer:

- Account login.
- Real retailer integrations.
- Full computer vision.
- Friend privacy settings.
- Cloud sync.

## 5. Novelty Claim

Recommended claim:

Threadline is not just a digital closet. It turns getting dressed into a memory system by connecting daily outfit photos, owned clothes, purchase history, and friend inspiration.

## 6. Data Model

Recommended:

- `items`: closet pieces.
- `shopping`: purchases and wishlist items.
- `outfits`: daily outfit logs.
- `friends`: sample social activity, later replaced by real accounts.

## 7. Questions to Answer

- Should the final product feel more playful like a fashion desktop, or cleaner like a closet archive?
- Should friends see purchases by default, or only outfits you choose to post?
- Should the final demo use your real closet photos, sample photos, or generated placeholder data?
- Is the primary user college students, fashion hobbyists, or people trying to buy less?
- What is the one daily habit we most want the app to support?
