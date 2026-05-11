/**
 * i18n 설정 — 언어 추가 시 이 파일만 수정
 *
 * 새 언어 추가 방법:
 * 1. locales 배열에 locale 코드 추가
 * 2. messages/<locale>.json 파일 생성
 * 3. 끝 — 라우팅/미들웨어 자동 반영
 */

export const locales = ['en', 'ko'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** 언어 표시명 — UI 언어 선택기에 사용 */
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
};
