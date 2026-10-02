# Age Census features

The product is a rite of addressing future ages, not a letter scheduler. Home is a map of **ages**. Email is a backup, not the product.

## v1 (building now)

### Identity
- Email magic-link sign-in (email is how we find you in 10–20 years)
- Birth date required — current age and unlocks are computed from it
- Timezone required — defines the birthday for unlocks
- Birth date locks after the first sealed letter so age cannot be gamed

### Age map (home)
- Home is future ages, not a date picker
- Milestone chairs: 30, 35, 40, 50, 60, 70, 80, plus any custom target already written
- Chair states: empty, sealed (waiting), unlocked (ready to open), opened
- Cannot address current age or any past age

### Seals
- Unlimited seals per calendar year — there is no yearly stamp quota
- Constraint: **one sealed letter per future age**
- Example: in the same year a user may seal letters to 40, 50, 60, and 70
- Once a letter is sealed to 70, they cannot seal another to 70
- Drafts to an age that already has a sealed letter are not sealable
- One draft per age is fine until sealed
- Seal is spent on that age, not on the year — unused years do not expire a right to write

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
- Optional reminder about unsealed drafts
- Email backup: notify + deep link when a chair unlocks
- Reminder ~30 days before unlock if email may have gone stale

## Out of v1

- Native iOS/Android
- Voice, photos, physical mail
- Reply-to-past-self thread
- Public or generation feed
- AI writing help

## First vertical slice

Create account → see map → seal letters to several future ages in one year (e.g. 40, 50, 60, 70) → a second seal to 70 is blocked.
