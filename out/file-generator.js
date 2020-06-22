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
const fs = require("fs");
const os_1 = require("os");
const vscode_1 = require("vscode");
const readline = require("readline");
const workspace_util_1 = require("./utils/workspace-util");
class FileGenerator {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.defaultFileExtension = '.csv';
        const configFileName = vscode_1.workspace.getConfiguration().get('nitpicker.filename');
        if (configFileName) {
            FileGenerator.defaultFileName = configFileName;
        }
    }
    /**
     * leveraging all of the other functions to execute
     * the flow of adding a duck to a project
     */
    execute() {
        this.create(this.filePath());
    }
    filePath() {
        return workspace_util_1.toAbsolutePath(this.workspaceRoot, `${FileGenerator.defaultFileName}${this.defaultFileExtension}`);
    }
    /**
     * Try to create the code review fiel if not already exist
     * @param absoluteFilePath the absolute file path
     */
    create(absoluteFilePath) {
        if (fs.existsSync(absoluteFilePath)) {
            console.log(`File: '${absoluteFilePath}' already exists`);
            workspace_util_1.getFirstLine(absoluteFilePath).then((lineContent) => {
                if (lineContent !== FileGenerator.csvFileHeader) {
                    vscode_1.window.showErrorMessage(`CSV header "${lineContent}" is not matching "${FileGenerator.csvFileHeader}" format. Please adjust it manually`);
                }
                else
                    console.log(`CSV header "${lineContent}" is OK`);
            });
            return;
        }
        try {
            fs.writeFileSync(absoluteFilePath, `${FileGenerator.csvFileHeader}${os_1.EOL}`);
            vscode_1.window.showInformationMessage(`Code review file: '${FileGenerator.defaultFileName}${this.defaultFileExtension}' successfully created.`);
        }
        catch (err) {
            vscode_1.window.showErrorMessage(`Error when trying to create code review file: '${absoluteFilePath}': ${err}`);
        }
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve => {
                const list = [];
                let count = 0;
                const readable = fs.createReadStream(this.filePath());
                readline.createInterface({
                    input: readable
                }).on('line', line => {
                    if (count > 0 && line && line.trim() !== '') {
                        const [id, sha, filename, url, lines, title, comment, priority, category, additional] = line.split(',').map(i => i.replace(/^"(.*)"$/, '$1'));
                        list.push({ id, sha, filename, url, lines, title: workspace_util_1.Escape.decode(title), comment: workspace_util_1.Escape.decode(comment), priority: priority ? parseInt(priority, 10) : '', category, additional });
                    }
                    count++;
                }).on('close', () => {
                    readable.close();
                    resolve(list);
                });
            }));
        });
    }
    write(list) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const result = list.map(record => {
                    const { id, sha, filename, url, lines, title, comment, priority, category, additional } = record;
                    return `"${id}","${sha}","${filename}","${url}","${lines}","${workspace_util_1.Escape.encode(title)}","${workspace_util_1.Escape.encode(comment)}","${priority}","${category}","${additional}"${os_1.EOL}`;
                });
                fs.writeFile(this.filePath(), [`${FileGenerator.csvFileHeader}${os_1.EOL}`, ...result].join(''), () => resolve());
            });
        });
    }
    append(record) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, sha, filename, url, lines, title, comment, priority, category, additional } = record;
            fs.appendFileSync(this.filePath(), `"${id}","${sha}","${filename}","${url}","${lines}","${workspace_util_1.Escape.encode(title)}","${workspace_util_1.Escape.encode(comment)}","${priority}","${category}","${additional}"${os_1.EOL}`);
        });
    }
    /**
     * not really using anything that needs to be disposed of, but
     * including in case we need to use in a future update
     */
    dispose() { }
}
exports.FileGenerator = FileGenerator;
FileGenerator.defaultFileName = 'code-review';
FileGenerator.csvFileHeader = 'id,sha,filename,url,lines,title,comment,priority,category,additional';
//# sourceMappingURL=file-generator.js.map