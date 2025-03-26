import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionDetailComponent } from './reception-detail.component';

describe('ReceptionDetailComponent', () => {
  let component: ReceptionDetailComponent;
  let fixture: ComponentFixture<ReceptionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReceptionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
