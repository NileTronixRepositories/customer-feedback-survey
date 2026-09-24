import {
  branchTemplatesPdfReportTemplateKey,
  parseBranchTemplatesPdfReportTemplateKey,
} from './branch-templates-pdf-report.model';

describe('branch templates report template key', () => {
  it('preserves the template id and kind without depending on loaded options', () => {
    const templateKey = branchTemplatesPdfReportTemplateKey({
      id: '4580d91b-de1f-464a-a414-3c789a4a9df2',
      kind: 'Normal',
    });

    expect(parseBranchTemplatesPdfReportTemplateKey(templateKey)).toEqual({
      id: '4580d91b-de1f-464a-a414-3c789a4a9df2',
      kind: 'Normal',
    });
  });

  it('ignores an invalid or empty selection', () => {
    expect(parseBranchTemplatesPdfReportTemplateKey('')).toBeUndefined();
    expect(parseBranchTemplatesPdfReportTemplateKey('Unknown:template-1')).toBeUndefined();
  });
});
