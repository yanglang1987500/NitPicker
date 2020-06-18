"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os_1 = require("os");
const vscode_1 = require("vscode");
const workspace_util_1 = require("./utils/workspace-util");
class FileGenerator {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.defaultFileExtension = '.csv';
        this.defaultFileName = 'code-review';
        this.csvFileHeader = 'sha,filename,url,lines,title,comment,priority,category,additional';
        const configFileName = vscode_1.workspace.getConfiguration().get('code-review.filename');
        if (configFileName) {
            this.defaultFileName = configFileName;
        }
    }
    /**
     * leveraging all of the other functions to execute
     * the flow of adding a duck to a project
     */
    execute() {
        const fileName = `${this.defaultFileName}${this.defaultFileExtension}`;
        const absoluteFilePath = workspace_util_1.toAbsolutePath(this.workspaceRoot, fileName);
        this.create(absoluteFilePath);
        return absoluteFilePath;
    }
    /**
     * Try to create the code review fiel if not already exist
     * @param absoluteFilePath the absolute file path
     */
    create(absoluteFilePath) {
        if (fs.existsSync(absoluteFilePath)) {
            console.log(`File: '${absoluteFilePath}' already exists`);
            workspace_util_1.getFirstLine(absoluteFilePath).then((lineContent) => {
                if (lineContent !== this.csvFileHeader) {
                    vscode_1.window.showErrorMessage(`CSV header "${lineContent}" is not matching "${this.csvFileHeader}" format. Please adjust it manually`);
                }
                else {
                    console.log(`CSV header "${lineContent}" is OK`);
                }
            });
            return;
        }
        try {
            fs.writeFileSync(absoluteFilePath, `${this.csvFileHeader}${os_1.EOL}`);
            vscode_1.window.showInformationMessage(`Code review file: '${this.defaultFileName}${this.defaultFileExtension}' successfully created.`);
        }
        catch (err) {
            vscode_1.window.showErrorMessage(`Error when trying to create code review file: '${absoluteFilePath}': ${err}`);
        }
    }
    /**
     * not really using anything that needs to be disposed of, but
     * including in case we need to use in a future update
     */
    dispose() { }
}
exports.FileGenerator = FileGenerator;
//# sourceMappingURL=file-generator.js.map