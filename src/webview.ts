import { window, ViewColumn, ExtensionContext, workspace, commands, WebviewPanel } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IRecord } from './interfaces';
import { ReviewCommentService } from './review-comment';

export class WebViewComponent {
  private categories: string[] = [];
  panel: WebviewPanel = null;
  modifyId: string = null;

  constructor(public context: ExtensionContext) {
    this.categories = workspace.getConfiguration().get('nitpicker.categories') as string[];
  }
  addComment(commentService: ReviewCommentService) {
    this.disposePanel();
    // initialize new web tab
    this.panel = window.createWebviewPanel(
      'text',
      'Add code review comment',
      { viewColumn: ViewColumn.Beside },
      {
        enableScripts: true,
      },
    );
    this.panel.webview.html = this.getWebviewContent();

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'submit':
            const comment = JSON.parse(message.text) as IRecord;
            commentService.addComment(comment);
            this.disposePanel();
            return;
          case 'cancel':
            this.disposePanel();
            return;
        }
      },
      undefined,
      this.context.subscriptions,
    );
  }

  modifyComment(comment: Partial<IRecord>, commentService: ReviewCommentService) {
    // initialize new web tab
    this.disposePanel();
    this.modifyId = comment.id;
    this.panel = window.createWebviewPanel(
      'text',
      'Modify code review comment',
      { viewColumn: ViewColumn.Beside },
      {
        enableScripts: true,
      },
    );

    this.panel.webview.html = this.getWebviewContent();
    this.panel.webview.postMessage({
      command: 'setComment',
      comment
    });
    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'submit':
            const newComment = JSON.parse(message.text) as IRecord;
            await commentService.modifyComment({
              id: comment.id,
              ...newComment
            });
            this.disposePanel();
            return;
          case 'cancel':
            this.disposePanel();
            return;
        }
      },
      undefined,
      this.context.subscriptions,
    );
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
