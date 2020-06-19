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
const vscode_1 = require("vscode");
const path = require("path");
const treeView_1 = require("./treeView");
const workspace_util_1 = require("./utils/workspace-util");
const webview_1 = require("./webview");
const review_comment_1 = require("./review-comment");
const file_generator_1 = require("./file-generator");
function activate(context) {
    const workspaceRoot = workspace_util_1.getWorkspaceFolder(vscode_1.workspace.workspaceFolders);
    const recordProvider = new treeView_1.NitRecordProvider(workspaceRoot);
    const commentService = new review_comment_1.ReviewCommentService(workspaceRoot, recordProvider);
    const webview = new webview_1.WebViewComponent(context);
    vscode_1.window.registerTreeDataProvider('nitList', recordProvider);
    const addNoteRegistration = vscode_1.commands.registerCommand('nitpicker.addNit', () => {
        commentService.initReviewFile();
        commentService.editor = vscode_1.window.activeTextEditor;
        webview.addComment(commentService);
    });
    const refreshRecordRegistration = vscode_1.commands.registerCommand('nitpicker.refreshNit', () => {
        recordProvider.refresh();
    });
    const locateSourceRegistration = vscode_1.commands.registerCommand('nitpicker.locateNit', () => {
        vscode_1.window.showTextDocument(vscode_1.Uri.file(path.join(workspaceRoot, `${file_generator_1.FileGenerator.defaultFileName}.csv`)), {
            preview: false,
            viewColumn: vscode_1.ViewColumn.One
        });
    });
    // position 6:32-6:32
    const openRecordRegistration = vscode_1.commands.registerCommand('nitpicker.openRecord', (resource, position, comment) => __awaiter(this, void 0, void 0, function* () {
        const selections = position.split('|').filter(i => !!i).map(p => {
            /^(\d+):(\d+)-(\d+):(\d+)$/.test(p);
            return new vscode_1.Selection(Number(RegExp.$1) - 1, Number(RegExp.$2), Number(RegExp.$3) - 1, Number(RegExp.$4));
        });
        yield vscode_1.window.showTextDocument(resource, {
            preview: false,
            viewColumn: vscode_1.ViewColumn.One
        });
        vscode_1.window.activeTextEditor.selections = selections;
        vscode_1.window.activeTextEditor.revealRange(selections[0], vscode_1.TextEditorRevealType.InCenter);
        commentService.editor = vscode_1.window.activeTextEditor;
        webview.modifyComment(comment, commentService);
    }));
    const deleteRecordRegistration = vscode_1.commands.registerCommand('nitpicker.deleteRecord', (element) => {
        recordProvider.removeRecord(element);
        if (webview.modifyId && webview.modifyId === element.id)
            webview.disposePanel();
    });
    const linkGitRegistration = vscode_1.commands.registerCommand('nitpicker.linkGit', (element) => {
        const link = element.link;
        if (link)
            vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse(link.replace(/\\/g, '/').replace(/\/\//g, '/')));
        else
            vscode_1.window.showWarningMessage(`This record has no commit link. Or you have not config baseUrl / customUrl yet.`);
    });
    context.subscriptions.push(addNoteRegistration, refreshRecordRegistration, openRecordRegistration, deleteRecordRegistration, locateSourceRegistration, linkGitRegistration);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map