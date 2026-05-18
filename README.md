# Threadline

Threadline is a CS153 milestone prototype for closet and shopping management. It helps users upload closet photos, track owned pieces, log wears, and evaluate future purchases with simple gap and cost-per-wear signals.

## Why This Is Different

Many wardrobe apps stop at inventory. Threadline connects the closet to shopping decisions, so the main question is not just "what do I own?" but "should I buy this, or can I style what I already have?"

## Current Features

- Responsive web app front-end.
- Local Node.js backend with JSON persistence.
- Add closet pieces with phone camera capture or photo upload.
- Store category, colors, season, price, wear count, and notes.
- Filter closet by category.
- Log wears.
- Manage a shopping queue.
- See simple buy, waitlist, or style-first signals.
- See closet gap radar by category.

## Run Locally

```bash
npm run dev
```

The app runs at:

```text
http://localhost:5173
```

There are no external npm dependencies yet.

## Camera and Upload Approach

The milestone version uses a normal image input:

```html
<input type="file" accept="image/*" capture="environment" />
```

On phones, this can open the camera or photo library. On laptops, it behaves like a regular upload control. This keeps the photo flow simple and reliable for the milestone while leaving room for a later live-camera flow.

## Project Structure

```text
threadline/
  data/db.json
  docs/
  public/
    app.js
    index.html
    styles.css
  server.js
```

## Next Features

See `docs/ROADMAP.md` for the two-week plan and `docs/DECISIONS_FOR_ANGELA.md` for product and UI decisions.
