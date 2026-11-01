import type { HttpClient, RequestOptions } from "../core";
import type { Theme } from "./definition";

export type ThemeRecord = { id: string; name: string; builtIn: boolean; definition: Theme };

export class ThemesResource {
  constructor(private readonly h: HttpClient) {}
  /** Presets plus the workspace's saved themes. */
  list(o?: RequestOptions) { return this.h.data<ThemeRecord[]>("GET", "/themes", o); }
  /** Built-in presets only. Use the id as a form's `themeId`. */
  presets(o?: RequestOptions) { return this.h.data<ThemeRecord[]>("GET", "/themes/presets", o); }
  get(id: string, o?: RequestOptions) { return this.h.data<ThemeRecord>("GET", `/themes/${id}`, o); }
  create(body: { name: string; definition: Theme }, o?: RequestOptions) { return this.h.data<ThemeRecord>("POST", "/themes", { body, ...o }); }
  update(id: string, body: { name?: string; definition?: Theme }, o?: RequestOptions) { return this.h.data<ThemeRecord>("PATCH", `/themes/${id}`, { body, ...o }); }
  delete(id: string, o?: RequestOptions) { return this.h.data<null>("DELETE", `/themes/${id}`, o); }
}
