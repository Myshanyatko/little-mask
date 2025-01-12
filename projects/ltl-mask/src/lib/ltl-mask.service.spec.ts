import { TestBed } from '@angular/core/testing';

import { LtlMaskService } from './ltl-mask.service';

describe('LtlMaskService', () => {
  let service: LtlMaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LtlMaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
