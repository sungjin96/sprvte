// 미들웨어가 / → /en 으로 redirect하므로 이 파일은 사실상 도달하지 않음.
// 미들웨어 미적용 환경(테스트 등) 대비 fallback.
export { default } from './[locale]/page';
