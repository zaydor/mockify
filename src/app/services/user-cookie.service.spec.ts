import { TestBed } from '@angular/core/testing';

import { UserCookieService } from './user-cookie.service';

describe('UserCookieService', () => {
  let service: UserCookieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserCookieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
