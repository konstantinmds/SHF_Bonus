'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
import { ConnectionConf, Project, Projects, ConnectionObject, ConnectionObjects} from './configureConnections';

const localize = nls.loadMessageBundle();

const CreateDialogTitle: string = localize('connectionsDialog.Connection', "Create new data connection");
const EditDialogTitle: string = localize('connectionsDialog.editConnection', "Edit existing data connection");

//const ConnectionNameUnique: string = localize('connectionsDialog.newConnection', "Create new data connection");
const CreateNewSeparatorTitle: string = localize('connectionsDialog.newConnection', "Create new Connection");


export function deactivate() {}

export class ConnectionInfo {

    // UI components
    private dialog: azdata.window.Dialog;
    private connectionNamesDropdown: azdata.InputBoxComponent;
    private secretConnectionContainer: azdata.GroupContainer;
    private pickViewConnectionsButton: azdata.ButtonComponent;






    // Connection details controls
    private serverNameField: azdata.InputBoxComponent;    
    private connectionExpressionField: azdata.InputBoxComponent;    
    private databaseNameField: azdata.InputBoxComponent;
    private providerField: azdata.InputBoxComponent;
    private customConnectField: azdata.InputBoxComponent;
    private readonly NoConnectionObject: string = localize('Connection.updatebutton', " Can't update withut choosing the connection!");
    // Create details in new wind

    // Model properties
    private engineType: string;
    private project_id: string;
    private connectionName_:string;
    private serverName_:string;
    private databaseName_:string;
    private providerField_:string;
    private customConnect_:string;
    private connectionExpression_: string;
    private ChosenConnectionObject: ConnectionObject;
    private connection_dropdown_name;
    private project_dropdown_name;
    private opeType: string;

    private projectMAP: Projects;
    private connectionMAP: ConnectionObjects;


    private connection: azdata.connection.ConnectionProfile;
    private connections: azdata.connection.ConnectionProfile[];

    constructor(engineType = "eltSnap", openDialog=true, objToEdid: ConnectionObject, connection: azdata.connection.ConnectionProfile,
     connection_dropdown_name, conn_map, project_map, project_dropdown_name) {
        this.engineType = engineType;
        if (openDialog) {
            this.openDialog(this.engineType);
            this.ChosenConnectionObject = objToEdid;   
            this.connection = connection;
            this.connection_dropdown_name = connection_dropdown_name;
            this.project_dropdown_name = project_dropdown_name;
            this.connectionMAP = conn_map;
            this.projectMAP = project_map;
            this.project_id = this.projectMAP.getProjectId(project_dropdown_name);

    }
}

    private async updateConnection(name: string,srv: string,db: string,prv: string,ccsname :string)
    {
        let storedProc = `EXEC [elt].[Save OleDB Connection] '${name}', '${srv}', '${db}', '${prv}', '${ccsname}'`;
        let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
        let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);

        try
        {
            let data = await provider.runQueryString(defaultUri, storedProc);

            azdata.window.closeDialog(this.dialog);
            vscode.window.showInformationMessage('Connection successfully updated.');
            new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.project_dropdown_name);

            
        } catch (error) 
        {
            vscode.window.showErrorMessage(error.message); 
        }

                

    };
    
    private openDialog(engineType: string): void {

        this.dialog = azdata.window.createModelViewDialog("Edit data connection");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Update');
        customButton1.onClick(() =>this.connection ?  this.updateConnection(this.connectionName_,this.serverName_,this.databaseName_
                ,this.providerField_, this.customConnect_) : this.dialog.message ={text: this.NoConnectionObject}  
    );
     
        this.dialog.registerContent(async (view) => {
            await this.getTabContent(view, 400);
        });


        let customButton2 = azdata.window.createButton('Cancel');
        customButton2.onClick(
            ()=> {new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.project_dropdown_name);
            azdata.window.closeDialog(this.dialog)
            }
        );
    

        this.dialog.customButtons = [customButton1,customButton2]
        this.dialog.okButton.hidden = true;
        this.dialog.cancelButton.hidden = true;


        
        azdata.window.openDialog(this.dialog);



    }

    private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {


        this.connectionNamesDropdown = view.modelBuilder.inputBox().withProperties({
            value: this.ChosenConnectionObject.connectionName, enabled:false, width: 150
        }).component();

        ///changing values

        this.pickViewConnectionsButton = view.modelBuilder.button().withProperties({
            label: "Secret",
            width: 100,
            enabled: false

        }).component();

        
        this.secretConnectionContainer = view.modelBuilder.groupContainer()
        .withLayout({width:400,}).withItems([
            this.pickViewConnectionsButton
        ]).
        component();

        let pickViewConnectionsButton3 = view.modelBuilder.button().withProperties({
            label: "Secret",
            width: 80,
            enabled: false

        }).component();

        let pickViewConnectionsButton4 = view.modelBuilder.button().withProperties({
            label: "Secret",
            width: 80
        }).component();
        pickViewConnectionsButton4.onDidClick(
            ()=> {
 //  new ParameterConnection(this.engineType, true, this.connection , this.opeType, conObj, this.projectsMAP, this.connectionsMap,
 // this.projectNames, this.connection_dropdown_name, this.project_id) : 

        new ParameterConnection(this.engineType, true, this.connection, this.opeType, this.ChosenConnectionObject, this.projectMAP, this.connectionMAP, this.project_dropdown_name, this.project_id);

            }
        );

        let pickViewConnectionsButton1 = view.modelBuilder.button().withProperties({
            label: "Secret",
            width: 80,
            enabled: false
       

        }).component();

        let pickViewConnectionsButton2 = view.modelBuilder.button().withProperties({
            label: "Secret",
            width: 80,
            enabled: false
        
        }).component();
     
        this.serverNameField = view.modelBuilder.inputBox().component();
        this.serverNameField.onTextChanged(value => {
            this.serverName_ = value;
        });
        
        this.databaseNameField = view.modelBuilder.inputBox().component();
        this.databaseNameField.onTextChanged(value => {
            this.databaseName_ = value;
        });

        this.connectionExpressionField = view.modelBuilder.inputBox().component();
        this.connectionExpressionField.onTextChanged(value => {
            this.serverName_ = value;
        });

        this.providerField = view.modelBuilder.inputBox().component();
        this.providerField.onTextChanged(value => {
            this.providerField_ = value;
        });

        this.customConnectField = view.modelBuilder.inputBox().component();
        this.customConnectField.onTextChanged(value => {
            this.customConnect_ = value;
        });




        let pagerFridayCheckboxContainer0 = view.modelBuilder.flexContainer().
        withLayout({
            flexFlow: 'row',
            alignItems: 'baseline',
            width: '66%'
        }).withItems([this.connectionNamesDropdown])
        .component();
    
   
    let pagerFridayCheckboxContainer = view.modelBuilder.flexContainer().
    withLayout({
        flexFlow: 'row',
        alignItems: 'baseline',
        width: '120%'
    }).withItems([this.serverNameField, pickViewConnectionsButton1])
    .component();


    let pagerFridayCheckboxContainer2 = view.modelBuilder.flexContainer()
    .withLayout({
        flexFlow: 'row',
        alignItems: 'baseline',
        width: '120%'
    }).withItems([this.databaseNameField, pickViewConnectionsButton2])
    .component();

 
    let pagerFridayCheckboxContainer3 = view.modelBuilder.flexContainer()
    .withLayout({
        flexFlow: 'row',
        alignItems: 'baseline',
        width: '67%'
    }).withItems([this.providerField])
    .component();

    let pagerFridayCheckboxContainer4 = view.modelBuilder.flexContainer()
    .withLayout({
        flexFlow: 'row',
        alignItems: 'baseline',
        width: '120%'
    }).withItems([this.customConnectField, pickViewConnectionsButton4])
    .component();


        this.connectionName_ =this.ChosenConnectionObject.connectionName;
        this.serverName_= this.serverNameField.value = this.ChosenConnectionObject.serverName;
        this.databaseName_= this.databaseNameField.value = this.ChosenConnectionObject.database_name;
        this.providerField_=this.providerField.value = this.ChosenConnectionObject.provider;
        this.customConnect_ = this.customConnectField.value = this.ChosenConnectionObject.custom_connect_string;
        this.connectionExpression_ = this.connectionExpressionField.value = this.ChosenConnectionObject.connection_expression;
    
                
         

        let formBuilder = view.modelBuilder.formContainer()
        .withFormItems([


            {
                components: [    

                     {
                    component: pagerFridayCheckboxContainer0,
                    title: ""
                    }
                
                ],
                title:"Edit existing connection object"
            },
                {
                components:[
                    
                    {
                        component: pagerFridayCheckboxContainer2,
                        title: "Server name",
                    },
                    {
                        component: pagerFridayCheckboxContainer,
                        title: "Database name"
                    },
                    {
                        component: pagerFridayCheckboxContainer3,
                        title: "Provider name"
                    },
                    {
                        component: pagerFridayCheckboxContainer4,
                        title: "Custom connection string/ azure key vault"
                    }   

                ],
                title: "Edit connection object atributes"
            }
        ]
        ).withLayout({width: 400}).component()




    let groupModel1 = view.modelBuilder.groupContainer()
        .withLayout({}).withItems([formBuilder]).component();

    await view.initializeModel(groupModel1);

}
    }
