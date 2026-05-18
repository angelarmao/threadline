# Two-Week Roadmap

## Current State

Threadline now has a working local prototype with a responsive front-end, a Node.js backend, persistent JSON data, closet item creation, photo upload/camera capture, closet filtering, wear logging, shopping queue management, gap radar, and cost-per-wear decision hints.

## Week 1

### Day 1

Finalize product angle and UI direction. Decide whether the project is primarily about shopping restraint, closet organization, sustainability, or outfit planning.

### Day 2

Add outfit planning data model and UI. Let a user choose 2-4 closet items and save an outfit with occasion, season, and notes.

### Day 3

Improve decision logic. Compare shopping ideas against owned categories, colors, and planned outfits so the app can explain "buy," "wait," or "style existing items."

### Day 4

Add edit flows for closet items and shopping ideas. This turns the prototype from a demo into something testable.

### Day 5

Prepare a demo dataset with 12-20 closet pieces and 5-8 shopping ideas. The demo should make the novelty obvious in under one minute.

## Week 2

### Day 6

Add a lightweight user testing script and run 2-3 tests with classmates or friends. Focus on whether the app helps people make shopping decisions.

### Day 7

Revise UI based on testing. Tighten labels, remove confusing controls, and make the core workflow faster.

### Day 8

Add a simple insights page: most worn item, least worn item, best cost-per-wear, unused shopping ideas, and biggest closet gap.

### Day 9

Polish mobile behavior. Test photo capture on a phone, improve small-screen layout, and check that text does not overflow.

### Day 10

Finalize README, milestone answers, screenshots, and presentation/demo notes.

## Stretch Goals

- Batch photo upload.
- Live camera capture with `getUserMedia`.
- Automatic color/category tagging.
- Budget cap for shopping queue.
- Browser local storage fallback for offline demo.
- Hosted deployment on Render, Railway, or Vercel with a small database.
