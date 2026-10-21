export const PAGES = ['home', 'standings', 'schedule', 'team', 'moves', 'rules', 'commish'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validEvent(value) {
  return value && PAGES.includes(value.page) &&
    ['mobile', 'tablet', 'desktop'].includes(value.device) &&
    ['id', 'visitor', 'visit'].every(key => typeof value[key] === 'string' && uuid.test(value[key]));
}
