"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const file_generator_1 = require("./file-generator");
const treeView_1 = require("./treeView");
const workspace_util_1 = require("./utils/workspace-util");
const webview_1 = require("./webview");
const review_comment_1 = require("./review-comment");
function activate(context) {
    const workspaceRoot = workspace_util_1.getWorkspaceFolder(vscode_1.workspace.workspaceFolders);
    const generator = new file_generator_1.FileGenerator(workspaceRoot);
    const webview = new webview_1.WebViewComponent(context);
    vscode_1.window.registerTreeDataProvider('nitList', new treeView_1.NitRecordProvider(vscode_1.workspace.rootPath));
    const addNoteRegistration = vscode_1.commands.registerCommand('nitpicker.addNit', () => {
        const reviewFile = generator.execute();
        const commentService = new review_comment_1.ReviewCommentService(reviewFile, workspaceRoot);
        webview.addComment(commentService);
    });
    context.subscriptions.push(addNoteRegistration);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map