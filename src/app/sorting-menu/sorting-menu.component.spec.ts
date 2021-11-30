import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortingMenuComponent } from './sorting-menu.component';

describe('SortingMenuComponent', () => {
  let component: SortingMenuComponent;
  let fixture: ComponentFixture<SortingMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SortingMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SortingMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
