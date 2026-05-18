# Two-Week Roadmap

## Current State

Threadline now has a working local prototype with a retro fashion-board interface, a Node.js backend, JSON persistence, daily outfit uploads, prototype recognition chips, closet item creation, purchase/wishlist tracking, and a sample friends feed.

## Week 1

### Day 1

Validate the tighter concept: daily outfit memory plus closet and purchases. Remove anything that does not support that loop.

### Day 2

Make recognition editable. After a user uploads an outfit, let them confirm which closet pieces were detected and correct the chips.

### Day 3

Connect outfit logs to closet items. When an outfit is saved, increment wear counts for the selected pieces.

### Day 4

Improve purchase tracking. Add purchase date, store/link, wishlist versus bought filters, and a small monthly spend summary.

### Day 5

Create a strong demo dataset with real or approved sample closet images, outfit logs, purchases, and friend activity.

## Week 2

### Day 6

Run 2-3 user tests. Watch whether users understand the daily upload flow and whether purchase tracking feels worth returning to.

### Day 7

Polish the interface from test feedback. Tighten spacing, empty states, card hierarchy, and mobile camera capture.

### Day 8

Prototype friend privacy controls. Decide whether friends can see outfits, purchases, wishlist items, or only selected posts.

### Day 9

Add a simple insight view: most reworn pieces, recently bought but unworn items, and outfit streak.

### Day 10

Finalize README, milestone answers, screenshots, and a concise demo script.

## Stretch Goals

- Computer vision API for category/color recognition.
- Batch upload of closet pieces.
- Receipt parsing from screenshots.
- Friend groups and privacy settings.
- Hosted deployment with a small database.
