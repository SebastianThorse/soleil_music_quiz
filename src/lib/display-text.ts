// Repair only complete UTF-8 sequences that were decoded as Latin-1/Windows-1252.
// Work per sequence so correctly encoded Swedish, emoji and mixed text survive.
const windows1252 =
  '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ';
const decoder = new TextDecoder('utf-8', { fatal: true });
const byteOf = (character: string): number => {
  const point = character.codePointAt(0)!;
  if (point <= 255) return point;
  const index = windows1252.indexOf(character);
  return index < 0 ? -1 : index + 128;
};

export function displayText(value: string | null | undefined): string {
  let text = value ?? '';
  for (let pass = 0; pass < 2; pass++) {
    const characters = Array.from(text);
    let result = '';
    for (let i = 0; i < characters.length; i++) {
      const first = byteOf(characters[i]);
      // Two-byte repairs only start at Â/Ã (Latin-1 symbols and letters). Other leads
      // are real capitals like Å, Ä and Ö, which are often followed by …, ’ or ”.
      const length =
        first === 194 || first === 195
          ? 2
          : first >= 224 && first <= 239
            ? 3
            : first >= 240 && first <= 244
              ? 4
              : 0;
      const bytes = characters.slice(i, i + length).map(byteOf);
      if (
        length &&
        bytes.length === length &&
        bytes.slice(1).every((b) => b >= 128 && b <= 191)
      ) {
        try {
          result += decoder.decode(new Uint8Array(bytes));
          i += length - 1;
          continue;
        } catch {
          /* An invalid sequence is original text, not a repair candidate. */
        }
      }
      result += characters[i];
    }
    if (result === text) break;
    text = result;
  }
  return text;
}
