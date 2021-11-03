import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistInfoDialogComponent } from './playlist-info-dialog.component';

describe('PlaylistInfoDialogComponent', () => {
  let component: PlaylistInfoDialogComponent;
  let fixture: ComponentFixture<PlaylistInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlaylistInfoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
