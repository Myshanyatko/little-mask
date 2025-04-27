import {
  computed,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  input,
  Input,
  OnInit,
} from '@angular/core';

type Rules = {
  [key: string]: RegExp[][];
}

@Directive({
  selector: '[mask]',
})

export class LtlMaskDirective implements OnInit {
  mask = input.required<string | RegExp | RegExp[]>();

  // 1 левел вложенности - для необязательных символов в маске (например, {n,m})
  // 2 левел вложенности - маска раскладыввется на массив подрегулярок. Порядок важен, по n-индексу лежит правило для n-ого символа вводимой строки
  // 3 левел вложенности - для массива масок (избегаем |)
  rules: Rules = {};
  
  maxLength = 0;

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(e: InputEvent) {
    this.inputEventHandling(e);
  }

  constructor(private el: ElementRef) {
    this.el.nativeElement.mask = this.mask;
  }

  ngOnInit(): void {
    const mm = new Date().getTime();
    this.createRules();
    const newMm = new Date().getTime();
    console.log('время выполнения ' + (newMm - mm));
    console.log(this.rules);
  }

  // TODO правила по маске-строке
  stringMaskToRules(mask: string): RegExp[][] {
    let rules: RegExp[][] = [];
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
    return [rules];
  }

  // регулярное выражение в массив правил
  regexMaskToRules(maskRegex: RegExp): RegExp[][] {
    const rules: RegExp[][] = [];
    const mask = maskRegex.source;
    let lastIndex = 0;

    lineTraversal: for (let index = 0; index < mask.length; index++) {
      let regular: string = '';
      switch (mask[index]) {
        case '\\':
          regular = '\\' + mask[index + 1];
          index++;
          break;

        case '[':
          regular = '[';
          getSpec: for (let j = index + 1; j < mask.length; j++) {
            regular = regular + mask[j];
            if (mask[j] === ']') {
              index = j;
              break getSpec;
            }
          }
          break;
        // TODO переделать в рекурсию, чтобы корректно обрабатывать {n, m}
        case '{':
          let count = '';
          let requiredCount: number = lastIndex;
          let hasNoRequiredPart = false;
          const rule = rules[lastIndex - 1][rules[lastIndex - 1].length - 1];
          getSpec: for (let j = index + 1; j < mask.length; j++) {
            if (mask[j] === ',') {
              requiredCount = +count;
              count = '';
              hasNoRequiredPart = true;
              continue getSpec;
            }
            if (mask[j] === '}') {
              for (let i = 0; i < +count - 1; i++) {
                this.setRule(lastIndex + i, rule, rules);
              }
              lastIndex = hasNoRequiredPart ? lastIndex + requiredCount : lastIndex + +count - 1;
              index = j;
              break getSpec;
            }
            count = count + mask[j];
          }
          continue lineTraversal;

        case '^':
          continue lineTraversal;
        case '$':
          break lineTraversal;
        default:
          regular = mask[index];
      }
      if (regular) {
        this.setRule(lastIndex, new RegExp(regular), rules);
        lastIndex++;
      }
    }

    return rules;
  }

  createRules() {
    // если маска строка
    if (typeof this.mask() === 'string') {
      this.rules[0] = this.stringMaskToRules(this.mask() as string);
      return;
    }
    // если маска - массив масок
    if (Array.isArray(this.mask())) {
      (this.mask() as RegExp[]).forEach((mask, index) =>
        this.rules[index] = this.regexMaskToRules(mask)
      );
      return;
    }
    // если маска RegExp
    this.rules[0] = this.regexMaskToRules(this.mask() as RegExp);
  }

  setRule(index: number, value: RegExp, rules: RegExp[][]) {
    const rule = rules[index];
    if (!rule) rules[index] = [value];
    else rules[index].push(value);
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

  // maskToRegex(mask: string): RegExp {
  //   let newRegex = mask;

  //   // TODO не заменять, не оптимально
  //   newRegex = newRegex.replaceAll('9', '\\d');
  //   newRegex = newRegex.replaceAll('a', '[a-zA-Zа-яА-Я]');
  //   newRegex = newRegex.replaceAll('?', '.');
  //   newRegex = newRegex.replaceAll('{', '{1,');
  //   // newRegex += '$';
  //   // newRegex = '^' + newRegex;
  //   return new RegExp(newRegex);
  // }

  inputEventHandling(e: InputEvent) {
    // let nextValue = '';
    switch (e.inputType) {
      case 'insertText':
        // nextValue = this.getStringBeforeMask(e);

        // console.log(nextValue);
        // if (nextValue.match(this.regexMask())) return;
        // if (this.regexMask().test(nextValue)) return;
        const selectionStart =
          (<HTMLInputElement>e.currentTarget).selectionStart || 0;
        if (selectionStart < Math.max(Object.values(this.rules).map(elem => elem.length))) {
          
          loopCheck: for (const rules of this.rules) {
            if (!rules?.[selectionStart]) {
              continue loopCheck;
            }
            for (const reg of rules?.[selectionStart]) {
              if (reg.test(e.data as string)) return;
            }
          }
        }
        e.stopPropagation();
        e.preventDefault();
        return;
      default:
        return;
    }
  }
}
