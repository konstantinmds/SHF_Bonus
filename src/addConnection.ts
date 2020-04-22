'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
import { ConnectionConf, Project, Projects, ConnectionObject, ConnectionObjects, IConnectionObject, OpeType } from './configureConnections';
import { ParameterConnection } from './parameterConnection';


const localize = nls.loadMessageBundle();

const CreateDialogTitle: string = localize('connectionsDialog.Connection', "Create new data connection");
const EditDialogTitle: string = localize('connectionsDialog.editConnection', "Edit existing data connection");

//const ConnectionNameUnique: string = localize('connectionsDialog.newConnection', "Create new data connection");
const CreateNewSeparatorTitle: string = localize('connectionsDialog.newConnection', "Create new Connection");


export function deactivate() {}

export class ConnectionADD {

    // UI components
    private dialog: azdata.window.Dialog;
    private projectNamesDropdown: azdata.DropDownComponent;


    // Connection details controls
    private pickCreateNewConnectionButton: azdata.ButtonComponent;
    private pickViewConnectionsButton: azdata.ButtonComponent;
    private newConnectionContainer: azdata.GroupContainer;
    private connectionNamesInput: azdata.InputBoxComponent;
    private serverNameField: azdata.InputBoxComponent;    
    private connectionExpressionField: azdata.InputBoxComponent;    
    private databaseNameField: azdata.InputBoxComponent;
    private providerField: azdata.InputBoxComponent;
    private customConnectField: azdata.InputBoxComponent;
    private readonly NoConnectionObject: string = localize('Connection.updatebutton', " Can't update withut choosing the connection!");



    // Create details in new wind


    // Model properties
    private engineType: string
    private project_id: string;
    private projectNames: string[];
    private selectedPackage!: string;
    private databaseName: string;
    private projectsMAP;
    private connectionsMap: ConnectionObjects;
    private connectionName_:string;
    private serverName_:string;
    private databaseName_:string;
    private providerField_:string;
    private customConnect_:string;
    private connectionExpression_: string;
    private connection_dropdown_name;
    private project_dropdown_name;
    private conns: string[];
    private opeType: string;
    private ObjectIConn : IConnectionObject;


    private connection: azdata.connection.ConnectionProfile;
    private connections: azdata.connection.ConnectionProfile[];
   // new ConnectionADD(this.engineType, true, this.connection,this.projectMAP, this.connectionsMap, this.projectNames, this.project_dropdown_name, this.conObj)

    constructor(engineType = "eltSnap", openDialog=true, connection, projectMAP, connectionMap: ConnectionObjects, project_dropdown_name, IConObj) {
        this.engineType = engineType;
        this.opeType = OpeType.Add;
        this.connection = connection;
        this.projectsMAP = projectMAP;
        this.projectNames= this.projectsMAP.projects.map(m => m.project_name);
        this.connectionsMap = connectionMap;
        if (openDialog) {
            this.openDialog(this.engineType)
                        
            this.project_id = '';
            this.connectionName_='';
            this.serverName_ = '';
            this.databaseName_ = '';
            this.providerField_ = '';
            this.customConnect_ ='';
            this.connectionExpression_ = '';
            this.connection_dropdown_name = this.connection.connectionName + ' | ' + this.connection.serverName;
            this.project_dropdown_name = project_dropdown_name;
            this.selectedPackage = project_dropdown_name;
            this.conns = this.connectionsMap.getConnNames();
            this.ObjectIConn = IConObj;
    }
}





    private async addConnection(name: string,srv: string,db: string,prv: string,ccsname :string)
    {
        let conNames = this.connectionsMap.getConnNames();
        let f = conNames.filter(nm => nm === name);
        if(f[0] !== name) {
            this.project_id = this.project_id === '01' ? '0' : this.project_id;

            let storedProc = `EXEC [elt].[Save OleDB Connection] '${name}', '${srv}', '${db}', '${prv}', '${ccsname}', ${this.project_id}`;
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

        }

    else
     {
         this.dialog.message = {text : "Connection name needs to be unique"}
     }
        

    };


    private openDialog(engineType: string): void {

        this.dialog = azdata.window.createModelViewDialog("Create new Data connection");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Create');
        customButton1.onClick(() =>this.connection ?  this.addConnection(this.connectionName_,this.serverName_, this.databaseName_
                ,this.providerField_, this.customConnect_) : this.dialog.message ={text: this.NoConnectionObject}
        
        
    );
        this.dialog.registerContent(async (view) => {
            await this.getTabContent(view, 400);
        });

        
        let customButton2 = azdata.window.createButton('Cancel');
        customButton2.onClick(
            ()=> {new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.selectedPackage);
            azdata.window.closeDialog(this.dialog)
            }
        );
    
        this.dialog.customButtons = [customButton1, customButton2]
        this.dialog.okButton.hidden = true;
        this.dialog.cancelButton.hidden = true
    

        azdata.window.openDialog(this.dialog);
    }

    private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {


        this.connectionNamesInput = view.modelBuilder.inputBox().withValidation(value => this.conns.filter(v => v===value.value).length < 1 )
        .withProperties({
                value: "",
                required: true,
            }).component();
        
        //this.connectionNamesDropdown.onValidityChanged((valid)=>{if (valid !== true) this.dialog.message={text: "Not a Valid name"} });

        this.connectionNamesInput.onTextChanged(value => {
            this.connectionName_ = value;
        });

        
         this.projectNamesDropdown = view.modelBuilder.dropDown().withProperties({
            value: this.project_dropdown_name
            }).component();


        this.projectNamesDropdown.values = this.projectNames;
        this.project_id = this.projectsMAP.getProjectId(this.projectNamesDropdown.value);



        this.serverNameField = view.modelBuilder.inputBox().withProperties({
            value: "",
        }).component();
        this.serverNameField.onTextChanged(value => {
            this.serverName_ = value;
        });

        this.databaseNameField = view.modelBuilder.inputBox().withProperties({
            value: "",
        }).component();
        this.databaseNameField.onTextChanged(value => {
            this.databaseName_ = value;
        });

        this.providerField = view.modelBuilder.inputBox().withProperties({
            value: "",
        }).component();
        this.providerField.onTextChanged(value => {
            this.providerField_ = value;
        });

        this.customConnectField = view.modelBuilder.inputBox().withProperties({
            value: "",
        }).component();
        this.customConnectField.onTextChanged(value => {
            this.customConnect_ = value;
        });

        let pickViewConnectionsButton2 = view.modelBuilder.button().withProperties({
            label: "Secret",
            width: 100
        
        }).component();
     
        pickViewConnectionsButton2.onDidClick(() =>{
        let conObj: IConnectionObject = {connectionName: this.connectionName_, serverName: this.serverName_, database_name: this.databaseName_,provider: this.providerField_, custom_connect_string: this.customConnect_, connection_expression: ''}
        {this.connectionName_ !== '' || this.connectionsMap.getConnNames().includes(this.connectionName_) 
        ?  new ParameterConnection(this.engineType, true, this.connection , this.opeType, conObj, this.projectsMAP, this.connectionsMap, this.project_dropdown_name, this.project_id) : 
//        constructor(engineType = "eltSnap", openDialog=true, connection, projectMAP, connectionMap: ConnectionObjects, projectNames, connection_dropdown_name, project_dropdown_name) {

        this.dialog.message={text: " You need to give your connection a different name, that one is already taken"} }});





        this.projectNamesDropdown.onValueChanged(value =>{
            this.project_id = this.projectsMAP.getProjectId(value.selected);
            this.project_dropdown_name = value.selected;
        });


        let formBuilder = view.modelBuilder.formContainer()
        .withFormItems([
            {
                components:[
                            {
                                component: this.projectNamesDropdown,
                                title: "Project name"
                                        }
                        ],
                
            title: "Choose project context"
            },
            {
                components:[
                    
                    {
                        component: this.connectionNamesInput,
                        title: "Connection name"
                    },
                    {
                        component: this.serverNameField,
                        title: "Server name",
                    },
                    {
                        component: this.databaseNameField,
                        title: "Database name"
                    },
                    {
                        component: this.providerField,
                        title: "Provider name"
                    },
                    {
                        component: this.customConnectField,
                        title: "Custom connection string/ azure key vault"
                    }   

                ],
                title: "Create new connection object"
            },
            {
                components:[
                    
                    {component: pickViewConnectionsButton2,
                        title: ''
                    }
    
                ],
                title: "Get custom connection string from Az Key Vault"
            },

        ]
        ).withLayout({width:400}).component()


    let groupModel1 = view.modelBuilder.groupContainer()
        .withLayout({}).withItems([formBuilder]).component();

    await view.initializeModel(groupModel1);


    if(this.ObjectIConn.connectionName !== "")
        {
            this.projectNamesDropdown.value = this.project_dropdown_name;
            this.connectionNamesInput.value = this.ObjectIConn.connectionName;
            this.serverNameField.value = this.ObjectIConn.serverName;
            this.databaseNameField.value = this.ObjectIConn.database_name;
            this.customConnectField.value = this.ObjectIConn.custom_connect_string;
            this.providerField.value = this.ObjectIConn.provider;

            
        }

}
    }
