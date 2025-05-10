import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DebugElement,
  inject,
} from '@angular/core';
import { LtlMaskDirective } from './ltl-mask.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Простая тестовая компонента
@Component({
  template: `<input [(ngModel)]="model" [mask]="maskValue" />`,
  imports: [ReactiveFormsModule, FormsModule, LtlMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  model = '';
  _cdr = inject(ChangeDetectorRef);
  maskValue: string | RegExp | (string | RegExp)[] = '';
}

describe('inputEventHandling from LtlMaskDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let inputEl: DebugElement;
  let directive: LtlMaskDirective;
  let inputElement: HTMLInputElement;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LtlMaskDirective, TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.directive(LtlMaskDirective));
    fixture.detectChanges();
    directive = inputEl.injector.get(LtlMaskDirective);
    inputElement = inputEl.nativeElement as HTMLInputElement;
  });

  function dispatchInputEvent(
    value: string,
    inputType: string = 'insertText'
  ): boolean {
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: value,
      inputType,
    });
    // true if preventDefault is not invoke
    return inputElement.dispatchEvent(event);
  }

  it('должна быть создана', () => {
    expect(directive).toBeTruthy();
  });

  describe('с маской "00/00/0000"', () => {
    beforeEach(() => {
      fixture.componentInstance.maskValue = '00/00/0000';
      fixture.componentInstance._cdr.detectChanges();
    });

    it('должна позволить ввести только цифры и слэши', () => {
      const valid = dispatchInputEvent('12/05/2024');
      expect(valid).toEqual(true);
    });

    it('должна запретить ввод букв', () => {
      const valid = dispatchInputEvent('12/05/2024a');
      expect(valid).toEqual(false);
    });

    it('не должна записывать значение в input, если его value поменялось скриптово, но значение невалидно', () => {
      component.model = '12/05/2024a';
      expect(inputElement.value).toEqual('');
    });

    it('должна ограничивать длину до 10 символов', () => {
      const valid = dispatchInputEvent('12345678901');// 11 символов
      expect(valid).toEqual(false);
    });
  });

  describe('с маской /\d{2}-\d{0,2}/', () => {
    beforeEach(() => {
      fixture.componentInstance.maskValue = [/\d{2}-\d{0,2}/];
      fixture.componentInstance._cdr.detectChanges();
    });

    it('должна разрешить ввод "12-34"', () => {
      const valid = dispatchInputEvent('12-34');
      expect(valid).toEqual(true);
    });

    it('должна запретить "ab-cd"', () => {
      const valid = dispatchInputEvent('b-cd');
      expect(valid).toEqual(false);
    });

    it('должна запретить изменение шаблона на невалидный символ', () => {
      component.model = '1';
      const valid = dispatchInputEvent('1x-34');
      expect(valid).toEqual(false);
    });
  });

  describe('с массивом регулярных выражений', () => {
    beforeEach(() => {
      fixture.componentInstance.maskValue = [/\d{25}/, /\w{20}/];
      fixture.componentInstance._cdr.detectChanges();
    });

    it('должна разрешить ввод "0000000000000000000000000"', () => {
      // 25 нулей
      const valid = dispatchInputEvent('0000000000000000000000000');
      expect(valid).toEqual(true);
    });
  
    it('не должна разрешить ввод 26 цифр', () => {
      // 25 нулей
      const valid = dispatchInputEvent('00000000000000000000000001');
      expect(valid).toEqual(false);
    });
  
    it('должна разрешить ввод 2 букв и 1 цифры', () => {
      // 25 нулей
      const valid = dispatchInputEvent('aa2');
      expect(valid).toEqual(true);
    });
  
    it('не должна разрешить ввод 21 буквы', () => {
      // 25 нулей
      const valid = dispatchInputEvent('aaaaaaaaaaaaaaaaaaaaa');
      expect(valid).toEqual(false);
    });
  });
});
