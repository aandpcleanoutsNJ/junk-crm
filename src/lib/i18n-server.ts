import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE_NAME, getDict, isLang, type Dict, type Lang } from "./i18n";

/** Reads the visitor's language choice in a Server Component or Route Handler. */
export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LANG_COOKIE_NAME)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

/** Convenience: the resolved dictionary for the current request's language. */
export async function getServerDict(): Promise<Dict> {
  return getDict(await getServerLang());
}
