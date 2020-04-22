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

export class CloneConnection {

    // UI components
    private dialog: azdata.window.Dialog;


    // Connection details controls
    private connectionNamesInputBox: azdata.InputBoxComponent;
    private readonly NoConnectionObject: string = localize('Connection.updatebutton', " Can't update withut choosing the connection!");



    // Create details in new wind


    // Model properties
    private engineType: string
    private selectedProject: string;
    private connectionsMap;
    private projectMAP: Projects;
    private connectionToClone_:string;
    private newConName;
    private connection_dropdown_name;



    private connection: azdata.connection.ConnectionProfile;

    constructor(engineType = "eltSnap", openDialog=true, connection, conToCloneName, connectionMap, projectMAP,
     connection_dropdown_name, project_name) {

        this.engineType = engineType;
        this.connection = connection;
        this.connectionsMap = connectionMap;
        this.projectMAP = projectMAP;

        this.connectionToClone_ = conToCloneName;
        this.selectedProject = project_name;
        this.newConName = '';
        this.connection_dropdown_name = connection_dropdown_name;



        if (openDialog) {
            this.openDialog(this.engineType)          
    }
}
    private async cloneConnection(name: string)
    {
        
        let conNames = this.connectionsMap.getConnNames();
        let f = conNames.filter(nm => nm === name);
        if(f[0] !== name || f === undefined) {
            let storedProc = `EXEC [elt].[Clone Connection By Name] '${this.connectionToClone_}', '${name}', '${this.selectedProject}'`;
            let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
            let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
    
            try
            {
                let data = await provider.runQueryString(defaultUri, storedProc);

                azdata.window.closeDialog(this.dialog);
                vscode.window.showInformationMessage('Connection successfully cloned.');
                new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.selectedProject);
                
            } catch (error) 
            {
                vscode.window.showErrorMessage(error.message); 
            }

        }

    else
     {
         this.dialog.message = {text : "Connection needs another name"}
     }
        

    };


    private openDialog(engineType: string): void {

        this.dialog = azdata.window.createModelViewDialog("Clone new Data connection");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Clone Connection');
        customButton1.onClick(() =>this.connection ?  this.cloneConnection(this.newConName) : this.dialog.message ={text: this.NoConnectionObject}
        
    );
        this.dialog.registerContent(async (view) => {
            await this.getTabContent(view, 400);
        });

        let customButton2 = azdata.window.createButton('Cancel');
        customButton2.onClick(
            ()=> {new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.selectedProject);
            azdata.window.closeDialog(this.dialog)
            }
        );
   

        this.dialog.customButtons = [customButton1, customButton2]
        this.dialog.okButton.hidden = true;
        this.dialog.cancelButton.hidden = true;


        azdata.window.openDialog(this.dialog);
    }

    private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {


        this.connectionNamesInputBox = view.modelBuilder.inputBox().withProperties({
            value: '',
            required: true,
            
        }).component();
        this.connectionNamesInputBox.onTextChanged(value => {
            this.newConName = value;
        });




        let formBuilder = view.modelBuilder.formContainer()
        .withFormItems([
            
                    {
                components:[
                    
                    {
                        component: this.connectionNamesInputBox,
                        title: "Connection name"
                    }

                ],
                title: "Clone connection object"
            }
        ]
        ).withLayout({width:400}).component()


    let groupModel1 = view.modelBuilder.groupContainer()
        .withLayout({}).withItems([formBuilder]).component();

    await view.initializeModel(groupModel1);

}
    }
