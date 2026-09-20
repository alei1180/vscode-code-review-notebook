import * as vscode from 'vscode';
import type { Review, Note, Language } from './model';
import { strings } from './i18n';
export type Item = { review: Review; note?: Note };
export class ReviewTree
  implements vscode.TreeDataProvider<Item>, vscode.Disposable
{
  private readonly changed = new vscode.EventEmitter<Item | undefined>();
  readonly onDidChangeTreeData = this.changed.event;
  reviews: Review[] = [];
  active: string | null = null;
  constructor(private readonly language: () => Language) {}
  refresh(): void {
    this.changed.fire(undefined);
  }
  getChildren(item?: Item): Item[] {
    return item
      ? item.review.notes.map((note) => ({ review: item.review, note }))
      : this.reviews.map((review) => ({ review }));
  }
  getTreeItem(item: Item): vscode.TreeItem {
    const t = strings(this.language()),
      { review, note } = item;
    if (note) {
      const tree = new vscode.TreeItem(
        `${t[note.severity]} · ${note.comment.split('\n')[0] ?? ''}`,
        vscode.TreeItemCollapsibleState.None,
      );
      tree.description = note.general
        ? note.module || note.file || t.general
        : `${note.module ?? note.file}:${note.start}${note.end !== note.start ? `–${note.end}` : ''}`;
      tree.id = note.id;
      tree.tooltip = note.comment;
      tree.contextValue =
        review.state.status === 'draft' ? 'note' : 'savedNote';
      tree.command = {
        command: 'codeReviewNotes.openNote',
        title: t.open,
        arguments: [item],
      };
      tree.iconPath = new vscode.ThemeIcon('comment');
      return tree;
    }
    const tree = new vscode.TreeItem(
      `${review.details.taskNumber} · ${review.details.taskTitle}`,
      vscode.TreeItemCollapsibleState.Collapsed,
    );
    tree.id = review.id;
    tree.description = `${review.id === this.active ? '● ' : ''}${t[review.state.status]} · ${review.notes.length}`;
    tree.contextValue =
      review.state.status === 'completed' ? 'completedReview' : 'review';
    tree.iconPath = new vscode.ThemeIcon(
      review.state.status === 'completed' ? 'pass' : 'checklist',
    );
    tree.command = {
      command: 'codeReviewNotes.select',
      title: t.choose,
      arguments: [item],
    };
    return tree;
  }
  dispose(): void {
    this.changed.dispose();
  }
}
