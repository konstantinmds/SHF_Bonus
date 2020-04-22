'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
import { ConnectionConf, Project, Projects, ConnectionObject, ConnectionObjects } from './configureConnections';


const localize = nls.loadMessageBundle();

const CreateDialogTitle: string = localize('connectionsDialog.Connection', "Create new data connection");
const EditDialogTitle: string = localize('connectionsDialog.editConnection', "Edit existing data connection");

//const ConnectionNameUnique: string = localize('connectionsDialog.newConnection', "Create new data connection");
const CreateNewSeparatorTitle: string = localize('connectionsDialog.newConnection', "Create new Connection");


export function deactivate() {}

export class DeleteConnection {

    // UI components
    private dialog: azdata.window.Dialog;


    // Connection details controls
    private connectionNamesInputBox: azdata.InputBoxComponent;
    private serverNameField: azdata.InputBoxComponent;    
    private connectionExpressionField: azdata.InputBoxComponent;    
    private databaseNameField: azdata.InputBoxComponent;
    private providerField: azdata.InputBoxComponent;
    private customConnectField: azdata.InputBoxComponent;
    private readonly NoConnectionObject: string = localize('Connection.updatebutton', " Can't update withut choosing the connection!");



    // Create details in new wind


    // Model properties
    private engineType: string
    private connName: string;
    private selectedPackage!: string;
    private connectionsMap;
    private projectMAP: Projects;
    private connectionName_:string;    
    private connection_dropdown_name;



    private connection: azdata.connection.ConnectionProfile;

    constructor(engineType = "eltSnap", openDialog=true, connection, conName, connectionMap, projectMAP, connection_dropdown_name, project_name) {
        this.engineType = engineType;
        this.connection = connection;
        this.connectionsMap = connectionMap;
        this.projectMAP = projectMAP;

        this.connectionName_ = conName;
        this.selectedPackage = project_name;
        if (openDialog) {
            this.openDialog(this.engineType)
            this.connection_dropdown_name = connection_dropdown_name;           
    }
}
    private async deleteConnection(name: string)
    {
        let project_id = this.projectMAP.getProjectId(this.selectedPackage);
        let conNames = this.connectionsMap.getConnNames();
        let f = conNames.filter(nm => nm === name);
        if(f[0] == name) {
            let storedProc = `EXEC [elt].[Delete Connection] '${name}', 'OleDb', '${project_id}'`;
            let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
            let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
    
            try
            {
                let data = await provider.runQueryString(defaultUri, storedProc);

                vscode.window.showInformationMessage('Connection successfully deleted.');
                azdata.window.closeDialog(this.dialog);
                new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.selectedPackage);

                
            } catch (error) 
            {
                vscode.window.showErrorMessage(error.message); 
            }

        }

    else
     {
         this.dialog.message = {text : "Connection name as such does not exists"}
     }
        
    };


    private openDialog(engineType: string): void {

        this.dialog = azdata.window.createModelViewDialog("Delete Data connection");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Delete Connection');
        customButton1.onClick(() =>this.connection ?  this.deleteConnection(this.connectionName_) : this.dialog.message ={text: this.NoConnectionObject}        
    );

    let customButton2 = azdata.window.createButton('Cancel');
    customButton2.onClick(
        ()=> {new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.selectedPackage);
        azdata.window.closeDialog(this.dialog)
        }
    );

    this.dialog.customButtons = [customButton1, customButton2]
    this.dialog.okButton.hidden = true;
    this.dialog.cancelButton.hidden = true
    

    this.dialog.registerContent(async (view) => {
            await this.getTabContent(view, 400);
        });

        azdata.window.openDialog(this.dialog);
    }

    private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {


        this.connectionNamesInputBox = view.modelBuilder.inputBox().withProperties({
            value: this.connectionName_,
            required: true,
            
        }).component();
      


        let formBuilder = view.modelBuilder.formContainer()
        .withFormItems([
            
                    {
                components:[
                    
                    {
                        component: this.connectionNamesInputBox,
                        title: "Connection name"
                    }

                ],
                title: "Delete connection object"
            }
        ]
        ).withLayout({width:400}).component()


    let groupModel1 = view.modelBuilder.groupContainer()
        .withLayout({}).withItems([formBuilder]).component();

    await view.initializeModel(groupModel1);

}
    }
