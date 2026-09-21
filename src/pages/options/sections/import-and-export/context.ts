import { createContext, useContext } from 'react';
import type { TABLE_NAMES } from '@/share/core/constant';
import type { BasicRule } from '@/share/core/types';

export type ImportContent = Partial<Record<TABLE_NAMES, BasicRule[]>>;

export interface ImportAndExportContext {
  getExportContent: () => Promise<ImportContent>;
  startImport: (content: ImportContent) => void;
}

export const ImportAndExportContext = createContext<ImportAndExportContext>(
  {} as ImportAndExportContext,
);

export const useImportAndExportContext = () =>
  useContext(ImportAndExportContext);
