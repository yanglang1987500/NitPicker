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
const fs = require("fs");
class WebViewComponent {
    constructor(context) {
        this.context = context;
        this.categories = [];
        this.panel = null;
        this.modifyId = null;
        this.categories = vscode_1.workspace.getConfiguration().get('nitpicker.categories');
    }
    addComment(commentService) {
        this.disposePanel();
        // initialize new web tab
        this.panel = vscode_1.window.createWebviewPanel('text', 'Add code review comment', { viewColumn: vscode_1.ViewColumn.Beside }, {
            enableScripts: true,
        });
        this.panel.webview.html = this.getWebviewContent();
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'submit':
                    const comment = JSON.parse(message.text);
                    commentService.addComment(comment);
                    vscode_1.commands.executeCommand('nitpicker.refreshNit');
                    this.disposePanel();
                    return;
                case 'cancel':
                    this.disposePanel();
                    return;
            }
        }, undefined, this.context.subscriptions);
    }
    modifyComment(comment, commentService) {
        // initialize new web tab
        this.disposePanel();
        this.modifyId = comment.id;
        this.panel = vscode_1.window.createWebviewPanel('text', 'Modify code review comment', { viewColumn: vscode_1.ViewColumn.Beside }, {
            enableScripts: true,
        });
        this.panel.webview.html = this.getWebviewContent();
        this.panel.webview.postMessage({
            command: 'setComment',
            comment
        });
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            switch (message.command) {
                case 'submit':
                    const newComment = JSON.parse(message.text);
                    yield commentService.modifyComment(Object.assign({ id: comment.id }, newComment));
                    this.disposePanel();
                    return;
                case 'cancel':
                    this.disposePanel();
                    return;
            }
        }), undefined, this.context.subscriptions);
    }
    disposePanel() {
        this.panel && this.panel.dispose();
        this.panel = null;
        this.modifyId = null;
    }
    getWebviewContent() {
        let selectListString = '';
        this.categories.forEach((category) => {
            selectListString += `<option value="${category}">${category}</option>`;
        });
        const resourcePath = path.join(this.context.extensionPath, 'resource/index.html');
        const html = fs.readFileSync(resourcePath, 'utf-8');
        return html.replace('${selectListString}', selectListString);
    }
}
exports.WebViewComponent = WebViewComponent;
//# sourceMappingURL=webview.js.map