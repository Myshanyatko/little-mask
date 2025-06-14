import {
  Directive,
  effect,
  HostListener,
  inject,
  input,
} from '@angular/core';
import { ILittleMask, LittleMask } from './rules';
import { DefaultValueAccessor } from '@angular/forms';
import { findIndex } from 'rxjs';

@Directive({
  selector: '[mask]',
  standalone: true,
})
export class LtlMaskDirective {
  mask = input.required<string | RegExp | RegExp[] | string[]>();
  private littleMask!: ILittleMask;

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(e: InputEvent) {
    this.inputEventHandling(e);
  }

  constructor() {
    // для обработки скриптового изменения value. (украдено с maskito)
    this.setWriteValueFn();
    effect(() => {
      this.littleMask = new LittleMask(this.mask());
    });
  }

  setWriteValueFn() {
    const accessor = inject(DefaultValueAccessor, {
      self: true,
      optional: true,
    });
    if (accessor) {
      const original = accessor.writeValue.bind(accessor);
      accessor.writeValue = (value: string) => {
        original(this.newValue(value));
      };
    }
  }


  newValue(value: string): string {
    return value && this.mask()
      ? this.validValueForDate(this.littleMask, value)
        ? value
        : ''
      : value;
  }

  inputEventHandling(e: InputEvent) {
    if (!this.littleMask) return;
    const target = e?.currentTarget as HTMLInputElement;
    const selectionStart =
      (<HTMLInputElement>e.currentTarget).selectionStart || 0;
    const selectionEnd = (<HTMLInputElement>e.currentTarget).selectionEnd || 0;
    const fullString =
      target.value.slice(0, selectionStart) +
      (e.data || '') +
      target.value.slice(selectionEnd);
    // TODO протестировать на всех типах
    switch (e.inputType) {
      default:
        if (!this.validValueForDate(this.littleMask, fullString)) this.stop(e);
    }
  }

  stop(e: InputEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  // TODO
  // if (i === this.littleMask.usedMaskIndex) continue;
  // const curElement = this.littleMask.rules[i][selectionStart];
  // if (curElement && curElement.test(e.data as string)) {
  validValue(rules: ILittleMask, fullString: string): boolean {
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

  validValueForDate(rules: ILittleMask, fullString: string,): boolean {
    const dateMask = {
      validators: {
        0: [
          [/0/, /[1-9]/],
          [/1/, /[0-9]/],
          [/2/, /[0-9]/],
          [/3/, /[0-1]/],
        ],
        1: [
          [/0/,  /[1-9]/],
          [/1/, /[0-2]/]
        ],
        2: [
          [/\d/, /\d/, /\d/, /\d/]
        ]
      }, mask: '0-1-2'

    };
    // 0 1 2
    // iteratorForRules: for (let i = 0; i < Object.keys(dateMask.validators).length; i++) {
    // 
    // for (let j = 0; j < fullString.length; j++) {
    //   if (!this.validSymbolDateMask2(this.getValidatorsGroup(j, dateMask), j, fullString[j], dateMask.mask)) {
    //     return false;
    //   }
    // }
    // return true;
    return this.validSymbolDateMask2(fullString,this.blyatFunc(dateMask) )
    // }

  }

  validSymbolDateMask2(fullString: string, validators: Map<number[], RegExp[][]>): boolean {
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
      if (!this.validValue({ rules: currentValidator ?? [], maxLengthMask: currentValidator?.[0].length || 0, usedMaskIndex: 0 }, subString)) {
        return false;
      }
    }
    return true;

  }

  getValidatorsGroup(index: number, mask: { validators: { [key: string]: RegExp[][] }, mask: string }): RegExp[][] {
    const map1: Map<number[], RegExp[][]> = new Map();
    Object.entries(mask.validators).forEach((value: [string, RegExp[][]]) => { map1.set(this.getIndexes(value[0], mask.mask), value[1]) });
    const entry = Array.from(map1.entries()).find(elem => elem[0].includes(index));
    return entry ? entry[1] : [];
  }

  getIndexes(key: string, mask: string): number[] {
    const indexes = [];
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === key) {
        indexes.push(i);
      }
    }
    return indexes;
  }

  blyatFunc(dateMask: { validators: { [key: string]: RegExp[][] }, mask: string }): Map<number[], RegExp[][]> {
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

  getIndexesArray(currentValidator: RegExp[][], index: number): number[] {
    const maxLength = currentValidator[0].length;

    const indexesArray = [];
    for (let j = index; j < index + maxLength; j++) {
      indexesArray.push(j)
    }
    return indexesArray;
  }

  validSymbol(rule: RegExp[], index: number, symbol: string): boolean {
    return rule[index] && rule[index].test(symbol);
  }

  validSymbolDateMak(rule: RegExp[][], index: number, symbol: string, mask: string): boolean {
    for (let j = 0; j < rule.length; j++) {
      const currentRule = rule[j][index];
      if (currentRule && currentRule.test(symbol) ? true : mask[index] === symbol)
        return true;
    }
    return false;
  }
}
