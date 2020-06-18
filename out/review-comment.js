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
const vscode_1 = require("vscode");
const gitCommitId = require('git-commit-id');
const workspace_util_1 = require("./utils/workspace-util");
const file_generator_1 = require("./file-generator");
class ReviewCommentService {
    constructor(workspaceRoot, provider) {
        this.workspaceRoot = workspaceRoot;
        this.provider = provider;
        this.generator = new file_generator_1.FileGenerator(workspaceRoot);
    }
    initReviewFile() {
        this.generator.execute();
    }
    /**
     * Append a new comment
     * @param filePath the relative file path starting from the workspace root
     * @param lineOrLines the line or lines the comment is related to
     * @param comment the comment message
     */
    addComment(comment) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.editor) {
                vscode_1.window.showErrorMessage(`No editor found, please confirm.`);
                return;
            }
            this.checkFileExists();
            const newComment = this.caculateComment(comment);
            this.generator.append(Object.assign({ id: workspace_util_1.guid() }, this.escapeComment(newComment)));
            this.editor = null;
        });
    }
    modifyComment(comment) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.editor) {
                this.provider.modifyRecord(this.escapeComment(comment));
                return;
            }
            const newComment = this.caculateComment(comment);
            this.provider.modifyRecord(Object.assign(Object.assign({}, comment), newComment));
            this.editor = null;
        });
    }
    caculateComment(comment) {
        let selections = '';
        let startAnker = undefined;
        let endAnker = undefined;
        if (this.editor) {
            // 2:2-12:2|19:0-19:0
            selections = this.editor.selections.reduce((acc, cur) => {
                const tmp = acc ? `${acc}|` : '';
                return `${tmp}${cur.start.line + 1}:${cur.start.character}-${cur.end.line + 1}:${cur.end.character}`;
            }, '');
            // use the first line selection for building an anker for the target URL
            if (this.editor.selections.length) {
                startAnker = this.editor.selections[0].start.line + 1;
                endAnker = this.editor.selections[0].end.line + 1;
            }
        }
        let activeFileName = '';
        if (this.editor) {
            activeFileName = this.editor.document.fileName.replace(this.workspaceRoot, '');
        }
        // escape double quotes
        let sha = this.getSha();
        const remoteUrl = this.remoteUrl(sha, activeFileName, startAnker, endAnker);
        return Object.assign(Object.assign({}, comment), { sha, filename: activeFileName, url: remoteUrl, lines: selections });
    }
    escapeComment(comment) {
        const commentExcaped = workspace_util_1.Escape.encode(comment.comment);
        const titleExcaped = workspace_util_1.Escape.encode(comment.title);
        const priority = comment.priority || '';
        const additional = workspace_util_1.Escape.encode(comment.additional);
        const category = comment.category || '';
        return Object.assign(Object.assign({}, comment), { title: titleExcaped, comment: commentExcaped, priority, additional, category });
    }
    getSha() {
        try {
            return gitCommitId({ cwd: this.workspaceRoot });
        }
        catch (error) {
            console.log('Not in a git repository. Leaving SHA empty', error);
            return '';
        }
    }
    /**
     * Build the remote URL
     * @param sha a git SHA that's included in the URL
     * @param filePath the relative file path
     * @param start the first line from the first selection
     * @param end the last line from the first selection
     */
    remoteUrl(sha, filePath, start, end) {
        const customUrl = vscode_1.workspace.getConfiguration().get('nitpicker.customUrl');
        const baseUrl = vscode_1.workspace.getConfiguration().get('nitpicker.baseUrl');
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
        const filePath = this.generator.filePath();
        if (!fs.existsSync(filePath)) {
            vscode_1.window.showErrorMessage(`Could not add modify to file: '${filePath}': File does not exist`);
            return;
        }
    }
}
exports.ReviewCommentService = ReviewCommentService;
//# sourceMappingURL=review-comment.js.map