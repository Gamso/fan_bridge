import type { HomeAssistant } from "../ha-types";
import en from "./en.json";
import fr from "./fr.json";

type Section = keyof typeof en & string;
type SectionKeys<S extends Section> = keyof (typeof en)[S] & string;
export type TranslationKey = {
  [S in Section]: `${S}.${SectionKeys<S>}`;
}[Section];

type Widen<T> = {
  [K in keyof T]: T[K] extends string ? string : { [J in keyof T[K]]: string };
};
const translations: Record<string, Widen<typeof en>> = { en, fr };

function resolveLang(hass: HomeAssistant | undefined): string {
  const lang: string = hass?.locale?.language ?? hass?.language ?? "en";
  const base = lang.toLowerCase().split("-")[0];
  return base in translations ? base : "en";
}

function get(dict: Widen<typeof en>, key: TranslationKey): string | undefined {
  const dot = key.indexOf(".");
  const sec = key.slice(0, dot) as Section;
  const k = key.slice(dot + 1);
  const section = dict[sec];
  return typeof section === "object"
    ? (section as Record<string, string>)[k]
    : undefined;
}

export function localize(
  hass: HomeAssistant | undefined,
  key: TranslationKey,
  params: Record<string, string | number> = {},
): string {
  const text =
    get(translations[resolveLang(hass)], key) ??
    get(translations.en, key) ??
    key;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
