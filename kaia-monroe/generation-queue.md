# Kaia Monroe — Generation Queue

Ready-to-run prompts for Higgsfield. All SFW. Once credits are added, these can
be fired in order to produce a complete, consistent starter pack.

---

## Consistency Workflow (do this in order)

1. **Generate the hero** (shot #1) with **`soul_cast`** — this becomes the canonical face.
2. **Lock the identity** so every later shot matches, via either:
   - **Element** (instant): save the hero image as a reference Element, then embed
     its `<<<element_id>>>` in later prompts (works with `nano_banana_2`, `seedream`, etc.), **or**
   - **Soul** (best fidelity): generate 5–8 hero variations, then train a **Soul**
     (~10 min) and generate the pack with **`soul_2`** + the returned `soul_id`.
3. **Generate shots #2–#15** using the locked identity.
4. **Upscale** the keepers to 4K (`upscale_image`).
5. *(Optional)* Animate 2–3 stills into short clips (`generate_video`).

---

## Base Prompt (prepend / inject into EVERY shot)

```
Kaia Monroe — photorealistic 26-year-old woman, athletic toned hourglass figure,
5'7", sun-kissed golden tan, honey-brown mid-length hair, hazel-green eyes,
light freckles across nose and cheeks, small beauty mark above the left side of
the upper lip, warm natural dimpled smile, natural "no-makeup" makeup, dainty
gold jewelry. Candid authentic editorial influencer photography, shot on 35mm,
soft natural light, shallow depth of field, film grain, high detail.
Negative: text, watermark, logo, extra fingers, distorted hands, plastic skin.
```

---

## Image Shot List (15)

| # | Pillar | Scene prompt (append to base prompt) | Aspect |
|---|---|---|---|
| 1 | **Hero** | head-and-shoulders portrait, looking at camera, neutral sunlit outdoor background, sage-green tank top | 4:5 |
| 2 | Movement | gym mirror selfie, matching sage athleisure set, phone partly visible, bright modern gym | 4:5 |
| 3 | Movement | mid-workout swinging a kettlebell, focused expression, chalk dust, bright functional gym | 4:5 |
| 4 | Mindset | post-run on a coastal boardwalk at sunrise, light sweat, hands on hips, smiling, ocean behind | 4:5 |
| 5 | Movement | yoga / stretch flow on a sandy beach at golden hour, leggings + sports bra, calm | 4:5 |
| 6 | Soft Life | making a green smoothie in a sunlit minimalist kitchen, blender + fruit on counter, laughing | 4:5 |
| 7 | Style | full-body athleisure OOTD in front of a green plant wall, confident pose | 2:3 |
| 8 | Mindset | journaling on a cozy neutral-toned couch with a mug of tea, soft window light, relaxed | 4:5 |
| 9 | Movement | on a pilates reformer in a bright boutique studio, mid-exercise, focused | 4:5 |
| 10 | Soft Life | hiking a coastal trail with a small backpack, sunny, mountain/ocean view behind | 2:3 |
| 11 | Soft Life | healthy meal-prep flatlay on a counter, smiling and holding a container, fresh ingredients | 4:5 |
| 12 | Style | poolside lounging on a sandbed in a tasteful one-piece swimsuit, sunglasses, resort vibe (SFW) | 4:5 |
| 13 | Style | coffee run, casual streetwear-athleisure, oversized hoodie, holding iced coffee, city sidewalk | 4:5 |
| 14 | Soft Life | morning stretch at home in front of a large window, soft golden light, calm | 4:5 |
| 15 | Movement | leading a small outdoor bootcamp class on the beach at sunrise, energetic, whistle/clipboard | 2:3 |

> Generate at `count: 2–4` per prompt and keep the best. Budget ≈ **0.12 credits/image**.

---

## Video Prompt Ideas (optional, `generate_video`)

1. **Day-in-the-life intro:** "Kaia smiles and waves at the camera in a sunlit
   kitchen, then sips a green smoothie" — animate from shot #6.
2. **Workout loop:** "Kaia performs a controlled kettlebell swing, smooth motion,
   bright gym" — animate from shot #3.
3. **Golden-hour stretch:** "Kaia slowly transitions through a yoga stretch on the
   beach as waves roll behind her" — animate from shot #5.

Recommended models: `kling3_0_turbo` (fast single start-frame animation) or
`seedance_2_0` (identity-preserving). Confirm with `models_explore` at run time.

---

## Cost Snapshot

- ~**0.12 credits/image** (soul_cast, verified) → 15-shot pack ≈ **2–3 credits** at `count:1`,
  ~**6–8 credits** if you generate 2–4 variations each.
- Soul training and video cost more — check `balance` and use `get_cost: true` before batches.
