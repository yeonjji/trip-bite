# Design System Specification: Sensory Hospitality

## 1. Overview & Creative North Star: "The Modern Hanok"
This design system rejects the clinical coldness of modern travel apps in favor of **Sensory Hospitality**. Our Creative North Star is the concept of *Jeong* (정)—a feeling of warm attachment and shared experience. 

To move beyond a generic "warm" template, we employ **Organic Asymmetry** and **Tonal Depth**. The UI should feel like an editorial travel journal: high-contrast typography scales, overlapping imagery that breaks the grid, and a physical sense of layered paper. We replace rigid 1px dividers with "Environmental Boundaries"—using shifts in cream and clay tones to guide the eye, creating a digital space that feels as inviting as a sun-drenched courtyard.

---

## 2. Color & Surface Architecture
The palette is rooted in earth and hearth. We utilize a "No-Line" philosophy; structural containment is achieved through value shifts, not strokes.

### The Palette (Material Design Tokens)
*   **Base:** `surface` (#FBF9F1) — The canvas.
*   **Primary:** `primary` (#AD2C00) — Deep Terracotta. Used for action and heat.
*   **Secondary:** `secondary` (#1B6D24) — Forest Green. Used for nature, growth, and navigation.
*   **Accents:** `tertiary` (#005CAC) — Soft Blue. Used sparingly for utility and sky-like highlights.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined by background shifts.
*   **Level 0 (The Ground):** `surface` (#FBF9F1)
*   **Level 1 (The Mat):** `surface-container-low` (#F5F4EC) for large content areas.
*   **Level 2 (The Tray):** `surface-container-highest` (#E4E3DB) for interactive or highlighted modules.

### Glass & Texture
For floating navigation or top-layer modals, use **Glassmorphism**:
*   **Fill:** `surface-container-lowest` (#FFFFFF) at 70% opacity.
*   **Effect:** `Backdrop-blur: 20px`.
*   **Signature Polish:** Apply a subtle grain overlay (2% opacity) to `primary-container` backgrounds to mimic the texture of handmade *Hanji* paper.

---

## 3. Typography: Editorial Rhythm
We use **Plus Jakarta Sans** not as a functional workhorse, but as a rhythmic editorial voice. The rounded terminals mirror the `1rem` (16px) corner radius of our components.

*   **Display (The Headline):** `display-lg` (3.5rem) / `display-md` (2.75rem). Use with tight letter-spacing (-0.02em) for hero moments. This is your "Main Bite."
*   **Titles (The Story):** `title-lg` (1.375rem). Use for destination names and section headers. Bold and welcoming.
*   **Body (The Detail):** `body-md` (0.875rem). Use `on-surface-variant` (#5A413A) to reduce contrast and increase the "warmth" of the reading experience.
*   **Labels (The Utility):** `label-md` (0.75rem). All-caps with increased letter-spacing (0.05em) to provide a premium, curated feel.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too heavy for this system. We use **Tonal Stacking** to create a soft, natural lift.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The subtle brightness shift creates a "Physical Lift" without a single drop shadow.
*   **Ambient Shadows:** For high-priority floating actions (e.g., "Book Now"), use an extra-diffused shadow:
    *   `X: 0, Y: 12, Blur: 40, Spread: 0`
    *   **Color:** `on-surface` (#1B1C17) at 6% opacity. This mimics natural light rather than digital "glow."
*   **The Ghost Border:** If accessibility requires a stroke, use `outline-variant` (#E3BEB5) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: The Tactile Kit
All components utilize a default `rounding: 1rem (16px)` to maintain a friendly, "hand-carved" aesthetic.

### Buttons (The Interaction Call)
*   **Primary:** `primary` (#AD2C00) background with `on-primary` (#FFFFFF) text. Use a subtle linear gradient from `primary` to `primary-container` (#D34011) to give the button "soul."
*   **Secondary:** `surface-container-high` (#EAE8E0) background. No border. Text in `on-surface`.
*   **Tertiary:** No background. Text in `primary`. For low-emphasis discovery.

### Cards & Content Lists
*   **The Divider Rule:** Forbid the use of line dividers. Separate list items using `spacing: 4` (1.4rem) or by alternating background colors (`surface` to `surface-container-low`).
*   **Image Treatments:** Photos should always have `rounding: lg (2rem)`. Overlap images slightly over card boundaries to break the "boxed-in" feel.

### Input Fields
*   **State:** Background should be `surface-container-lowest`. 
*   **Focus:** Instead of a heavy border, use a 2px "Ghost Border" of `primary` at 40% and increase the Ambient Shadow to indicate activity.

### Additional Component: "The Bite" Chip
A custom selection chip for dietary or travel preferences. 
*   **Style:** `surface-container-high`, `rounding: full`, `padding: 1.5 (0.5rem) 3 (1rem)`.
*   **Interaction:** On selection, transition to `secondary-container` (#A0F399) with a "pop" animation.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Negative Space:** Use `spacing: 8` (2.75rem) or `spacing: 12` (4rem) between major sections to let the "Cream" background breathe.
*   **Asymmetric Layouts:** Offset text blocks from images to create an editorial, high-end travel magazine feel.
*   **Intentional Color:** Use `secondary` (Forest Green) exclusively for "Success," "Nature," or "Confirmed" states.

### Don't:
*   **No Pure Black:** Never use #000000. Use `on-surface` (#1B1C17) for all dark text to maintain the "Warmth" of the system.
*   **No Sharp Corners:** Avoid the `none` or `sm` rounding tokens unless for 1px details. Everything should feel soft to the touch.
*   **No Flat Grids:** Avoid placing 3 or 4 identical cards in a row. Vary the sizes or use a horizontal carousel to keep the user engaged in a "journey."