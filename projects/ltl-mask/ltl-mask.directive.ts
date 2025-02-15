import { Directive, ElementRef, input, Input, OnInit } from '@angular/core';
import { filter, Subject } from 'rxjs';

@Directive({
  selector: '[mask]',
})
export class LtlMaskDirective implements OnInit {
  mask = input.required<string>();
  regex: RegExp = new RegExp('');
  constructor(private el: ElementRef) {
    this.el.nativeElement.mask = this.mask;
  }

  ngOnInit(): void {
    this.regex = this.maskToRegex(this.mask());
    this.el.nativeElement.addEventListener('beforeinput', (event: InputEvent) =>
      this.onbeforeinput(event)
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
    newRegex = newRegex.replaceAll('9', '\\d');
    newRegex = newRegex.replaceAll('a', '[a-zA-Zа-яА-Я]');
    newRegex = newRegex.replaceAll('?', '\\.');
    newRegex = newRegex.replaceAll('{', '{1,');
    newRegex += '$';
    newRegex = '^' + newRegex;
    console.log(new RegExp(newRegex));
    return new RegExp(newRegex);
  }

  onbeforeinput(e: InputEvent) {
    let nextValue = '';
    switch (e.inputType) {
      case 'insertText':
        nextValue = this.getStringBeforeMask(e);

        console.log(nextValue);
        if (this.regex.test(nextValue)) return;
        e.stopPropagation();
        e.preventDefault();
        return;
      default:
        return;
    }
  }
}
