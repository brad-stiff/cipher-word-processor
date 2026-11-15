/**
 * Map an edit made while viewing ciphertext back to plaintext.
 *
 * The user types plaintext keystrokes into a ciphertext buffer; the browser
 * inserts those raw characters. We splice the same range into the plaintext,
 * then the UI re-encrypts for display so the typed letter becomes its cipher form.
 */
export function plaintextFromEncryptedEdit(
  previousPlain: string,
  previousCipher: string,
  nextCipherView: string,
): string {
  let start = 0;
  const minLen = Math.min(previousCipher.length, nextCipherView.length);
  while (
    start < minLen &&
    previousCipher[start] === nextCipherView[start]
  ) {
    start += 1;
  }

  let endOld = previousCipher.length;
  let endNew = nextCipherView.length;
  while (
    endOld > start &&
    endNew > start &&
    previousCipher[endOld - 1] === nextCipherView[endNew - 1]
  ) {
    endOld -= 1;
    endNew -= 1;
  }

  const inserted = nextCipherView.slice(start, endNew);
  return previousPlain.slice(0, start) + inserted + previousPlain.slice(endOld);
}
