import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.body.removeAttribute('lang');
    document.body.removeAttribute('dir');
    TestBed.configureTestingModule({});
  });

  it('restores Arabic and applies RTL to the whole document', () => {
    localStorage.setItem('cfs_language', 'ar');

    const service = TestBed.inject(I18nService);
    const pageDocument = TestBed.inject(DOCUMENT);
    TestBed.tick();

    expect(service.language()).toBe('ar');
    expect(service.direction()).toBe('rtl');
    expect(pageDocument.documentElement.lang).toBe('ar');
    expect(pageDocument.documentElement.dir).toBe('rtl');
    expect(pageDocument.body.lang).toBe('ar');
    expect(pageDocument.body.dir).toBe('rtl');
  });

  it('keeps language, direction, storage, and translations in sync when toggled', () => {
    const service = TestBed.inject(I18nService);
    const pageDocument = TestBed.inject(DOCUMENT);

    service.toggleLanguage();
    TestBed.tick();

    expect(service.language()).toBe('ar');
    expect(service.translate('common.dismissNotification')).toBe('إغلاق الإشعار');
    expect(pageDocument.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem('cfs_language')).toBe('ar');

    service.toggleLanguage();
    TestBed.tick();

    expect(service.language()).toBe('en');
    expect(service.translate('common.dismissNotification')).toBe('Dismiss notification');
    expect(pageDocument.documentElement.dir).toBe('ltr');
  });
});
