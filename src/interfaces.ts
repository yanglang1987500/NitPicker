import { TreeItem } from 'vscode';

export interface CodeReviewConfig {
  filename: string;
}

export interface CsvEntry {
  sha: string;
  filename: string;
  url: string;
  lines: string;
  title: string;
  comment: string;
  priority: string;
  category: string;
  additional: string;
  code?: string;
}

export interface ReviewFileExportSection {
  group: string;
  lines: CsvEntry[];
}

export type GroupBy = keyof Pick<CsvEntry, 'category' | 'priority' | 'filename'>;

export interface IRecord {
  id: string;
  sha: string;
  filename: string;
  url: string;
  lines: string;
  title: string;
  comment: string;
  priority: number | string;
  category: string;
  additional: string;
}

export interface ITreeItem extends Partial<TreeItem> {
  type: TreeItemType;
  priority?: number | string;
  position?: string;
  records?: ITreeItem[];
  category?: string;
}

export enum TreeItemType {
  File = 1,
  Record = 2
}
