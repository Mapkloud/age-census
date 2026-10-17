/**
 * One-shot: encrypt any legacy plaintext letter bodies / census values.
 * Safe to re-run (skips values already prefixed with v1:).
 *
 *   npx tsx scripts/encrypt-existing-content.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  decryptCensusValue,
  decryptLetterBody,
  encryptCensusValue,
  encryptLetterBody,
  isEncryptedContent,
} from "../src/lib/crypto/content";

async function main() {
  const prisma = new PrismaClient();
  let letters = 0;
  let answers = 0;

  const rows = await prisma.letter.findMany({
    select: { id: true, body: true, answers: { select: { id: true, key: true, value: true } } },
  });

  for (const letter of rows) {
    if (letter.body && !isEncryptedContent(letter.body)) {
      const plain = decryptLetterBody(letter.id, letter.body);
      await prisma.letter.update({
        where: { id: letter.id },
        data: { body: encryptLetterBody(letter.id, plain) },
      });
      letters += 1;
    }

    for (const answer of letter.answers) {
      if (answer.value && !isEncryptedContent(answer.value)) {
        const plain = decryptCensusValue(letter.id, answer.key, answer.value);
        await prisma.censusAnswer.update({
          where: { id: answer.id },
          data: { value: encryptCensusValue(letter.id, answer.key, plain) },
        });
        answers += 1;
      }
    }
  }

  console.log(`Encrypted ${letters} letter bodies and ${answers} census answers.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
