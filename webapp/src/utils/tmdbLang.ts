const STORAGE_KEY = "tmdb-lang";
const DEFAULT_LANG = "ru";

export function getTmdbLang(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANG;
}

export function setTmdbLang(lang: string) {
  localStorage.setItem(STORAGE_KEY, lang);
}
