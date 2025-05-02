import {
  Directive,
  HostListener,
  input,
  OnInit,
} from '@angular/core';

type Rules = RegExp[][];

@Directive({
  selector: '[mask]',
})
export class LtlMaskDirective implements OnInit {
  mask = input.required<string | RegExp | RegExp[]>();

  // 1 левел вложенности - для необязательных символов в маске (например, {n,m})
  // 2 левел вложенности - маска раскладыввется на массив подрегулярок. Порядок важен, по n-индексу лежит правило для n-ого символа вводимой строки
  // 3 левел вложенности - для массива масок (избегаем |)
  rules: Rules = [];
  rulesMap: Map<RegExp[], boolean> | null = null;
  maxLength = 0;

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(e: InputEvent) {
    this.inputEventHandling(e);
  }

  ngOnInit(): void {
    const mm = new Date().getTime();
    this.createRules();
    const newMm = new Date().getTime();
    console.log('время выполнения ' + (newMm - mm));
    console.log(this.mask());
    console.log(this.rules);
  }

  // TODO правила по маске-строке
  stringMaskToRules(mask: string): Rules {
    let rules: Rules = [];
    let lastIndex = 0;
    for (var i = 0; i < mask.length; i++) {
      switch (mask[i]) {
        case '9':
          rules[lastIndex] = [/\d/];
          break;
        case 'a':
          rules[lastIndex] = [/[a-zA-Zа-яА-Я]/];
          break;
        case '?':
          rules[lastIndex] = [/./];
          break;
        case '{':
          let count = '';
          const rule = rules[lastIndex - 1];
          getSpec: for (let j = i + 1; j < mask.length; j++) {
            if (mask[j] === '}') {
              for (let index = 0; index < +count - 1; index++) {
                rules[lastIndex + index] = rule;
              }
              lastIndex = lastIndex + +count - 1;
              i = j;
              break getSpec;
            }
            count = count + mask[j];
          }
          break;
        default:
          break;
      }
      lastIndex++;
    }
    return rules;
  }

  /**
   * Самый важный метод! Перделывает regex в rules
   * @param maskRegex - маска
   * @returns правила
   */

  regexMaskToRules(maskRegex: RegExp): Rules {
    let rules: Rules = [[]];
    const mask = maskRegex.source;
    // номер символа, для которого определяем правило
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
              // если не было m, значит обязательная часть равно n
              if (!hasNoRequiredPart) requiredCount = +count;
              // записываем в правила regular
              rules = this.copyRulesWithNoRequiredSymbol(
                rules,
                regular,
                count,
                requiredCount
              );
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
        this.setRule(new RegExp(regular), rules);
      }
    }

    return rules;
  }

  /**
   * Сетит в rules символ, повторяющийся от n до m раз, раздваивая каждое имеющееся правило
   * @param rules
   * @param regular
   * @param count
   * @param requiredCount
   */
  copyRulesWithNoRequiredSymbol(
    rules: Rules,
    regular: string,
    count: string,
    requiredCount: number
  ): Rules {
    const newRules: Rules = [];
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
  setRule(value: RegExp, rules: Rules) {
    rules.forEach((rule) => {
      rule.push(value);
    });
  }

  createRules() {
    // если маска строка
    if (typeof this.mask() === 'string') {
      // this.rules[0] = this.stringMaskToRules(this.mask() as string);
      return;
    }
    // если маска - массив масок
    if (Array.isArray(this.mask())) {
      // (this.mask() as RegExp[]).forEach(
      //   (mask, index) => (this.rules[index] = this.regexMaskToRules(mask))
      // );
      return;
    }
    // если маска RegExp
    this.rules = this.regexMaskToRules(this.mask() as RegExp);
    this.maxLength = Math.max(...this.rules.map((arr) => arr.length));
    this.rulesMap = new Map(
      this.rules.map((arr): [RegExp[], boolean] => [arr, true])
    );
  }

  getStringBeforeMask(e: InputEvent): string {
    const currentText = (<HTMLInputElement>e.currentTarget)?.value || '';
    const selectionStart = (<HTMLInputElement>e.currentTarget).selectionStart;
    const selectionEnd = (<HTMLInputElement>e.currentTarget).selectionEnd;

    if (selectionStart === null || selectionEnd === null) {
      return '';
    }
    const startStr = currentText.slice(0, selectionStart);
    const writeStr = e.data || '';
    const endStr = currentText.slice(selectionEnd);
    return `${startStr}${writeStr}${endStr}`;
  }

  inputEventHandling(e: InputEvent) {
    switchInput: switch (e.inputType) {
      case 'insertText':
        if (!this.rulesMap) break;
        const selectionStart =
          (<HTMLInputElement>e.currentTarget).selectionStart || 0;
        if (selectionStart < this.maxLength) {
          for (let entry of this.rulesMap) {
            if (entry[1]) {
              if (entry[0][selectionStart] && entry[0][selectionStart].test(e.data as string))
                break switchInput;
            }
          }
          e.stopPropagation();
          e.preventDefault();
        } else {
          e.stopPropagation();
          e.preventDefault();
        }
    }
  }
}
