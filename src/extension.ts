'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as azdata from 'azdata';

// The module 'sqlops' contains the SQL Operations Studio extensibility API
// This is a complementary set of APIs that add SQL / Data-specific functionality to the app
// Import the module and reference it with the alias sqlops in your code below
import { RetrieveDialog } from './retrieve';
import { SaveDialog } from './save';
import { ConnectionConf } from './configureConnections';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(vscode.commands.registerCommand('extension.generateSnippets', async (context: azdata.ObjectExplorerContext) => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user

        let eltDialog = new RetrieveDialog("eltSnap", false);
        await eltDialog.generateSnippets();   
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.ELTretrieveDialog', async() => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        new RetrieveDialog();   

    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('extension.ELTsaveDialog', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        new SaveDialog();       

    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.CreateConnections', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        new ConnectionConf();


    }));



     context.subscriptions.push(vscode.commands.registerCommand('extension.GenerateHTMLreport', async (context: azdata.ObjectExplorerContext) => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user

        let eltDialog = new RetrieveDialog("eltSnap", false);
        await eltDialog.getHTMLreport();

    }));
}

// this method is called when your extension is deactivated
export function deactivate() {}