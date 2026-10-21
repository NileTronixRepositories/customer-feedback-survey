import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AlertTriangle, CalendarCheck, Clock, FileCheck2, Info } from 'lucide-angular';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon.component';
import { HistoricalAvailability } from '../../models/historical-survey.model';

@Component({
  selector: 'app-historical-availability-card',
  standalone: true,
  imports: [DatePipe, IconComponent, TranslatePipe],
  templateUrl: './historical-availability-card.component.html',
  styleUrl: './historical-availability-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalAvailabilityCardComponent {
  readonly availability = input<HistoricalAvailability | null | undefined>(null);

  readonly calendarCheckIcon = CalendarCheck;
  readonly fileCheckIcon = FileCheck2;
  readonly clockIcon = Clock;
  readonly alertIcon = AlertTriangle;
  readonly infoIcon = Info;
}
