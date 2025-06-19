import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FileExtensionNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children: FileExtensionNode[] = [],
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}

export class ExtensionTreeProvider implements vscode.TreeDataProvider<FileExtensionNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileExtensionNode | undefined> = new vscode.EventEmitter<FileExtensionNode | undefined>();
    readonly onDidChangeTreeData: vscode.Event<FileExtensionNode | undefined> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: FileExtensionNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileExtensionNode): Thenable<FileExtensionNode[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No workspace folder found');
            return Promise.resolve([]);
        }

        if (!element) {
            return Promise.resolve(this.getGroupedExtensions());
        }

        return Promise.resolve(element.children);
    }

    private getGroupedExtensions(): FileExtensionNode[] {
        const allFiles: string[] = [];
        const ignored = vscode.workspace.getConfiguration().get<string[]>('sortByExtension.ignoreFolders') || [];

        function scanDir(dir: string) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (ignored.includes(entry.name)) continue;
                    scanDir(fullPath);
                } else {
                    allFiles.push(fullPath);
                }
            }
        }

        scanDir(this.workspaceRoot);

        const map = new Map<string, string[]>();
        for (const file of allFiles) {
            const ext = path.extname(file) || 'no-extension';
            if (!map.has(ext)) map.set(ext, []);
            map.get(ext)?.push(file);
        }

        const extNodes: FileExtensionNode[] = [];
        for (const [ext, files] of map.entries()) {
            const childNodes = files.map(f => {
                return new FileExtensionNode(
                    path.basename(f),
                    vscode.TreeItemCollapsibleState.None,
                    [],
                    {
                        command: 'vscode.open',
                        title: 'Open File',
                        arguments: [vscode.Uri.file(f)]
                    }
                );
            });

            extNodes.push(
                new FileExtensionNode(`${ext} (${files.length})`, vscode.TreeItemCollapsibleState.Collapsed, childNodes)
            );
        }

        return extNodes.sort((a, b) => a.label.localeCompare(b.label));
    }
}
