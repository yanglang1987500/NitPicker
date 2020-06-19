import * as vscode from 'vscode';
import * as path from 'path';
import { ProviderResult } from 'vscode';
import { FileGenerator } from './file-generator';
import { IRecord, ITreeItem, TreeItemType } from './interfaces';
import { Escape } from './utils/workspace-util';

export class NitRecordProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;
  private datas: ITreeItem[] = [];
  private list: IRecord[] = [];
  private generator: FileGenerator = null;

	constructor(private workspaceRoot: string = "") {
    this.generator = new FileGenerator(workspaceRoot);
    this.refresh();
	}

	async refresh() {
    await this.readCSV();
		this._onDidChangeTreeData.fire(undefined);
  }
  
  async readCSV() {
    this.list = await this.generator.read();
    this.async();
  }

  async() {
    const groupDictionary = this.list.reduce((p, c) => {
      if (p.hasOwnProperty(c.filename)) p[c.filename].push(c);
      else p[c.filename] = [c];
      return p;
    }, {} as { [key: string]: IRecord[] });
    this.datas = Object.keys(groupDictionary).map(group => ({
      label: group.replace(/[^\\]*\\/ig,""),
      description: `${this.workspaceRoot}${group}`,
      type: TreeItemType.File,
      records: groupDictionary[group].map(record => ({
        id: record.id,
        label: record.title,
        description: record.comment,
        resourceUri: vscode.Uri.file(`${this.workspaceRoot}${record.filename}`),
        position: record.lines,
        type: TreeItemType.Record,
        priority: record.priority,
        category: record.category,
        link: record.url
      }))
    }));
  }

	getTreeItem(element: ITreeItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label || '', element.type === TreeItemType.File ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    const icon = element.type === TreeItemType.File ? 'file.svg' : 'insect.svg';
    item.description = element.type === TreeItemType.File ? element.description : [element.category, element.description].filter(i => !!i).join(': ');
    item.tooltip = item.description as string || item.label;
    item.iconPath = element.type === TreeItemType.File ? vscode.ThemeIcon.File : (() => {
      return element.priority ? path.join(__filename, "..", "..", 'images', `bug${element.priority}.svg`) : {
        light: path.join(__filename, "..", "..", 'images', 'light', 'bug.svg'),
        dark: path.join(__filename, "..", "..", 'images', 'dark', 'bug.svg')
      };
    })();
    item.resourceUri = element.type === TreeItemType.File ? vscode.Uri.file(element.description as string) : null;
    item.contextValue = TreeItemType[element.type];
    item.command = element.type === TreeItemType.Record ? {
      command: 'nitpicker.openRecord',
      arguments: [element.resourceUri, element.position, this.list.find(i => i.id === element.id)],
      title: 'Open Record'
    } : void 0;
		return item;
	}

	getChildren(element?: ITreeItem): ProviderResult<ITreeItem[]> {
    return !element ? this.getReviewFileList() : element.type === TreeItemType.File ? this.getReviewFileRecordList(element) : null;
  }
  
  getReviewFileList(): Thenable<ITreeItem[]> {
    return Promise.resolve(this.datas);
  }

  getReviewFileRecordList(element: ITreeItem): Thenable<ITreeItem[]> {
    return Promise.resolve(this.datas.filter(i => i.label === element.label && i.description === element.description)[0].records);
  }

  async removeRecord(element: vscode.TreeItem) {
    this.list = this.list.filter(i => i.id !== element.id);
    await this.generator.write(this.list);
    this.async();
		this._onDidChangeTreeData.fire(undefined);
  }

  async modifyRecord(comment: Partial<IRecord>) {
    this.list = this.list.map(i => {
      if (i.id === comment.id) {
        return { ...i, ...comment, priority: comment.priority || '' }
      }
      return i;
    });
    await this.generator.write(this.list);
    this.async();
		this._onDidChangeTreeData.fire(undefined);
  }
}


