# Threadline

Threadline is a closet memory and purchase tracking prototype. The core loop is simple: log what you wore today, keep your closet organized, track purchases and wishlist items, and glance at friend activity for style context.

![Threadline app screenshot](docs/threadline-home.png)

## Product Focus

The app is intentionally tighter than a general fashion dashboard. It focuses on four surfaces:

- Today: upload a daily outfit photo and save an auto-recognized draft log.
- Closet: keep owned pieces in one visual board.
- Purchases: track bought items and wishlist items.
- Friends: see lightweight outfit and purchase activity from friends.

## Current Features

- Responsive retro fashion-board interface.
- Local Node.js backend with JSON persistence.
- Daily outfit photo upload with prototype auto-recognition chips.
- Closet item photo upload with category, colors, price, and wear count.
- Purchase tracker for bought and wishlist items.
- Friend feed demo data for the future social direction.

## Run Locally

```bash
npm run dev
```

The app runs at:

```text
http://127.0.0.1:5173
```

There are no external npm dependencies yet.

## Camera and Recognition Approach

The milestone version uses a normal image input:

```html
<input type="file" accept="image/*" capture="environment" />
```

On phones, this can open the camera or photo library. The recognition step is currently a prototype that drafts tags from the user's closet categories and colors. A later version can replace that with a computer-vision model or a human-in-the-loop confirmation flow.

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
