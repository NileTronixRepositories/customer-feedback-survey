import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideIconData } from 'lucide-angular';
import { BackButtonComponent } from '../back-button/back-button.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [BackButtonComponent, IconComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly icon = input<LucideIconData | null>(null);
  readonly showBackButton = input(false);
}
