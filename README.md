# Terra Impact — website

A static site built for Netlify. It uses no build step, so you can drag the folder into Netlify or push it to your repo.

## ⚠️ Before deploying

**Copy your existing `assets/` folder into this folder.** I didn't receive it, so it isn't in the zip. The site expects these files:

```
assets/logo.png  favicon-16.png  favicon-32.png
assets/product.jpg  plastic.jpg  collect.jpg
assets/bottle.obj
assets/shape1.svg … shape29.svg   assets/color1.svg … color29.svg
```

The About page's "Track your refills" button links to `/track`. That page wasn't in the upload, so add it or remove the button.

## Structure

```
index.html              Home
generator.html          Build your bottle (3D preview + questions)
trace-by-terra.html     Product page (shows the visitor's own design)
about.html              About: intro, goals, 100-dot ripple, pillars, Why Terra, colour guide
account.html            Sign up / log in UI (no backend yet)
saved-designs.html      Designs saved with the ♥ button (stored in the browser)
404.html                Not-found page (Netlify uses it automatically; replaces page-not-found.html)
_redirects              Netlify redirects (old /learnmore → /about, etc.)

css/
  base.css              Design tokens, buttons, header, footer, modal, forms
  home.css · builder.css · product.css · about.css · account.css · saved.css

js/
  site.js               Header + mobile menu, footer, waitlist modal,
                        Netlify AJAX forms, cookie banner, scroll reveal, toast
  lib/survey.js         ★ Questions, answers and colours — the ONE place to edit them
  lib/mosaic.js         Mosaic tile geometry, pattern texture and bottle drawing
  sketches/             Home page canvases (mosaic intro, data pattern, floating bottle)
  lib/designs.js        Save / list / delete designs (localStorage)
  generator.js · product.js · about.js · account.js · saved.js
  vendor/p5.min.js      p5.js 1.7.0 (local copy, so there's no CDN version mismatch)
```

## Editing tips

- **Change a question, label or colour:** edit `js/lib/survey.js`. The generator, the home page "Data-Driven Design" key and the About page guide all update together. Before, these lists were duplicated and had drifted apart: the Bike colour and the two outer-shape colours didn't match in the old legend.
- **Brand colours, spacing, fonts:** the CSS variables at the top of `css/base.css`.
- **Nav links:** `navLinks` in `js/site.js`. The header and footer are injected on every page, so you edit them once.
- **Forms:** Netlify detects the `waitlist` and `subscribe` forms from the hidden copies at the bottom of `index.html`. Keep them if you rename fields.

## What changed

- Removed the p5-built menu (`menu.js`). It is now a semantic HTML header with a keyboard-accessible mobile menu. The **Build** and **Join waitlist** links are no longer hidden on mobile.
- Every page is fully responsive. I removed the fixed/absolute positioning that overlapped on small screens, and tested at 390 px and 1440 px.
- **Generator:** the preview and the questions sit side by side on desktop. On mobile, the preview sticks to the top and the actions sit in a bottom bar. The questions are now colour-swatch buttons and a slider, so people see the colour each answer gives. You can rotate the bottle by dragging or with the arrow keys, and it has a reset-view button. Answers are remembered for the session. Sharing uses the native share sheet on phones and downloads the image on desktop.
- The product page shows the visitor's design with a summary of their answers and an "Edit design" link.
- I replaced the duplicate IDs, inline styles and repeated modal code with shared components. The 3D canvases only animate while they're on screen, and they respect reduced-motion settings.
- I removed the unused files: `sketch.js` (fully commented out), `test.html/js/css`, the empty `style.css`, `productpage.js` and `learnmore.html` (its content is now on `about.html`).
- **Note:** the "How many refillable bottles do you own?" question never affected the pattern, so I left it out. Tell me if you want it back with a visual meaning.

### Update 2: About, Saved designs and 404

- **About:** your original About text and sections are kept, rebuilt so they work on every screen size.
  - The opening statements now cross-fade inside a sticky section. Before, they used fixed-position text that overlapped the rest of the page.
  - The "Our goal" cards still scroll as a marquee. It pauses on hover or keyboard focus, and becomes a static grid for people who turn off motion.
  - In the 100-dot grid, the fact dots are spread across the grid. You can tap them on a phone or tab to them, and the fact appears under the grid instead of in a hover-only tooltip.
  - The three image sections (circularity, tracking, values) now alternate. They use plastic.jpg, collect.jpg and product.jpg, so swap in your own images.
  - The Learn More text and the colour guide sit below them.
  - I fixed the "producs" typo and made the "11 kg per 10 products" goal read the same in both copies of the marquee.
- **Saved designs:** before, nothing ever saved a design, so this page was always empty.
  - The heart button on the 3D bottle in the builder and on the product page now saves the design to the visitor's browser.
  - This page lists the saved designs, with Edit (reopens the builder with those answers), View product and Delete.
  - The heart in the header shows a count.
  - A design the old version stored as `savedDesign` is moved into the new list automatically.
- **404:** it now has the site's header and footer and a "missing tile" illustration. It uses absolute paths so it displays correctly at any URL depth. `/page-not-found` and `/error` redirect to it.
