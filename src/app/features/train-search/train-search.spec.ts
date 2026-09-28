import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainSearch } from './train-search';

describe('TrainSearch', () => {
  let component: TrainSearch;
  let fixture: ComponentFixture<TrainSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
