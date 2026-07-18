import { normalizeSearchText } from './normalize-search-text';

describe('normalizeSearchText', () => {
  it.each([
    ['g\u00f6zl\u00fck', 'gozluk'],
    ['G\u00d6ZL\u00dcK', 'gozluk'],
    ['gozluk', 'gozluk'],
    ['I\u015eIK', 'isik'],
    ['\u0130STANBUL', 'istanbul'],
    ['\u015eapka \u00c7anta \u00d6rg\u00fc', 'sapka canta orgu'],
    [
      'Ta\u015f\u0131nabilir G\u00fc\u00e7 Bankas\u0131',
      'tasinabilir guc bankasi',
    ],
    ['  fazla\t\n  bo\u015fluk  ', 'fazla bosluk'],
    ['Go\u0308zlu\u0308k', 'gozluk'],
  ])('%j metnini %j olarak normalize eder', (input, expected) => {
    expect(normalizeSearchText(input)).toBe(expected);
  });

  it.each([
    ['g\u00f6zl\u00fck', 'gozluk'],
    ['G\u00d6ZL\u00dcK', 'g\u00f6zl\u00fck'],
    ['\u0131\u015f\u0131k', 'ISIK'],
    ['\u00e7anta', 'CANTA'],
    ['\u00f6rg\u00fc bere', 'ORGU BERE'],
  ])('%j ile %j için aynı arama anahtarını üretir', (left, right) => {
    expect(normalizeSearchText(left)).toBe(normalizeSearchText(right));
  });

  it('boş veya yalnızca boşluk içeren metni boş metne dönüştürür', () => {
    expect(normalizeSearchText('')).toBe('');
    expect(normalizeSearchText(' \t\n ')).toBe('');
  });

  it('rakamları ve noktalama işaretlerini korur', () => {
    expect(normalizeSearchText('USB-C 3.0')).toBe('usb-c 3.0');
  });
});
