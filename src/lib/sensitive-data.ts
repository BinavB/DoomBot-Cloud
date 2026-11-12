const cardNumberPattern = /\b\d(?:[ -]?\d){12,18}\b/g;
const bankAccountPattern = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]){11,30}\b/;

function passesLuhnCheck(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function findSensitiveData(text: string): string | null {
  for (const match of text.matchAll(cardNumberPattern)) {
    const digits = match[0].replace(/\D/g, "");
    if (passesLuhnCheck(digits)) {
      return "card number";
    }
  }
  if (bankAccountPattern.test(text.toUpperCase())) {
    return "bank account number";
  }
  return null;
}
