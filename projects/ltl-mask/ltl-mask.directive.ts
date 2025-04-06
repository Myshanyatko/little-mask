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
import { filter, Subject } from 'rxjs';

@Directive({
  selector: '[mask]',
})
export class LtlMaskDirective implements OnInit {
  mask = input.required<string>();
  regexMask = computed(() => this.maskToRegex(this.mask()));
  lastIndex: RegExp[] = [];
  rules: RegExp[][] = [];

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(e: InputEvent) {
    this.inputEventHandling(e);
  }

  constructor(private el: ElementRef) {
    this.el.nativeElement.mask = this.mask;
  }

  ngOnInit(): void {
    // this.el.nativeElement.addEventListener('beforeinput', (event: InputEvent) =>
    //   this.onbeforeinput(event)
    // );
    this.govno2();
  }

  // ^\d.{2}
  govno2() {
    const mask = this.regexMask().source;
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
        case '{':
          let count = '';
          let requiredCount: number = lastIndex;
          const rule =
            this.rules[lastIndex - 1][this.rules[lastIndex - 1].length - 1];
          getSpec: for (let j = index + 1; j < mask.length; j++) {
            if (mask[j] === ',') {
              requiredCount = +count;
              count = '';
              continue getSpec;
            }
            if (mask[j] === '}') {
              for (let i = 0; i < +count - 1; i++) {
                this.setRule(lastIndex + i, rule);
              }
              lastIndex += requiredCount;
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
        this.setRule(lastIndex, new RegExp(regular));
        lastIndex++;
      }
    }
  }

  setRule(index: number, value: RegExp) {
    const rule = this.rules[index];
    if (!rule) this.rules[index] = [value];
    else this.rules[index].push(value);
  }

  readRuleAsOneSymbol(mask: string) {}

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

  maskToRegex(mask: string): RegExp {
    let newRegex = mask;
    // for (var i = 0; i < mask.length; i++) {
    //   switch (mask[i]) {
    //     case '9':
    //       newRegex += '\\d';
    //       break;
    //     case 'a':
    //       newRegex += '[a-zA-Zа-яА-Я]';
    //       break;
    //     case '?':
    //       newRegex += '\\.';
    //       break;
    //     case '{':
    //       const nextSymbol = mask[i+1];
    //       newRegex += `{${nextSymbol}}`;
    //       break;
    //     default:
    //       break;
    //   }
    // }
    // TODO не заменять, не оптимально
    newRegex = newRegex.replaceAll('9', '\\d');
    newRegex = newRegex.replaceAll('a', '[a-zA-Zа-яА-Я]');
    newRegex = newRegex.replaceAll('?', '.');
    newRegex = newRegex.replaceAll('{', '{1,');
    // newRegex += '$';
    // newRegex = '^' + newRegex;
    return new RegExp(newRegex);
  }

  inputEventHandling(e: InputEvent) {
    let nextValue = '';
    switch (e.inputType) {
      case 'insertText':
        nextValue = this.getStringBeforeMask(e);

        console.log(nextValue);
        // if (nextValue.match(this.regexMask())) return;
        // if (this.regexMask().test(nextValue)) return;
        const selectionStart = (<HTMLInputElement>e.currentTarget)
          .selectionStart;
        for (const reg of this.rules[selectionStart || 0]) {
          if (reg.test(e.data as string)) break;
          e.stopPropagation();
          e.preventDefault();
        }
        return;
      default:
        return;
    }
  }
}
