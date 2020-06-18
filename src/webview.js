"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
const fs = require("fs");
class WebViewComponent {
    constructor(context) {
        this.context = context;
        this.categories = [];
        this.categories = vscode_1.workspace.getConfiguration().get('code-review.categories');
    }
    addComment(commentService) {
        // initialize new web tab
        const panel = vscode_1.window.createWebviewPanel('text', 'Add code review comment', { viewColumn: vscode_1.ViewColumn.Beside }, {
            enableScripts: true,
        });
        panel.webview.html = this.getWebviewContent();
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'submit':
                    const comment = JSON.parse(message.text);
                    commentService.addComment(comment);
                    panel.dispose();
                    return;
                case 'cancel':
                    panel.dispose();
                    return;
            }
        }, undefined, this.context.subscriptions);
    }
    getWebviewContent() {
        let selectListString = '';
        this.categories.forEach((category) => {
            selectListString += `<option value="${category}">${category}</option>`;
        });
        const resourcePath = path.join(this.context.extensionPath, 'src/index.html');
        const html = fs.readFileSync(resourcePath, 'utf-8');
        return html.replace('${selectListString}', selectListString);
    }
}
exports.WebViewComponent = WebViewComponent;
//# sourceMappingURL=webview.js.map