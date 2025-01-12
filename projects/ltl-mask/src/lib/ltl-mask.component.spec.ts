import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LtlMaskComponent } from './ltl-mask.component';

describe('LtlMaskComponent', () => {
  let component: LtlMaskComponent;
  let fixture: ComponentFixture<LtlMaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LtlMaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LtlMaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
