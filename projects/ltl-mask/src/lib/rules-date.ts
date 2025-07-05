import { AliasesDict } from './aliases';
import { ILittleMaskSeparately, TLtlPlainMask } from './ltl-mask.interface';
import { ILittleMask } from './rules';



export class LittleMaskSeparately {

  private validators: Map<number[], RegExp[][]> = new Map<number[], RegExp[][]>;

  constructor(mask: ILittleMaskSeparately<TLtlPlainMask>) {
    if (!mask) return;
    this.setValidators(mask);
  }

  validValue(fullString: string,): boolean {
    // const dateMask = {
    //   validators: {
    //     0: [
    //       [/0/, /[1-9]/],
    //       [/1/, /[0-9]/],
    //       [/2/, /[0-9]/],
    //       [/3/, /[0-1]/],
    //     ],
    //     1: [
    //       [/0/, /[1-9]/],
    //       [/1/, /[0-2]/]
    //     ],
    //     2: [
    //       [/\d/, /\d/, /\d/, /\d/]
    //     ]
    //   }, mask: '0-1-2'

    // };
    return this.validSymbolDateMask(fullString, this.validators)
    // } 

  }

  // private validSymbolDateMak(rule: RegExp[][], index: number, symbol: string, mask: string): boolean {
  //   for (let j = 0; j < rule.length; j++) {
  //     const currentRule = rule[j][index];
  //     if (currentRule && currentRule.test(symbol) ? true : mask[index] === symbol)
  //       return true;
  //   }
  //   return false;
  // }



  private validSymbolDateMask(fullString: string, validators: Map<number[], RegExp[][]>): boolean {
    for (let index = 0; index < fullString.length; index++) {
      const currentValidatorKey = Array.from(validators.keys()).find(elem => elem.includes(index))
      if (!currentValidatorKey) return false;
      let subString = '';
      let currentIndexForMask = 0;
      iteratorForSubstring: for (let j of currentValidatorKey) {
        if (fullString[j]) {
          subString += fullString[j];
          currentIndexForMask = j;
        } else {
          currentIndexForMask = j;
          break iteratorForSubstring;
        }
      }
      index = currentIndexForMask;
      const currentValidator = validators.get(currentValidatorKey);
      if (!this.validValueXZ({ rules: currentValidator ?? [], maxLengthMask: currentValidator?.[0].length || 0 }, subString)) {
        return false;
      }
    }
    return true;

  }

  // TODO
  // if (i === this.littleMask.usedMaskIndex) continue;
  // const curElement = this.littleMask.rules[i][selectionStart];
  // if (curElement && curElement.test(e.data as string)) {
  private validValueXZ(rules: ILittleMask, fullString: string): boolean {
    if (!rules) true;
    if (fullString.length > rules.maxLengthMask) return false;
    iteratorForRules: for (let i = 0; i < rules.rules.length; i++) {
      for (let j = 0; j < fullString.length; j++) {
        if (!this.validSymbol(rules.rules[i], j, fullString[j])) {
          continue iteratorForRules;
        }
      }
      rules.usedMaskIndex = i;
      return true;
    }
    return false;
  }

  private validSymbol(rule: RegExp[], index: number, symbol: string): boolean {
    return rule[index] && rule[index].test(symbol);
  }

  // TODO надо ли
  //  getValidatorsGroup(index: number, mask: { validators: { [key: string]: RegExp[][] }, mask: string }): RegExp[][] {
  //   const map1: Map<number[], RegExp[][]> = new Map();
  //   Object.entries(mask.validators).forEach((value: [string, RegExp[][]]) => { map1.set(this.getIndexes(value[0], mask.mask), value[1]) });
  //   const entry = Array.from(map1.entries()).find(elem => elem[0].includes(index));
  //   return entry ? entry[1] : [];
  // }

  // getIndexes(key: string, mask: string): number[] {
  //   const indexes = [];
  //   for (let i = 0; i < mask.length; i++) {
  //     if (mask[i] === key) {
  //       indexes.push(i);
  //     }
  //   }
  //   return indexes;
  // }
  /**
   * Возвращает правила из маски
   * @param mask - изначально переданная маска
   * @returns Набор правил
   */
  private rulesFromValidators(validator: TLtlPlainMask): RegExp[][] {
    let rules: RegExp[][] = [];
    if (Array.isArray(validator)) {
      validator.forEach((mask) => rules.push(...this.maskToRules(mask)));
    } else {
      rules = this.maskToRules(validator);
    }
    return rules;
  }

  /**
   * Самый важный метод! Переделывает regex в rules
   * @param maskRegex - маска
   * @returns правила
   */
  private maskToRules(initialMask: RegExp | string): RegExp[][] {
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
  private regularFromAlias(mask: string): string {
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
  private regularFromBraces(
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
  private regularFromSquareBrackets(index: number, mask: string): [string, number] {
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
  private copyRulesWithNoRequiredSymbol(
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
  private setRule(value: RegExp, rules: RegExp[][]) {
    rules.forEach((rule) => {
      rule.push(value);
    });
  }

  private setValidators(dateMask: ILittleMaskSeparately<TLtlPlainMask>) {
    let currentIndexForMask = 0;
    for (let i = 0; i < dateMask.mask.length; i++) {
      const currentValidator = dateMask.validators[dateMask.mask[i]];
      if (!currentValidator) {
        // TODO придумать что-тол поумнее чем new RegExp(`\\${dateMask.mask[i]}`), это чтобы символы не воспринимались как спец символы
        this.validators.set([currentIndexForMask], [[new RegExp(`\\${dateMask.mask[i]}`)]]);
        currentIndexForMask++;
      }
      else {
        let rules: RegExp[][] = this.rulesFromValidators(currentValidator);
        const indexesArray = this.getIndexesArray(rules, currentIndexForMask);
        this.validators.set(indexesArray, rules);
        currentIndexForMask = (indexesArray.at(-1) || i) + 1;

      }
    };
  }

  private getIndexesArray(currentValidator: RegExp[][], index: number): number[] {
    const maxLength = currentValidator[0].length;
    const indexesArray = [];
    for (let j = index; j < index + maxLength; j++) {
      indexesArray.push(j)
    }
    return indexesArray;
  }

  private blyatFunc(dateMask: { validators: { [key: string]: RegExp[][] }, mask: string }): Map<number[], RegExp[][]> {
    const map1: Map<number[], RegExp[][]> = new Map();
    let currentIndexForMask = 0;
    for (let i = 0; i < dateMask.mask.length; i++) {
      const currentValidator = dateMask.validators[dateMask.mask[i]];
      if (!currentValidator) {
        map1.set([currentIndexForMask], [[new RegExp(dateMask.mask[i])]]);
        currentIndexForMask++;
      }
      else {
        const indexesArray = this.getIndexesArray(currentValidator, currentIndexForMask);
        map1.set(indexesArray, currentValidator);
        currentIndexForMask = (indexesArray.at(-1) || i) + 1;

      }
    };
    return map1;
  }
}
