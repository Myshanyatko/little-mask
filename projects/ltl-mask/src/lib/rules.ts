import { Aliases, AliasesDict } from './aliases';

export type IRules = {
  rules: RegExp[][];
  maxLengthMask: number;
  usedMaskIndex: number;
};

export class Rules implements IRules {
  rules!: RegExp[][];
  maxLengthMask!: number;
  usedMaskIndex: number = 0;

  constructor(mask: string | RegExp | RegExp[] | string[]) {
    if (!mask) return;
    this.rules = this.rulesFromMask(mask);
    this.maxLengthMask = Math.max(...this.rules.map((arr) => arr.length));
  }

  /**
   * Возвращает правила из маски
   * @param mask - изначально переданная маска
   * @returns Набор правил
   */
  rulesFromMask(mask: string | RegExp | RegExp[] | string[]): RegExp[][] {
    // если маска - массив масок
    if (Array.isArray(mask)) {
      const rules: RegExp[][] = [];
      mask.forEach((mask) => rules.push(...this.maskToRules(mask)));
      return rules;
    }
    // если маска одна
    return this.maskToRules(mask as RegExp);
  }
  /**
   * Самый важный метод! Переделывает regex в rules
   * @param maskRegex - маска
   * @returns правила
   */
  maskToRules(initialMask: RegExp | string): RegExp[][] {
    let rules: RegExp[][] = [[]];
    const isString = typeof initialMask === 'string';
    
    const mask = isString ? initialMask : initialMask.source;
    // номер символа, для которого определяем правило
    let regular: string = '';

    lineTraversal: for (let index = 0; index < mask.length; index++) {
      // опустошаем буферную переменную, если только текущицй символ не {
      if (mask[index] !== '{') {
        regular = '';
      }
      switch (mask[index]) {
        case '\\':
          regular = '\\' + mask[index + 1];
          // пропускаем на один, так как уже считали эторт символ
          index++;
          break;

        case '[':
          [regular, index] = this.regularFromSquareBrackets(index, mask);
          break;

        case '{':
          [rules, index] = this.regularFromBraces(index, mask, rules, regular);
          continue lineTraversal;

        // начало строки, просто скип
        case '^':
          continue lineTraversal;

        // конец строки, заканчиваем обработку маски
        case '$':
          break lineTraversal;

        // если просто символ, запишем в регулярку
        default:
          regular = !isString
            ? mask[index]
            : this.regularFromAlias(mask[index]);
      }

      if (regular) {
        // полученное регулярное выражение для одного символа пушим в каждое правило
        this.setRule(new RegExp(regular), rules);
      }
    }

    return rules;
  }

  /**
   * Переводит элиас в регулярку
   * @param mask - символ маскт
   * @returns строка с соответствующим регулряным выражением
   */
  regularFromAlias(mask: string): string {
    return AliasesDict[mask] || mask;
  }

  /**
   * Возращает правила после считывания количества повторений ({n, m})
   * @param index - номер символа в маске, на котором сейчас происходит обработка
   * @param mask - маска
   * @param rules - правила
   * @param regular - регулярка
   * @returns [новые правила, индекс, на котором закончалось выражение (равно "}")]
   */
  regularFromBraces(
    index: number,
    mask: string,
    rules: RegExp[][],
    regular: string
  ): [RegExp[][], number] {
    let returnedRules: RegExp[][] = [];
    let lastSymbolIndex = index;
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
        // если не было m, значит обязательная часть равно n
        if (!hasNoRequiredPart) requiredCount = +count;
        // записываем в правила regular
        returnedRules = this.copyRulesWithNoRequiredSymbol(
          rules,
          regular,
          count,
          requiredCount
        );
        // переписываем индекс основного цикла, чтобы пропустить {n, m}
        lastSymbolIndex = j;
        break getSpec;
      }
      // записываем строчно число в скобках (m или n)
      count = count + mask[j];
    }
    return [returnedRules, lastSymbolIndex];
  }

  /**
   * Возращает значение в квадратных скобках
   * @param index - номер символа в маске, на котором сейчас происходит обработка
   * @param mask - маска
   * @returns [значение для regular, индекс, на котором закончалось выражение (равно "]")]
   */
  regularFromSquareBrackets(index: number, mask: string): [string, number] {
    let regular = '[';
    let lastSymbolIndex = index;
    // пускаем цикл дальше по маске, начиная с символа после [
    getSpec: for (let j = index + 1; j < mask.length; j++) {
      // просто переписываем так содержимое в квадратных скобках
      regular = regular + mask[j];
      // когда скобка закрывается
      if (mask[j] === ']') {
        // основному индексу по маске присваеваем наш временный, чтобы скипнуть квадратные скобки и их содержимое
        lastSymbolIndex = j;
        break getSpec;
      }
    }
    return [regular, lastSymbolIndex];
  }

  /**
   * Сетит в rules символ, повторяющийся от n до m раз, раздваивая каждое имеющееся правило
   * @param rules
   * @param regular
   * @param count
   * @param requiredCount
   */
  copyRulesWithNoRequiredSymbol(
    rules: RegExp[][],
    regular: string,
    count: string,
    requiredCount: number
  ): RegExp[][] {
    const newRules: RegExp[][] = [];
    const value = new RegExp(regular);
    rules.forEach((rule: RegExp[], ruleIndex: number) => {
      rules[ruleIndex] = [...rule, ...new Array(+count - 1).fill(value)];
      const length = rules[ruleIndex].length;
      for (
        let slicedIndex = +count - requiredCount;
        slicedIndex > 0;
        slicedIndex--
      ) {
        newRules.push(rules[ruleIndex].slice(0, length - slicedIndex));
      }
    });
    return [...rules, ...newRules];
  }

  /**
   * Пушит по символу в каждое правило
   * @param value что нужно записать
   * @param rules куда надо записать
   */
  setRule(value: RegExp, rules: RegExp[][]) {
    rules.forEach((rule) => {
      rule.push(value);
    });
  }
}
