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

describe('LtlMaskDirective', () => {
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

  function dispatchInputEvent(value: string, inputType: string = 'insertText') {
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: value,
      inputType,
    });
    inputElement.value = value;
    inputElement.dispatchEvent(event);
    return event;
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
      inputElement.value = '12/05/2024';
      dispatchInputEvent('12/05/2024');
      expect(inputElement.value).toEqual('12/05/2024');
    });

    // it('должна запретить ввод букв', () => {
    //   inputElement.value = '12/05/2024';
    //   const event = dispatchInputEvent('12/05/2024a');
    //   expect(inputElement.value).toEqual('12/05/2024');
    // });
    it('должна запретить ввод букв', () => {
      component.model = '12/05/2024a'
      // const event = dispatchInputEvent('12/05/2024a');
      expect(inputElement.value).toEqual('12/05/2024');
    });

    // it('должна ограничивать длину до 10 символов', () => {
    //   const event = dispatchInputEvent('12345678901'); // 11 символов
    //   expect(event.defaultPrevented).toBeTrue();
    // });
  });

  // describe('с маской [/\\d/, /\\d/, "-", /\\d/, /\\d/]', () => {
  //   beforeEach(() => {
  //     component.maskValue = [/\d/, /\d/, '-', /\d/, /\d/];
  //     fixture.detectChanges();
  //   });

  //   it('должна разрешить ввод "12-34"', () => {
  //     const inputElement = inputEl.nativeElement as HTMLInputElement;
  //     inputElement.value = '12-34';
  //     const event = dispatchInputEvent('12-34');
  //     expect(event.defaultPrevented).toBeFalse();
  //   });

  //   it('должна запретить "ab-cd"', () => {
  //     const event = dispatchInputEvent('ab-cd');
  //     expect(event.defaultPrevented).toBeTrue();
  //   });

  //   it('должна запретить изменение шаблона на невалидный символ', () => {
  //     const inputElement = inputEl.nativeElement as HTMLInputElement;
  //     inputElement.value = '1x-34';
  //     const event = dispatchInputEvent('1x-34');
  //     expect(event.defaultPrevented).toBeTrue();
  //   });
  // });

  // describe('с регулярным выражением', () => {
  //   beforeEach(() => {
  //     component.maskValue = /^[a-zA-Z]{3}$/;
  //     fixture.detectChanges();
  //   });

  //   it('должна разрешить ввод "abc"', () => {
  //     const event = dispatchInputEvent('abc');
  //     expect(event.defaultPrevented).toBeFalse();
  //   });

  //   it('должна запретить "ab1"', () => {
  //     const event = dispatchInputEvent('ab1');
  //     expect(event.defaultPrevented).toBeTrue();
  //   });
  // });
});
