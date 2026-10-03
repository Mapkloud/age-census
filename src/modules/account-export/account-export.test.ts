import { describe, expect, it } from "vitest";
import { buildLetterDataExport, writtenAtForLetter } from "./index";

const birthDate = new Date("1990-06-15T00:00:00.000Z");
const timeZone = "UTC";

describe("writtenAtForLetter", () => {
  it("prefers sealedAt over createdAt", () => {
    const sealedAt = new Date("2020-01-01T12:00:00.000Z");
    const createdAt = new Date("2019-12-01T12:00:00.000Z");
    expect(
      writtenAtForLetter({
        targetAge: 40,
        status: "SEALED",
        body: "hi",
        sealedAt,
        openedAt: null,
        createdAt,
        answers: [],
      }),
    ).toBe(sealedAt);
  });
});

describe("buildLetterDataExport", () => {
  it("exports letter fields, census, age-at-writing, and unlock time", () => {
    const sealedAt = new Date("2020-03-01T10:00:00.000Z");
    const payload = buildLetterDataExport({
      exportedAt: new Date("2020-03-02T00:00:00.000Z"),
      birthDate,
      timeZone,
      letters: [
        {
          targetAge: 40,
          status: "SEALED",
          body: "Dear forty,",
          sealedAt,
          openedAt: null,
          createdAt: new Date("2020-02-01T00:00:00.000Z"),
          answers: [
            { key: "fear", value: "running out of time" },
            { key: "love", value: "quiet mornings" },
            { key: "work", value: "building carefully" },
            { key: "home", value: "a room with a desk" },
            { key: "regret", value: "waiting too long" },
          ],
        },
        {
          targetAge: 35,
          status: "DRAFT",
          body: "draft only",
          sealedAt: null,
          openedAt: null,
          createdAt: new Date("2020-01-15T00:00:00.000Z"),
          answers: [{ key: "fear", value: "draft fear" }],
        },
      ],
    });

    expect(payload.context).toEqual({
      birthDate: "1990-06-15",
      timeZone: "UTC",
    });
    expect(payload.letters.map((row) => row.targetAge)).toEqual([35, 40]);

    const draft = payload.letters[0];
    expect(draft.status).toBe("DRAFT");
    expect(draft.unlockAt).toBeNull();
    expect(draft.census.fear).toBe("draft fear");
    expect(draft.census.love).toBe("");

    const sealed = payload.letters[1];
    expect(sealed.status).toBe("SEALED");
    expect(sealed.body).toBe("Dear forty,");
    expect(sealed.ageAtWriting).toBe(29);
    expect(sealed.unlockAt).toBe(
      new Date("2030-06-15T00:00:00.000Z").toISOString(),
    );
    expect(sealed.census).toMatchObject({
      fear: "running out of time",
      love: "quiet mornings",
    });
  });
});
