import type { PluginOption } from "vite";

export type HotKey = "ctrlKey" | "altKey" | "metaKey" | "shiftKey";
export type IDEOpenMethod = "reuse" | "new" | "auto";
export type ImportClientWay = "file" | "code";
export type PathType = "relative" | "absolute";
export type EscapeTags = Array<string | RegExp>;

export type Behavior = {
  locate?: boolean;
  copy?: boolean | string;
  target?: string;
  defaultAction?: "copy" | "locate" | "target" | "all";
};

export type CodeInspectorPluginOptions = {
  bundler: "vite";
  hotKeys?: HotKey[] | false;
  showSwitch?: boolean;
  hideConsole?: boolean;
  autoToggle?: boolean;
  editor?: string;
  injectTo?: string | string[];
  enforcePre?: boolean;
  dev?: boolean | (() => boolean);
  match?: RegExp;
  behavior?: Behavior;
  openIn?: IDEOpenMethod;
  pathFormat?: string | string[];
  escapeTags?: EscapeTags;
  hideDomPathAttr?: boolean;
  ip?: boolean | string;
  importClient?: ImportClientWay;
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  mappings?:
    | Record<string, string>
    | Array<{ find: string | RegExp; replacement: string }>;
  port?: number;
  printServer?: boolean;
  pathType?: PathType;
  skipSnippets?: Array<"console" | "htmlScript">;
  modeKey?: string;
  server?: "open" | "close";
  launchType?: "exec" | "open";
  needEnvInspector?: boolean;
};

export function CodeInspectorPlugin(
  options: CodeInspectorPluginOptions,
): PluginOption;

export const codeInspectorPlugin: typeof CodeInspectorPlugin;
