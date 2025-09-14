import { Directive,
    effect,
    HostListener,
    inject,
    input,
    ViewContainerRef } from '@angular/core';
import { DefaultValueAccessor } from '@angular/forms';
import { LittleMask } from './rules';
import { ILittleMaskSeparately,
    TLtlMaskInput,
    TLtlPlainMask } from './ltl-mask.interface';
import { LittleMaskSeparately } from './rules-date';
// TODO
// Маска для дат работает, она перенесена в отдельный класс LittleMaskSeparately
// Нужно проверить, не слетели ли обычные маски
// Сделать рефакторинг класса LittleMaskSeparately - переименовать методы, убрать лишние, отнаследоваться от общего класса, чтобы не дублировались методы с классом LittleMask
@Directive({
    selector: '[mask]',
    standalone: true,
})
export class LtlMaskDirective {
    mask = input.required<TLtlMaskInput>();
    placeholder = input<string>();
    private littleMask!: LittleMaskSeparately | LittleMask;
    private inputElement = inject(ViewContainerRef);

    constructor() {
        // для обработки скриптового изменения value. (украдено с maskito)
        this.setWriteValueFn();
        effect(() => {
            const mask = this.mask();
            if ((mask as ILittleMaskSeparately<TLtlPlainMask>).validators)
                this.littleMask = new LittleMaskSeparately(mask as ILittleMaskSeparately<TLtlPlainMask>);
            else this.littleMask = new LittleMask(mask as TLtlPlainMask);
        });
    }

    @HostListener('beforeinput', ['$event'])
    onBeforeInput(e: InputEvent) {
        this.inputEventHandling(e);
    }

    @HostListener('input', ['$event'])
    onInput(e: InputEvent) {
        this.writeStaticSeparator(e);
    }

    private writeStaticSeparator(e: InputEvent) {
        const currentPosition: number | null = (<HTMLInputElement>e.currentTarget).selectionEnd;
        if (e.data && typeof currentPosition === 'number') {
            const symbolMaskNextPositionStatic = (this.littleMask as LittleMaskSeparately).nextSymbolSeparator(
                currentPosition
            );
            if (symbolMaskNextPositionStatic) {
                const value = (this.inputElement.element.nativeElement as HTMLInputElement).value;
                const newValue =
                    value.slice(0, currentPosition) + symbolMaskNextPositionStatic + value.slice(currentPosition);
                (this.inputElement.element.nativeElement as HTMLInputElement).value = newValue;
            }
        }
    }

    private setWriteValueFn() {
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

    private newValue(value: string): string {
        return value && this.mask() ? (this.littleMask.validValue(value) ? value : '') : value;
    }

    private inputEventHandling(e: InputEvent) {
        if (!this.littleMask) return;
        const target = e?.currentTarget as HTMLInputElement;
        const selectionStart = (<HTMLInputElement>e.currentTarget).selectionStart || 0;
        const selectionEnd = (<HTMLInputElement>e.currentTarget).selectionEnd || 0;
        const fullString = target.value.slice(0, selectionStart) + (e.data || '') + target.value.slice(selectionEnd);
        // TODO протестировать на всех типах
        switch (e.inputType) {
        default:
            if (!this.littleMask.validValue(fullString)) this.stop(e);
        }
    }

    private stop(e: InputEvent) {
        e.stopPropagation();
        e.preventDefault();
    }
}
