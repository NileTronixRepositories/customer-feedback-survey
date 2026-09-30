import { Routes } from '@angular/router';
import { GlobalQuestionGroupsService } from './data/global-question-groups.service';
import { GlobalQuestionGroupsStore } from './presentation/state/global-question-groups.store';
import { globalQuestionGroupsAccessGuard } from './presentation/guards/global-question-groups-access.guard';
import { globalQuestionsAccessGuard } from '../global-questions/presentation/guards/global-questions-access.guard';
import { GlobalQuestionsService } from '../global-questions/data/global-questions.service';
import { GlobalQuestionsStore } from '../global-questions/presentation/state/global-questions.store';

export const GLOBAL_QUESTION_GROUPS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [globalQuestionGroupsAccessGuard],
    providers: [GlobalQuestionGroupsService, GlobalQuestionGroupsStore],
    loadComponent: () =>
      import('./presentation/pages/global-question-groups-page/global-question-groups-page.component').then(
        (m) => m.GlobalQuestionGroupsPageComponent,
      ),
  },
  {
    path: ':groupId/questions',
    canActivate: [globalQuestionGroupsAccessGuard, globalQuestionsAccessGuard],
    providers: [GlobalQuestionGroupsService, GlobalQuestionsService, GlobalQuestionsStore],
    loadComponent: () =>
      import(
        '../global-questions/presentation/pages/global-question-create-page/global-question-create-page.component'
      ).then((m) => m.GlobalQuestionCreatePageComponent),
  },
];
