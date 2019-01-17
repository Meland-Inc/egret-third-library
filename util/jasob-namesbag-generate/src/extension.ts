'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GenerateTask, eTaskType } from "./GenerateTask";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let disposable: vscode.Disposable;

    disposable = vscode.commands.registerCommand('extension.generateClassName', () => {
        let task = new GenerateTask(eTaskType.class);
        task.startTask();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('extension.generateClassAndFunction', () => {
        let task = new GenerateTask(eTaskType.class | eTaskType.method);
        task.startTask();
    });
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}