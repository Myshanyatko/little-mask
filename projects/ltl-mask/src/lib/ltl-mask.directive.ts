import {
  Directive,
  effect,
  HostListener,
  inject,
  input,
} from '@angular/core';
import { ILittleMask, LittleMask } from './rules';
import { DefaultValueAccessor } from '@angular/forms';

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
    ? this.validValue(this.littleMask, value)
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
        if (!this.validValue(this.littleMask, fullString)) this.stop(e);
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

  validSymbol(rule: RegExp[], index: number, symbol: string): boolean {
    return rule[index] && rule[index].test(symbol);
  }
}
