import { Rules } from './rules';

describe('LtlMaskDirective', () => {
  it('should make rules from mask', () => {
    const mask = /i{2,3}g{1,2}/;
    const expectRules = [
      [/i/, /i/, /i/, /g/, /g/],
      [/i/, /i/, /g/, /g/],
      [/i/, /i/, /i/, /g/],
      [/i/, /i/, /g/],
    ];
    testCreateRules(mask, expectRules);
  });
  it('should make rules from mask', () => {
    const mask = /\d{3}\w{3}/;
    const expectRules = [[/\d/, /\d/, /\d/, /\w/, /\w/, /\w/]];
    testCreateRules(mask, expectRules);
  });
  it('should make rules from mask', () => {
    const mask = /\d{1,2}\w{2}\s{3,5}/;
    const expectRules = [
      [/\d/, /\w/, /\w/, /\s/, /\s/, /\s/, /\s/, /\s/],
      [/\d/, /\d/, /\w/, /\w/, /\s/, /\s/, /\s/, /\s/, /\s/],
      [/\d/, /\d/, /\w/, /\w/, /\s/, /\s/, /\s/, /\s/],
      [/\d/, /\w/, /\w/, /\s/, /\s/, /\s/],
      [/\d/, /\d/, /\w/, /\w/, /\s/, /\s/, /\s/],
      [/\d/, /\w/, /\w/, /\s/, /\s/, /\s/, /\s/],
    ];
    testCreateRules(mask, expectRules);
  });
  it('should make rules from mask', () => {
    const mask = [/\d{25}/, /\w{20}/];
    const expectRules = [
      [
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        /\d/,
      ],
      [
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
        /\w/,
      ],
    ];
    testCreateRules(mask, expectRules);
  });
  it('should make rules from mask', () => {
    const mask = ['00', 'aaa', '???'];
    const expectRules = [
      [/\d/, /\d/],
      [/[A-Za-zА-Яа-я]/, /[A-Za-zА-Яа-я]/, /[A-Za-zА-Яа-я]/],
      [/./, /./, /./],
    ];
    testCreateRules(mask, expectRules);
  });
});

// переделать на проверку значений
const testCreateRules = (
  mask: string | RegExp | RegExp[] | string[],
  result: RegExp[][]
) => {
  const rules = new Rules(mask);
  expect(rules.rules.sort()).toEqual(result.sort());
};
