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
const fs = require("fs");
const path = require("path");
const lodash_es_1 = require("lodash-es");
const readline = require("readline");
const file_generator_1 = require("./file-generator");
class NitRecordProvider {
    constructor(workspaceRoot = "") {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.reviewFile = '';
        this.datas = [];
        const generator = new file_generator_1.FileGenerator(workspaceRoot);
        this.reviewFile = generator.execute();
        this.readCSV();
    }
    refresh() {
        this.readCSV();
        this._onDidChangeTreeData.fire(undefined);
    }
    readCSV() {
        return __awaiter(this, void 0, void 0, function* () {
            const doRead = () => new Promise((resolve => {
                const list = [];
                let count = 0;
                readline.createInterface({
                    input: fs.createReadStream(this.reviewFile)
                }).on('line', line => {
                    if (count > 0) {
                        const [sha, filename, url, lines, title, comment, priority, category, additional] = line.split(',');
                        list.push({ sha, filename, url, lines, title, comment, priority: Number(priority), category, additional });
                    }
                    count++;
                }).on('close', () => resolve(list));
            }));
            const list = yield doRead();
            const groupDictionary = lodash_es_1.groupBy(list, item => item.filename);
            this.datas = Object.keys(groupDictionary).map(group => ({
                label: group,
                type: TreeItemType.File
            }));
        });
    }
    getTreeItem(element) {
        const item = new vscode.TreeItem(element.label || '', element.type === TreeItemType.File ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        item.iconPath = {
            light: path.join(__filename, '..', '..', 'images', 'file.svg'),
            dark: path.join(__filename, '..', '..', 'images', 'file.svg')
        };
        return item;
    }
    getChildren(element) {
        return !element ? this.getReviewFileList() : element.type === TreeItemType.File ? this.getReviewFileRecordList(element) : null;
    }
    getReviewFileList() {
        return Promise.resolve(this.datas);
    }
    getReviewFileRecordList(element) {
        return Promise.resolve(this.datas.filter(i => i.description === element.description));
    }
}
exports.NitRecordProvider = NitRecordProvider;
var TreeItemType;
(function (TreeItemType) {
    TreeItemType[TreeItemType["File"] = 1] = "File";
    TreeItemType[TreeItemType["Record"] = 2] = "Record";
})(TreeItemType || (TreeItemType = {}));
//# sourceMappingURL=treeView.js.map