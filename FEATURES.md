# Age Census features

The product is a yearly rite, not a letter scheduler. Home is a map of **ages**. Email is a backup, not the product.

## v1 (building now)

### Identity
- Email magic-link sign-in (email is how we find you in 10–20 years)
- Birth date required — current age and unlocks are computed from it
- Timezone required — defines the calendar year for the stamp and the birthday for unlocks
- Birth date locks after the first sealed letter so age cannot be gamed

### Age map (home)
- Home is future ages, not a date picker
- Milestone chairs: 30, 35, 40, 50, 60, 70, 80, plus any custom target already written
- Chair states: empty, sealed (waiting), unlocked (ready to open), opened
- Cannot address current age or any past age

### Yearly stamp
- Exactly one stamp per calendar year in the user’s timezone
- Stamp is spent when a letter is **sealed**, not when a draft is saved
- Unused stamp expires at year end — missing the year is part of the product
- No seal without a stamp

### Census + letter
- Five questions that never silently change (versioned set): **fear, love, work, home, regret**
- Plus one free-form letter to the chosen age
- Drafts allowed until seal
- Seal is irreversible: no peek, no edit, no delete of content
- Target is an integer age, not a calendar date

### Unlock + comparison
- A letter to age N unlocks on the birthday the user turns N
- Opening happens in-app as an unseal
- Comparison view: that year’s answers beside every earlier census for the same questions

## Later (do not treat as v1 scope)

- Change-email flow with verification
- Export my data; delete account
- Yearly reminder: you still have a stamp
- Email backup: notify + deep link when a chair unlocks
- Reminder ~30 days before unlock if email may have gone stale

## Out of v1

- Native iOS/Android
- Voice, photos, physical mail
- Reply-to-past-self thread
- Public or generation feed
- AI writing help

## First vertical slice

Create account → see map → seal one letter → stamp is spent.
