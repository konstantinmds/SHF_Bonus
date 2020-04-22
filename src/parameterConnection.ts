'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
//import {DefaultAzureCredential} from "@azure/identity";
//import{KeyVaultManagementClient} from '@azure/arm-keyvault';
//import {TokenCredentials} from '@azure/ms-rest-js';

//import { SecretClient, SecretProperties } from "@azure/keyvault-secrets";
//import  * as child_process from "child_process";


import { ConnectionConf, Project, Projects, ConnectionObject, ConnectionObjects, IConnectionObject, OpeType } from './configureConnections';
import { ConnectionADD } from './addConnection';

const localize = nls.loadMessageBundle();

const CreateDialogTitle: string = localize('connectionsDialog.Connection', "Create new data connection");
const EditDialogTitle: string = localize('connectionsDialog.editConnection', "Edit existing data connection");

//const ConnectionNameUnique: string = localize('connectionsDialog.newConnection', "Create new data connection");
const CreateNewSeparatorTitle: string = localize('connectionsDialog.newConnection', "Create new Connection");


interface RequestSecurityTokenResponse
{
    accountKey: string;
    token: string;

}

export class ParameterConnection {

    // UI components
    private dialog: azdata.window.Dialog;
    private keyValutsDropdown: azdata.DropDownComponent;
    private keyVaultsecretsDd: azdata.DropDownComponent;


    // Connection details controls
    private pickCreateNewConnectionButton: azdata.ButtonComponent;
    private valueInkeyVault: azdata.CheckBoxComponent;
    private newConnectionContainer: azdata.GroupContainer;
    private parameterTypeDropdown: azdata.DropDownComponent;
    private parameterReferenceField: azdata.InputBoxComponent;
    private parameterName: azdata.InputBoxComponent;
    private parameterValueInputBox: azdata.InputBoxComponent;
    private customConnectField: azdata.InputBoxComponent;





    // Create details in new wind


    // Model properties
    private engineType: string
    
    private azAccount :azdata.Account;
    private azUserId: string;
    private azAccType: string;
    private azContextDisplayName: string;
    private azSettingsObject: string;
    private azClientId: string;
    private azProviderArgs: string;
    private armResource: string;
    private azTenantObj;
    
    private conObj: IConnectionObject;
    private connectionName: string;
    private keyvaultValues: string[];
    private vaultChooesnValue: string;
    private secretChoosenValue: string;
    private parameterValue: string;
    private secretValues: string[];
    private project_id: string;
    private opeType: OpeType;
    private paramConnectionName: string;
    private parameterReference: string;
    private parameters: string[];
    private projectMAP = new Projects();
    private connectionsMap = new ConnectionObjects();

    private projectNames: string[];
    private connection_dropdown_name: string;
    private project_dropdown_name: string;

    private connection: azdata.connection.ConnectionProfile;
    private connections: azdata.connection.ConnectionProfile[];

    //  new ParameterConnection(this.engineType, true, this.connection , this.opeType, conObj, this.projectsMAP, this.connectionsMap, this.projectNames, this.connection_dropdown_name, this.project_id) : 

    constructor(engineType = "eltSnap", openDialog=true, connection, ope_type, conObj, projectMAP, connectionsMAP, project_dropdown_name, project_id) {
        this.engineType = engineType;
        this.opeType = ope_type;
        if (openDialog) {
            this.openDialog(this.engineType)
            this.connection = connection;
            this.conObj = conObj;
            this.connectionName = conObj.connectionName;
            this.paramConnectionName = conObj.connectionName + '_ConnectString';
            this.parameterReference = `@[$Project::${this.paramConnectionName}]` 
            this.getParams();

            this.projectMAP = projectMAP;
            this.connectionsMap =connectionsMAP;
            this.connection_dropdown_name = this.connection.connectionName + " | " + this.connection.serverName;
            this.project_dropdown_name = project_dropdown_name;
            this.project_id = project_id
            this.projectNames = [];
            
            
    }
}

    private openDialog(engineType: string): void {

        this.dialog = azdata.window.createModelViewDialog("Parameter");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Update');
        customButton1.onClick(()=> this.saveParameter(this.parameterName.value, this.parameterTypeDropdown.value as string, this.parameterValue, this.vaultChooesnValue))


        this.dialog.registerContent(async (view) => {
            await this.getTabContent(view, 400);

        });

    
        this.dialog.customButtons = [customButton1]
        this.dialog.okButton.hidden = true;

        azdata.window.openDialog(this.dialog);
    }


    private async getParams(){
        let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
        let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
        let paramQuery = `SELECT [parameter_name] FROM [elt].[parameter]`;
        let keyvaultsQuery = `SELECT DISTINCT [parameter_value],[key_vault_name] FROM [eltsnap_v2].[elt].[parameter] where trim(ISNULL(key_vault_name,'')) <> '' `;

        try {
            
            var data = await provider.runQueryAndReturn(defaultUri,paramQuery);
            var key_data = await provider.runQueryAndReturn(defaultUri,keyvaultsQuery);

            
        } catch (error) {
            vscode.window.showErrorMessage(error.message); 
            
        }
        this.parameters =data.rows.map(v=> v[0]['displayValue']);
        this.keyvaultValues = key_data.rows.map(v=> v[1]['displayValue']).filter((v,i,a)=> a.indexOf(v) === i);
        this.secretValues = key_data.rows.map(v => v[0].displayValue);



    }


    private async saveParameter(paramname: string, parameterType: string, paramvalue: string, key_vault: string)
    {
       
            this.project_id === "01" ? this.project_id='0' : this.project_id; 
            key_vault === undefined ? key_vault='' : key_vault; 

            let storedProc = `EXEC [elt].[Save Parameter] '${paramname}', '${parameterType}', '${paramvalue}', '${key_vault}', '${this.project_id}'`;
            let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
            let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
    
            try
            {
                let data = await provider.runQueryString(defaultUri, storedProc);

                //new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.selectedProject);
                
            } catch (error) 
            {
                vscode.window.showErrorMessage(error.message); 
            }

            if (this.opeType === OpeType.Add)
            {
 //    constructor(engineType = "eltSnap", openDialog=true, connection, projectMAP,
 // connectionMap: ConnectionObjects, projectNames, connection_dropdown_name, project_dropdown_name) {
                azdata.window.closeDialog(this.dialog);
                vscode.window.showInformationMessage('Parameter succesfully created');
                this.conObj.custom_connect_string = paramvalue;
                new ConnectionADD(this.engineType, true, this.connection,this.projectMAP, this.connectionsMap, this.project_dropdown_name, this.conObj)

            }
            else if(this.opeType === OpeType.Edit)
            {

            }

        

    };
 


    private async getKeyVaults(azAccount: azdata.Account): Promise<void>
    {
        try {
            
            var securityToken: {[key: string]: any } = await azdata.accounts.getSecurityToken(azAccount, azdata.AzureResource.AzureKeyVault);
            
        } catch (error) {

            vscode.window.showErrorMessage(error.message); 
            
        }
       const tenant = this.azTenantObj;
       if(!tenant){
           vscode.window.showErrorMessage("Unsuficient privilegde");
       }

       let tokenBundle = securityToken[tenant.id];
       if(!tokenBundle){
        vscode.window.showErrorMessage("Unsuficient privilegde");
        }

       let params: RequestSecurityTokenResponse = {
           accountKey: JSON.stringify(azAccount.key),
           token: securityToken[tenant.id].token          
       };

       try {

/*         let creds = new TokenCredentials(tokenBundle.token);
        var client = new KeyVaultManagementClient(creds,this.azClientId);
 */           
       } catch (error) {
        vscode.window.showErrorMessage(error.message);
       }

/*        let o = client.vaults;
       let os = o; 
 */    }

    

    private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {

        this.parameterName = view.modelBuilder.inputBox(). withProperties({enabled: false, value: this.paramConnectionName}).component();

        this.parameterTypeDropdown = view.modelBuilder.dropDown().withProperties({ value: "", required:true,
        values: ['String', 'Directory', 'Username', 'Password', 'Http Address', 'File']}).component();

        this.valueInkeyVault = view.modelBuilder.checkBox().withProperties({  label: "Value is stored in  Azure Key Vault",
            width: 50}).component();

        this.valueInkeyVault.onChanged(()=>{           
             if(this.valueInkeyVault.checked)
                { 
                    this.keyValutsDropdown.enabled = true;
                    this.keyVaultsecretsDd.enabled = true;
                    this.parameterValueInputBox.updateProperties({enabled:false, value :''});
                    this.keyValutsDropdown.values = this.keyvaultValues;
                    this.keyVaultsecretsDd.values = this.secretValues;
                    this.keyVaultsecretsDd.onValueChanged(value =>
                        this.parameterValue = value);

                    this.keyValutsDropdown.onValueChanged(value => this.vaultChooesnValue = value);


/*                     azdata.accounts.getAllAccounts().then( res =>
                        {
                        this.azAccount = res[0];
                        this.azUserId = res[0].displayInfo.userId 
                        this.azAccType = res[0].displayInfo.accountType 
                        this.azContextDisplayName = res[0].displayInfo.contextualDisplayName 


                        this.azSettingsObject = res[0].properties.providerSettings.settings 

                        this.azClientId = res[0].properties.providerSettings.settings.clientId
                        this.armResource = res[0].properties.providerSettings.settings.armResource 
                        this.azTenantObj = res[0].properties.tenants[0]

                        this.getKeyVaults(this.azAccount);

 */                        


                       }
                

                else {                         
                this.keyValutsDropdown.enabled = false;
                this.keyVaultsecretsDd.enabled = false;
                this.parameterValueInputBox.updateProperties({enabled:true});
                this.parameterValueInputBox.onTextChanged(value =>
                    this.parameterValue = value
                );

                }
            }
            ); 
                   

        this.keyValutsDropdown = view.modelBuilder.dropDown().withProperties({value: "", enabled:false, editable:true }).component();
        this.keyVaultsecretsDd = view.modelBuilder.dropDown().withProperties({value: "", editable:true, enabled:false}).component();

        this.parameterValueInputBox = view.modelBuilder.inputBox().withProperties({enabled: true}).component();
        this.parameterValueInputBox.onTextChanged(value =>  this.parameterValue = value);

        this.keyVaultsecretsDd.onValueChanged(value =>
            this.parameterValue = value);

        this.keyValutsDropdown.onValueChanged(value => this.vaultChooesnValue = value);

      
        this.parameterReferenceField = view.modelBuilder.inputBox().withProperties({enabled: false, value: this.parameterReference}).component();
   //     this.parameterReferenceField = view.modelBuilder.inputBox().withValidation(component => !this.projectNames.includes(component.value)).withProperties({enabled: false}).component();




        let formBuilder = view.modelBuilder.formContainer()
        .withFormItems([
            {
                components:[
                    {
                    component: this.parameterName,
                    title: "Parameter name"
                            },
                            {
                                component: this.parameterTypeDropdown,
                                title: "Parameter type"
                                        }
                        ],
                
            title: "Edit parameter"
            },
            {
                components:[
                    {
                        component: this.valueInkeyVault,
                        title: ""
                    },
                    {
                        component: this.keyValutsDropdown,
                        title: "Choose or input value from your Azure Key Vault"
                    },
                    {
                        component: this.keyVaultsecretsDd,
                        title: "Choose or input your secret"
                    }

                ] ,
                title: "Value is stored in the Azure Key Vault"
            },
            {
                components:[
                    
                    {
                        component: this.parameterValueInputBox,
                        title: "Parameter value",


                    },
                    {
                        component: this.parameterReferenceField,
                        title: "Parameter reference",
                    },

                    

                ],

                title: "Input your own value as custom connection string"
            }
            
            
        ]
        ).component()


    let groupModel1 = view.modelBuilder.groupContainer()
        .withLayout({}).withItems([formBuilder]).component();

    await view.initializeModel(groupModel1);

}
    }
