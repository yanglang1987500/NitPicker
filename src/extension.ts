import { commands, workspace, window, ExtensionContext, WorkspaceFolder, Uri, Range, Position, ViewColumn, TreeItem, Selection, TextEditorRevealType } from 'vscode';
import * as path from 'path';
import { NitRecordProvider } from './treeView';
import { getWorkspaceFolder } from './utils/workspace-util';
import { WebViewComponent } from './webview';
import { ReviewCommentService } from './review-comment';
import { IRecord } from './interfaces';
import { FileGenerator } from './file-generator';

export function activate(context: ExtensionContext) {
  const workspaceRoot: string = getWorkspaceFolder(workspace.workspaceFolders as WorkspaceFolder[]);
  const recordProvider = new NitRecordProvider(workspaceRoot);
  const commentService = new ReviewCommentService(workspaceRoot, recordProvider);
  const webview = new WebViewComponent(context);

  window.registerTreeDataProvider('nitList', recordProvider);
  const addNoteRegistration = commands.registerCommand('nitpicker.addNit', () => {
    commentService.initReviewFile();
    commentService.editor = window.activeTextEditor;
    webview.addComment(commentService);
  });

  const refreshRecordRegistration = commands.registerCommand('nitpicker.refreshNit', () => {
    recordProvider.refresh();
  });

  const locateSourceRegistration = commands.registerCommand('nitpicker.locateNit', () => {
    window.showTextDocument(Uri.file(path.join(workspaceRoot, `${FileGenerator.defaultFileName}.csv`)), {
      preview: false,
      viewColumn: ViewColumn.One
    });
  });

  // position 6:32-6:32
  const openRecordRegistration = commands.registerCommand('nitpicker.openRecord', async (resource: Uri, position: string, comment: IRecord) => {
    const selections = position.split('|').filter(i => !!i).map(p => {
      /^(\d+):(\d+)-(\d+):(\d+)$/.test(p);
      return new Selection(Number(RegExp.$1) - 1, Number(RegExp.$2), Number(RegExp.$3) - 1, Number(RegExp.$4));
    });
    await window.showTextDocument(resource, {
      preview: false,
      viewColumn: ViewColumn.One
    });
    window.activeTextEditor.selections = selections;
    window.activeTextEditor.revealRange(selections[0], TextEditorRevealType.InCenter);
    commentService.editor = window.activeTextEditor;
    webview.modifyComment(comment, commentService);    
  });

  const deleteRecordRegistration = commands.registerCommand('nitpicker.deleteRecord', (element: TreeItem) => {
    recordProvider.removeRecord(element);
    if (webview.modifyId && webview.modifyId === element.id) webview.disposePanel();
  });

	context.subscriptions.push(addNoteRegistration, refreshRecordRegistration, openRecordRegistration, deleteRecordRegistration, locateSourceRegistration);
}

export function deactivate() {}
