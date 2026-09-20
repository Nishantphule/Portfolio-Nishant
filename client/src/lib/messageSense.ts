export function isGibberishMessage(message: string) {
  const text = message.trim();
  const words = text.toLowerCase().match(/[a-z]{2,}/g) || [];
  const letters = (text.match(/[a-z]/gi) || []).join('');
  if (!letters) return true;
  if (/(.)\1{4,}/i.test(text)) return true;
  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(text)) return true;

  const vowels = (letters.match(/[aeiouy]/gi) || []).length;
  if (letters.length >= 12 && vowels / letters.length < 0.22) return true;

  const only = words.length === 1 ? words[0] : '';
  if (words.length < 2) {
    if (!only) return true;
    if (only.length >= 14) return true;
    if ((only.match(/[aeiouy]/g) || []).length / only.length < 0.28) return true;
  }
  return false;
}
