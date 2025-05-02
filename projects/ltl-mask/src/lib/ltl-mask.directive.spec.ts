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
});

const testCreateRules = (mask: RegExp, result: RegExp[][]) => {
  const rules = regexMaskToRules(mask);
  expect(rules.sort()).toEqual(result.sort());
};

const regexMaskToRules = (maskRegex: RegExp): RegExp[][] => {
  let rules: RegExp[][] = [[]];
  const mask = maskRegex.source;
  // номер символа, для которого определяем правило
  let lastIndex = 0;
  let regular: string = '';

  lineTraversal: for (let index = 0; index < mask.length; index++) {
    // опустошаем буферную переменную, если только текущицй символ не {
    if (mask[index] !== '{') {
      regular = '';
    }
    switch (mask[index]) {
      // если слэш
      case '\\':
        // запишем в регулярку
        regular = '\\' + mask[index + 1];
        // и дальше пошли
        index++;
        break;

      case '[':
        regular = '[';
        // пускаем цикл дальше по маске, начиная с символа после [
        getSpec: for (let j = index + 1; j < mask.length; j++) {
          // просто переписываем так содержимое в квадратных скобках
          regular = regular + mask[j];
          // когда скобка закрывается
          if (mask[j] === ']') {
            // основному индексу по маске присваеваем наш временный, чтобы скипнуть квадратные скобки и их содержимое
            index = j;
            break getSpec;
          }
        }
        break;
      // TODO переделать в рекурсию, чтобы корректно обрабатывать {n, m}
      case '{':
        // буферная переменная для числа
        let count = '';
        // количество обязательных повторений (m в {n, m})
        // TODO зачем тут lastIndex
        let requiredCount: number = 1;
        // одно или два числа в {}
        let hasNoRequiredPart = false;
        // уже записанное правило в предыдущий индекс, к которому и шли {}
        // const rule = regular;
        // идем дальше по маске, начиная с символа после {
        getSpec: for (let j = index + 1; j < mask.length; j++) {
          // если попалась запятая, значит в count ужек записано число n
          if (mask[j] === ',') {
            // обязательное кол-во повторений - n
            requiredCount = +count;
            count = '';
            // значит будет необязательная часть еще
            hasNoRequiredPart = true;
            continue getSpec;
          }
          // если дошли по }, значит уже записано m или n
          if (mask[j] === '}') {
            // for (let i = 0; i < +count - 1; i++) {
            // записываем в правила регулярку m раз, начиная с текущего индекса lastIndex
            // this.setRule2(new RegExp(regular), rules);
            // }

            if (!hasNoRequiredPart) requiredCount = +count;
            const copyRulesWithNoRequiredSymbol = () => {
              const newRules: RegExp[][] = [];
              const value = new RegExp(regular);
              rules.forEach((rule: RegExp[], ruleIndex: number) => {
                rules[ruleIndex] = [
                  ...rule,
                  ...new Array(+count - 1).fill(value),
                ];
                const length = rules[ruleIndex].length;
                // Индексы работают для примера i{2,3}g{1,2}
                for (
                  let slicedIndex = +count - requiredCount;
                  slicedIndex > 0;
                  slicedIndex--
                ) {
                  newRules.push(
                    rules[ruleIndex].slice(0, length - slicedIndex)
                  );
                }
              });
              rules = [...rules, ...newRules];
            };
            copyRulesWithNoRequiredSymbol();

            // lastIndex = hasNoRequiredPart
            //   ? lastIndex + requiredCount
            //   : lastIndex + +count - 1;
            // переписываем индекс основного цикла, чтобы пропустить {n, m}
            index = j;
            break getSpec;
          }
          // записываем строчно число в скобках (m или n)
          count = count + mask[j];
        }
        continue lineTraversal;

      // начало строки, просто скип
      case '^':
        continue lineTraversal;
      // конец строки, заканчиваем цикл
      case '$':
        break lineTraversal;
      // если просто символ, запишем в регулярку
      default:
        regular = mask[index];
    }
    if (regular) {
      // присваеваем готовую регулярку для символа lastIndex каждому массиву правил
      // this.setRule(lastIndex, new RegExp(regular), rules);
      setRule2(new RegExp(regular), rules);
      // прибавляем индекс по правилу
      lastIndex++;
    }
  }

  return rules;
};

const setRule2 = (value: RegExp, rules: RegExp[][]) => {
  rules.forEach((rule) => {
    rule.push(value);
  });
};
