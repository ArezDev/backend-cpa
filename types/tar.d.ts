declare module "tar" {
    interface ExtractOptions {
      file: string;
      cwd?: string;
      strip?: number;
      filter?: (path: string, entry?: any) => boolean;
    }
  
    export function x(options: ExtractOptions): Promise<void>;
    export function extract(options: ExtractOptions): Promise<void>;
  }
  