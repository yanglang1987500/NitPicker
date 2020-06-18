"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const file_generator_1 = require("./file-generator");
const interfaces_1 = require("./interfaces");
class NitRecordProvider {
    constructor(workspaceRoot = "") {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.datas = [];
        this.list = [];
        this.generator = null;
        this.generator = new file_generator_1.FileGenerator(workspaceRoot);
        this.refresh();
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.readCSV();
            this._onDidChangeTreeData.fire(undefined);
        });
    }
    readCSV() {
        return __awaiter(this, void 0, void 0, function* () {
            this.list = yield this.generator.read();
            this.async();
        });
    }
    async() {
        const groupDictionary = this.list.reduce((p, c) => {
            if (p.hasOwnProperty(c.filename))
                p[c.filename].push(c);
            else
                p[c.filename] = [c];
            return p;
        }, {});
        this.datas = Object.keys(groupDictionary).map(group => ({
            label: group.replace(/[^\\]*\\/ig, ""),
            description: `${this.workspaceRoot}${group}`,
            type: interfaces_1.TreeItemType.File,
            records: groupDictionary[group].map(record => ({
                id: record.id,
                label: record.title,
                description: record.comment,
                resourceUri: vscode.Uri.file(`${this.workspaceRoot}${record.filename}`),
                position: record.lines,
                type: interfaces_1.TreeItemType.Record,
                priority: record.priority,
                category: record.category
            }))
        }));
    }
    getTreeItem(element) {
        const item = new vscode.TreeItem(element.label || '', element.type === interfaces_1.TreeItemType.File ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        const icon = element.type === interfaces_1.TreeItemType.File ? 'file.svg' : 'insect.svg';
        item.description = element.type === interfaces_1.TreeItemType.File ? element.description : [element.category, element.description].filter(i => !!i).join(': ');
        item.tooltip = item.description || item.label;
        item.iconPath = element.type === interfaces_1.TreeItemType.File ? vscode.ThemeIcon.File : (() => {
            return element.priority ? path.join(__filename, "..", "..", 'images', `bug${element.priority}.svg`) : {
                light: path.join(__filename, "..", "..", 'images', 'light', 'bug.svg'),
                dark: path.join(__filename, "..", "..", 'images', 'dark', 'bug.svg')
            };
        })();
        item.resourceUri = element.type === interfaces_1.TreeItemType.File ? vscode.Uri.file(element.description) : null;
        item.contextValue = interfaces_1.TreeItemType[element.type];
        item.command = element.type === interfaces_1.TreeItemType.Record ? {
            command: 'nitpicker.openRecord',
            arguments: [element.resourceUri, element.position, this.list.find(i => i.id === element.id)],
            title: 'Open Record'
        } : void 0;
        return item;
    }
    getChildren(element) {
        return !element ? this.getReviewFileList() : element.type === interfaces_1.TreeItemType.File ? this.getReviewFileRecordList(element) : null;
    }
    getReviewFileList() {
        return Promise.resolve(this.datas);
    }
    getReviewFileRecordList(element) {
        return Promise.resolve(this.datas.filter(i => i.label === element.label && i.description === element.description)[0].records);
    }
    removeRecord(element) {
        return __awaiter(this, void 0, void 0, function* () {
            this.list = this.list.filter(i => i.id !== element.id);
            yield this.generator.write(this.list);
            this.async();
            this._onDidChangeTreeData.fire(undefined);
        });
    }
    modifyRecord(comment) {
        return __awaiter(this, void 0, void 0, function* () {
            this.list = this.list.map(i => {
                if (i.id === comment.id) {
                    return Object.assign(Object.assign(Object.assign({}, i), comment), { priority: comment.priority || '' });
                }
                return i;
            });
            yield this.generator.write(this.list);
            this.async();
            this._onDidChangeTreeData.fire(undefined);
        });
    }
}
exports.NitRecordProvider = NitRecordProvider;
//# sourceMappingURL=treeView.js.map