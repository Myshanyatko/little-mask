import { Directive, effect, HostListener, input } from '@angular/core';
import { IRules, Rules } from './rules';

@Directive({
  selector: '[mask]',
})
export class LtlMaskDirective {
  mask = input.required<string | RegExp | RegExp[] | string[]>();
  value = input<string>('');
  rules: IRules | null = null;

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(e: InputEvent) {
    this.inputEventHandling(e);
  }

// TODO ПРОБЛЕМА - ОТСЛЕДИТЬ ИЗМЕНЕНИЕ ЗНАЧЕНИЯ СКРИПТОВО ЧЕРЕЗ ДВУСТОРОННЮЮ ПРИВЯЗКУ
  constructor() {
    effect(() => {
      this.rules = new Rules(this.mask());
      console.log('effect' + this.rules.rules);
    });
  }


  inputEventHandling(e: InputEvent) {
    console.log(e.inputType);
    
    if (!this.rules) return;
    const target = (e?.currentTarget as HTMLInputElement);
    let fullString = '';
    const selectionStart = (<HTMLInputElement>e.currentTarget).selectionStart || 0;
    const selectionEnd = (<HTMLInputElement>e.currentTarget).selectionEnd || 0;
    fullString = target.value.slice(0, selectionStart) + (e.data || '') + target.value.slice(selectionEnd)
    // TODO протестировать на всех типах
    switch (e.inputType) {
        default: 
        this.stopIfNotMatchFullString(e, fullString);
    }
  }

  stopIfNotMatchFullString(
    e: InputEvent,
    fullString: string
  ): void {
    if (!this.rules) return;
    if (fullString.length <= this.rules.maxLengthMask) { 
        iteratorForOtherRules: for (let i = 0; i < this.rules.rules.length; i++) {
          // TODO
          // if (i === this.rules.usedMaskIndex) continue;
          // const curElement = this.rules.rules[i][selectionStart];
          // if (curElement && curElement.test(e.data as string)) {
            for (let j = 0; j < fullString.length; j++) {
              if (!this.rules.rules[i][j] || !this.rules.rules[i][j].test(fullString[j])) {
                continue iteratorForOtherRules;
              }
            }
            this.rules.usedMaskIndex = i;
            return;
          // }
        }
      e.stopPropagation();
      e.preventDefault();
    } else {
      e.stopPropagation();
      e.preventDefault();
    }
  }
}
