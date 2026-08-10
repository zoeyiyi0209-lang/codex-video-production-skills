# Planning schema

Use this normalized record for each extracted shot:

| Field | Meaning |
|---|---|
| Script | Source video/script name |
| Section or line | Spoken section supported by the shot |
| Primary visual | The clearest image for the message |
| Alternate B-roll | Optional reusable or lower-effort substitute |
| Location | Kitchen, vanity, bathroom, bedroom, park, car, etc. |
| Light condition | Controlled, window light, sunrise, morning sun, golden hour, night |
| Framing/action | Wide, medium, close-up, overhead, movement, duration |
| Wardrobe | Outfit and exposed body area required |
| Hair/makeup state | Intact, natural, partially removed, wet, sweaty, etc. |
| Props/ingredients | Everything that must be ready before the batch |
| Performer state | Talking, exercising, bathing, cooking, resting, hands-only |
| Reset cost | Low, medium, or high |
| Safety/continuity | Heat, traffic, water, skin sensitivity, directionality, level matching |
| Shareable | Which other scripts can truthfully reuse this setup or take |
| Fixed constraint | Weather, helper, venue hours, preparation/cooking time |

## Batch scoring heuristic

Prefer combining shots when they match, in this order:

1. Same location and light condition
2. Same camera/lighting setup
3. Same wardrobe and hair/makeup state
4. Same props or ingredients
5. Same performer state

Split shots when sharing would create a false product/recipe association, continuity error, unsafe repetition, or a costly reset.

## Schedule duration guide

- Main setup and test: 20–30 minutes
- Talking-head script: 20–35 minutes each after setup
- Simple B-roll action: 3–6 minutes per usable setup
- Recipe/process sequence: 15–30 minutes plus real preparation time
- Beauty/wellness sequence: 15–25 minutes per setup
- Wardrobe change: 10–15 minutes; accessory/top-only change: 5 minutes
- Location reset: 10–20 minutes
- Local travel and parking: use a realistic user-specific estimate, or 30 minutes by default
- Data backup: 20–30 minutes after each half-day
- Contingency: 10–15% of planned shooting time
