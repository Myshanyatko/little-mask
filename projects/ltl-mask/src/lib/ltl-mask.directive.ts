import { Directive, HostListener, input, OnInit } from '@angular/core';
import { IRules, Rules } from './rules';

@Directive({
  selector: '[mask]',
})
export class LtlMaskDirective implements OnInit {
  mask = input.required<string | RegExp | RegExp[] | string[]>();

  rules: IRules | null = null;


  @HostListener('beforeinput', ['$event'])
  onBeforeInput(e: InputEvent) {
    this.inputEventHandling(e);
  }

  ngOnInit(): void {
    const mm = new Date().getTime();
    this.rules = new Rules(this.mask());
    const newMm = new Date().getTime();
    console.log('время выполнения ' + (newMm - mm));
    console.log(this.mask());
    console.log(this.rules);
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
        const fullString = (e?.currentTarget as HTMLInputElement)?.value;

        if (!this.rules) break;
        const selectionStart =
          (<HTMLInputElement>e.currentTarget).selectionStart || 0;
        if (fullString.length < this.rules.maxLengthMask) {
          if (
            this.rules.rules[this.rules.usedMaskIndex][selectionStart] &&
            this.rules.rules[this.rules.usedMaskIndex][selectionStart].test(
              e.data as string
            )
          ) {
            return;
          } else {
            iteratorForOtherRules: for (let i = 0; i < this.rules.rules.length; i++) {
              if (i === this.rules.usedMaskIndex) continue;
              const curElement = this.rules.rules[i][selectionStart];
              if (curElement && curElement.test(e.data as string)) {
                for (let j = 0; j < fullString.length; j++) {
                  if (!this.rules.rules[i][j].test(fullString[j])) {
                    continue iteratorForOtherRules;
                  }
                }
                this.rules.usedMaskIndex = i;
                return;
              }
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
