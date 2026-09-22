import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  BadgeQuestionMark,
  Building2,
  ChartSpline,
  ClipboardList,
  FileText,
  FileClock,
  Gauge,
  LayoutDashboard,
  ListTree,
  LucideIconData,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScanQrCode,
  UserCog,
  UsersRound,
} from 'lucide-angular';
import { Role } from '../../shared/models/role.model';
import { AuthStore } from '../../features/auth/presentation/state/auth.store';
import { I18nService } from '../../core/services/i18n.service';
import { BRAND_ASSETS } from '../../core/theme/brand-assets';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface MenuItem {
  labelKey: string;
  superAdminLabelKey?: string;
  path: string;
  icon: LucideIconData;
  roles: readonly Role[];
  feature?:
    | 'templates'
    | 'questionGroups'
    | 'questions'
    | 'globalQuestionGroups'
    | 'globalQuestions'
    | 'anonymousTemplates'
    | 'branchAreas'
    | 'branchUsers'
    | 'surveyDashboard'
    | 'systemReports'
    | 'departmentReports'
    | 'branchDashboard';
  exact?: boolean;
}

const MENU_ITEMS: readonly MenuItem[] = [
  {
    labelKey: 'nav.dashboard',
    superAdminLabelKey: 'nav.branchesDashboard',
    path: '/reports/survey-dashboard',
    icon: LayoutDashboard,
    roles: [],
    feature: 'surveyDashboard',
    exact: true,
  },
  {
    labelKey: 'nav.systemDashboard',
    path: '/reports/system-dashboard',
    icon: Gauge,
    roles: [],
    feature: 'systemReports',
    exact: true,
  },
  {
    labelKey: 'nav.systemResponsesHistory',
    path: '/reports/system-responses',
    icon: FileClock,
    roles: [],
    feature: 'systemReports',
    exact: true,
  },
  {
    labelKey: 'nav.reports',
    path: '/reports/department/dashboard',
    icon: ChartSpline,
    roles: [],
    feature: 'departmentReports',
    exact: true,
  },
  {
    labelKey: 'nav.branchTemplatesPdfReport',
    path: '/branch-admin/reports/templates-pdf',
    icon: FileText,
    roles: [],
    feature: 'branchDashboard',
    exact: true,
  },
  {
    labelKey: 'branchUsers.title',
    path: '/branch-admin/users',
    icon: UsersRound,
    roles: [],
    feature: 'branchUsers',
    exact: true,
  },
  {
    labelKey: 'nav.protectedTemplates',
    path: '/branch-admin/templates',
    icon: FileText,
    roles: ['BRANCH_ADMIN'],
    feature: 'templates',
    exact: true,
  },
  {
    labelKey: 'nav.publicTemplates',
    path: '/anonymous-templates',
    icon: ScanQrCode,
    roles: [],
    feature: 'anonymousTemplates',
    exact: true,
  },
  {
    labelKey: 'questions.title',
    path: '/branch-admin/questions',
    icon: BadgeQuestionMark,
    roles: ['BRANCH_ADMIN'],
    feature: 'questions',
    exact: true,
  },
  {
    labelKey: 'questionGroups.title',
    path: '/branch-admin/question-groups',
    icon: ListTree,
    roles: ['BRANCH_ADMIN'],
    feature: 'questionGroups',
    exact: true,
  },
  {
    labelKey: 'nav.branches',
    path: '/branches',
    icon: Building2,
    roles: ['SUPER_ADMIN'],
  },
  {
    labelKey: 'branchAreas.navTitle',
    path: '/branch-areas',
    icon: UsersRound,
    roles: [],
    feature: 'branchAreas',
    exact: true,
  },
  {
    labelKey: 'nav.templates',
    path: '/templates',
    icon: FileText,
    roles: ['SUPER_ADMIN'],
    exact: true,
  },
  {
    labelKey: 'nav.departments',
    path: '/departments',
    icon: Network,
    roles: ['SUPER_ADMIN'],
  },
  {
    labelKey: 'nav.globalQuestionGroups',
    path: '/global-question-groups',
    icon: ListTree,
    roles: [],
    feature: 'globalQuestionGroups',
  },
  {
    labelKey: 'nav.globalQuestions',
    path: '/global-questions',
    icon: BadgeQuestionMark,
    roles: [],
    feature: 'globalQuestions',
  },
  {
    labelKey: 'nav.surveys',
    path: '/survey',
    icon: ClipboardList,
    roles: [],
  },
  {
    labelKey: 'operators.title',
    path: '/operators',
    icon: UserCog,
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'],
  },
  {
    labelKey: 'operatorTemplates.title',
    path: '/operator/templates',
    icon: FileText,
    roles: ['OPERATOR'],
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly toggle = output<void>();
  readonly close = output<void>();
  readonly brandAssets = BRAND_ASSETS;
  readonly panelLeftCloseIcon = PanelLeftClose;
  readonly panelLeftOpenIcon = PanelLeftOpen;

  private readonly authStore = inject(AuthStore);
  readonly i18n = inject(I18nService);

  readonly menuItems = computed(() => {
    const role = this.authStore.role();
    return MENU_ITEMS.filter(
      (item) => (role !== null && item.roles.includes(role)) || this.canAccessFeature(item.feature),
    ).map((item) =>
      role === 'SUPER_ADMIN' && item.superAdminLabelKey
        ? { ...item, labelKey: item.superAdminLabelKey }
        : item,
    );
  });

  private canAccessFeature(feature: MenuItem['feature']): boolean {
    if (feature === 'templates') {
      return this.authStore.canAccessTemplates();
    }
    if (feature === 'questionGroups') {
      return this.authStore.canAccessQuestionGroups();
    }
    if (feature === 'questions') {
      return this.authStore.canAccessQuestions();
    }
    if (feature === 'globalQuestionGroups') {
      return this.authStore.canAccessGlobalQuestionGroups();
    }
    if (feature === 'globalQuestions') {
      return this.authStore.canAccessGlobalQuestions();
    }
    if (feature === 'anonymousTemplates') {
      return this.authStore.canAccessAnonymousTemplates();
    }
    if (feature === 'branchAreas') {
      return this.authStore.canAccessBranchAreas();
    }
    if (feature === 'branchUsers') {
      return this.authStore.canAccessBranchUsers();
    }
    if (feature === 'surveyDashboard') {
      return this.authStore.canAccessSurveyDashboard();
    }
    if (feature === 'systemReports') {
      return this.authStore.canAccessSystemReports();
    }
    if (feature === 'departmentReports') {
      return this.authStore.canAccessDepartmentReports();
    }
    if (feature === 'branchDashboard') {
      return this.authStore.canAccessBranchDashboard();
    }
    return false;
  }
}
