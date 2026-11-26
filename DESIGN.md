# DESIGN.md · Aegis Practitioner Hub

Status: Round 1, revised with the Bevel reference. Waiting for Emma's OK. These rules apply to every change once approved.

## Ground rules
- Design only. Never change headlines, paragraphs or button text.
- The Aegis brand kit still governs: logo treatments, Yankees Blue and Bronze, Calibri/Carlito, compliance footer.
- References: tubconnect.com for structure (tabs, resource cards, detail pages with "On this page"); Bevel for flow, spacing and feel. Borrow spacing and rhythm only. Never their logos, photos, colors or words.

## The look in three words
**Apothecary. Clinical. Unhurried.**
- Apothecary: amber jars, labels, measured doses. Things are labeled, not decorated.
- Clinical: precise type, real data, clear hierarchy. Nothing glows.
- Unhurried: patients move phases when they're ready, not on a calendar. Big air between sections, one idea per screen.

## Color
| Name | Hex | Role |
|---|---|---|
| Yankees Blue | #1C3140 | Main. Headlines, text, primary buttons |
| Deep Bronze | #7A6243 | Accent fill. Only "you are here" and the single most important action on a screen (a deeper shade of brand Bronze so white text stays readable) |
| Bronze | #A7895F | Brand accent. Italic emphasis words, thin rules, labels |
| Paper | #FFFFFF | Default canvas, nav, footer |
| Mist | #EEF1F4 | Large feature and bento surfaces (a pale tint of Yankees Blue, our version of Bevel's cloud card) |
| Slate | #5B6872 | Supporting copy, metadata |

Product colors (TUDCA amber, NanoGlut indigo, etc.) appear only as small data markers: phase dots, formula tags, progress. Never as backgrounds or buttons.
No gradients except one: the hero field may fade from Mist to Paper. No purple, no neon, no cream-everywhere.

## Type
- One family, like Bevel: Carlito (Calibri). Brand-locked, and never Inter, Roboto or Arial.
- Display: Carlito Bold, −0.03em tracking, line-height 1.0. Steps: 80 / 64 / 40px desktop; 44 / 36 / 28px phone.
- Body: Carlito Regular, 20px desktop (18px phone), line-height 1.4, Slate.
- Nav and buttons: Carlito Bold 16px, no tracking.
- Labels: Carlito Bold 14px, sentence case, Bronze ink. No letter-spaced all caps except the logo.

## Spacing and rhythm (from Bevel)
- 8px base unit. Scale: 8, 16, 24, 32, 40, 48, 80, 96, 160.
- 80px between sections on desktop, 48px on phone. Never stack dense 24–40px sections.
- 32px padding inside feature cards. 16px between elements inside a card.
- Text-led sections alternate with one visual moment (product photography, the formulas strip). No two image-heavy sections in a row.

## Shape and depth
- Floating capsule nav: Paper, 32px radius, light backdrop blur, sits over the hero.
- Hero: one large rounded field (32px radius, Mist to Paper), not a boxed panel.
- Feature and bento cards: Mist surface, 24px radius, no border, no shadow.
- Resource cards on Paper: 20px radius, hairline border (#E4E8EC), no shadow.
- Buttons: full capsule. Primary = Yankees Blue fill, Paper text, 8px 20px padding, short. One primary per screen.
- Inputs, tags, chips: 10px radius. Not everything is a pill.
- Shadows only on floating imagery (product photos): 0 0 16px −8px rgba(0,0,0,.25).

## Motion
- No fade-in on sections.
- Allowed: the capsule nav stays put while content moves beneath it; the formulas strip scrolls horizontally with edges fading into the page; the sequence rail fills as you scroll. Hover changes color or underline only. Respect prefers-reduced-motion.

## The detail people will remember
**The sequence rail.** A thin Yankees Blue line with three marks (Regulate, Recalibrate, Release) that runs under the capsule nav. An Deep Bronze dot shows where the practitioner is in certification, and the line fills as you move through a page. On each formula page, the rail lights that formula's phase. The method itself is the signature.

## Imagery
- Real product photography leads, on Paper or Mist, raw and dimensional with a soft lift. Never boxed in a bordered card.
- Real photos of Dr. Jess and Dr. Jaban when supplied. No stock people. No emoji icons; line icons at 1.7px stroke only where they aid scanning.

## Numbers
- 01/02/03 only for real sequences (the three phases, steps in a protocol). Never on features or lists.

## Layout
- Hero: centered statement inside the rounded field, no pill badge above it. Supporting copy, one capsule button, the doctor byline as proof (Bevel's rating strip, our version).
- Below the hero: the tab bar and content stay left-aligned for scanning; big centered display statements only as section openers.
- Detail pages: wide reading column, "On this page" rail on the right, 80px between sections.

## Decisions taken
1. Headline font: Carlito only, scale and weight do the work (pending Emma's OK).
2. Pill labels above headlines: dropped. Replaced by the sequence rail and plain Bronze labels.
3. Reference sites: Bevel received; TUB Connect for structure.

## Color rule (added Nov 2026)
Only brand colors: Yankees Blue, Bronze (and its deeper shade for button fills), white and Mist. No green, orange or red in the interface. Status labels use navy or bronze tints. Practice-branded patient views default to Aegis colors until a practice sets its own.
