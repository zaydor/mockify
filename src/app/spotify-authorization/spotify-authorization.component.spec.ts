import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotifyAuthorizationComponent } from './spotify-authorization.component';

describe('SpotifyAuthorizationComponent', () => {
  let component: SpotifyAuthorizationComponent;
  let fixture: ComponentFixture<SpotifyAuthorizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpotifyAuthorizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotifyAuthorizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
