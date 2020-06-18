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
const gitCommitId = require('git-commit-id');
const workspace_util_1 = require("./utils/workspace-util");
class ReviewCommentService {
    constructor(reviewFile, workspaceRoot) {
        this.reviewFile = reviewFile;
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Append a new comment
     * @param filePath the relative file path starting from the workspace root
     * @param lineOrLines the line or lines the comment is related to
     * @param comment the comment message
     */
    addComment(comment) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkFileExists();
            let selections = '';
            let startAnker = undefined;
            let endAnker = undefined;
            if (vscode_1.window.activeTextEditor) {
                // 2:2-12:2|19:0-19:0
                selections = vscode_1.window.activeTextEditor.selections.reduce((acc, cur) => {
                    const tmp = acc ? `${acc}|` : '';
                    return `${tmp}${cur.start.line + 1}:${cur.start.character}-${cur.end.line + 1}:${cur.end.character}`;
                }, '');
                // use the first line selection for building an anker for the target URL
                if (vscode_1.window.activeTextEditor.selections.length) {
                    startAnker = vscode_1.window.activeTextEditor.selections[0].start.line + 1;
                    endAnker = vscode_1.window.activeTextEditor.selections[0].end.line + 1;
                }
            }
            let activeFileName = '';
            if (vscode_1.window.activeTextEditor) {
                activeFileName = vscode_1.window.activeTextEditor.document.fileName.replace(this.workspaceRoot, '');
            }
            // escape double quotes
            const commentExcaped = comment.description.replace(/"/g, '\\"');
            const titleExcaped = comment.title ? comment.title.replace(/"/g, '\\"') : '';
            const priority = comment.priority || '';
            const additional = comment.additional ? comment.additional.replace(/"/g, '\\"') : '';
            const category = comment.category || '';
            let sha = '';
            try {
                sha = gitCommitId({ cwd: this.workspaceRoot });
            }
            catch (error) {
                sha = '';
                console.log('Not in a git repository. Leaving SHA empty', error);
            }
            const remoteUrl = this.remoteUrl(sha, activeFileName, startAnker, endAnker);
            fs.appendFileSync(this.reviewFile, `"${sha}","${activeFileName}","${remoteUrl}","${selections}","${titleExcaped}","${commentExcaped}","${priority}","${category}","${additional}"${os_1.EOL}`);
        });
    }
    /**
     * Build the remote URL
     * @param sha a git SHA that's included in the URL
     * @param filePath the relative file path
     * @param start the first line from the first selection
     * @param end the last line from the first selection
     */
    remoteUrl(sha, filePath, start, end) {
        const customUrl = vscode_1.workspace.getConfiguration().get('code-review.customUrl');
        const baseUrl = vscode_1.workspace.getConfiguration().get('code-review.baseUrl');
        const filePathWithoutLeadingAndTrailingSlash = workspace_util_1.removeLeadingAndTrailingSlash(filePath);
        if (!baseUrl && !customUrl) {
            return '';
        }
        else if (customUrl) {
            return customUrl
                .replace('{sha}', sha)
                .replace('{file}', filePathWithoutLeadingAndTrailingSlash)
                .replace('{start}', start ? start.toString() : '0')
                .replace('{end}', end ? end.toString() : '0');
        }
        else {
            const baseUrlWithoutTrailingSlash = workspace_util_1.removeTrailingSlash(baseUrl);
            const shaPart = sha ? `${sha}/` : '';
            const ankerPart = start && end ? `#L${start}-${end}` : '';
            return `${baseUrlWithoutTrailingSlash}/${shaPart}${filePathWithoutLeadingAndTrailingSlash}${ankerPart}`;
        }
    }
    checkFileExists() {
        if (!fs.existsSync(this.reviewFile)) {
            vscode_1.window.showErrorMessage(`Could not add modify to file: '${this.reviewFile}': File does not exist`);
            return;
        }
    }
}
exports.ReviewCommentService = ReviewCommentService;
//# sourceMappingURL=review-comment.js.map