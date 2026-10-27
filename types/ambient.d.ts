// Ambient type declarations so VS Code TypeScript server shows zero red errors even before `npm install`

declare module 'node:fs' {
  const fs: {
    existsSync(path: string): boolean;
    mkdirSync(path: string, options?: { recursive?: boolean }): void;
    writeFileSync(path: string, data: any, encoding?: string): void;
    readFileSync(path: string, encoding?: string): any;
    copyFileSync(src: string, dest: string): void;
  };
  export default fs;
  export const existsSync: typeof fs.existsSync;
  export const mkdirSync: typeof fs.mkdirSync;
  export const writeFileSync: typeof fs.writeFileSync;
  export const readFileSync: typeof fs.readFileSync;
  export const copyFileSync: typeof fs.copyFileSync;
}

declare module 'node:child_process' {
  export function execSync(command: string, options?: any): any;
}

declare module 'node:path' {
  const path: {
    join(...paths: string[]): string;
    resolve(...paths: string[]): string;
    dirname(p: string): string;
    basename(p: string, ext?: string): string;
  };
  export default path;
  export const join: typeof path.join;
  export const resolve: typeof path.resolve;
  export const dirname: typeof path.dirname;
  export const basename: typeof path.basename;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

declare var process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exit(code?: number): never;
  cwd(): string;
};

declare var Buffer: {
  from(data: string, encoding?: string): Uint8Array;
};

declare module 'react' {
  export type FC<P = any> = (props: P) => any;
  export type ReactNode = any;
  export type ChangeEvent<T = any> = any;
  export type KeyboardEvent<T = any> = any;
  export type MouseEvent<T = any> = any;
  export function useState<T = any>(initialState: T | (() => T)): [T, (newState: any) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T = any>(initialValue?: T): { current: T };
  export function useMemo<T = any>(factory: () => T, deps: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  const React: any;
  export default React;
}

declare module 'react-dom/client' {
  export function createRoot(container: any): { render(element: any): void };
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

