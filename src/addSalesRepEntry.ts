'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
import { ISalesRepObj, SalesRepObj, SalesRepObjs, SalesTable, View, Views } from './viewBonusTable';


const localize = nls.loadMessageBundle();

const CreateDialogTitle: string = localize('connectionsDialog.Connection', "Create new data connection");
const EditDialogTitle: string = localize('connectionsDialog.editConnection', "Edit existing data connection");

//const ConnectionNameUnique: string = localize('connectionsDialog.newConnection', "Create new data connection");
const CreateNewSeparatorTitle: string = localize('connectionsDialog.newConnection', "Create new Connection");


export function deactivate() {}

export class SalesRepADD {

    // UI components
    private dialog: azdata.window.Dialog;
    private viewNamesDropdown: azdata.DropDownComponent;


    // Connection details controls
    private pickCreateNewConnectionButton: azdata.ButtonComponent;
    private pickViewConnectionsButton: azdata.ButtonComponent;
    private newConnectionContainer: azdata.GroupContainer;
    private salesRepNamesInput: azdata.DropDownComponent;
    private bonusField: azdata.InputBoxComponent;    
    private monthYearField: azdata.InputBoxComponent;    
    private commissionPrecentageField: azdata.InputBoxComponent;
    private vRepField: azdata.InputBoxComponent;
    private customConnectField: azdata.InputBoxComponent;
    private readonly NoConnectionObject: string = localize('Connection.updatebutton', " Can't update withut choosing the connection!");



    // Create details in new wind


    // Model properties
    private viewIdName: string;
    private viewNames: string[];
    private selectedPackage!: string;
    private viewsMAP: Views;
    private salesRepMAP: SalesRepObjs;
    private salesRepName_:string;
    private bonusValue_:string;
    private commissionPercentValue:string;
    private vRepValue:string;
    private monthYear_:string;
    private connectionExpression_: string;
    private connection_dropdown_name;
    private view_dropdown_name;
    private salesRepsNames: string[];
    private opeType: string;
    private ISalesRepObj : ISalesRepObj;


    private connection: azdata.connection.ConnectionProfile;
    private connections: azdata.connection.ConnectionProfile[];

    constructor(openDialog=true, connection, viewsMAP, salesRepMAP, view_dropdown_name, ISalesRepObj) {
        this.connection = connection;
        this.viewsMAP = viewsMAP;
        this.viewNames= this.viewsMAP.views.map(m => m.identification_name);
        this.salesRepMAP = salesRepMAP;
        if (openDialog) {
            this.openDialog()
                        
            this.viewIdName = '';
            this.salesRepName_ = '';
            this.bonusValue_ = '';
            this.commissionPercentValue = '';
            this.vRepValue = '';
            this.monthYear_ = '';
            this.connection_dropdown_name = this.connection.connectionName + ' | ' + this.connection.serverName;
            this.view_dropdown_name = view_dropdown_name;
            this.salesRepsNames = this.salesRepMAP.salesRepObjects.map(value => (value.salesRep).trim());
            this.ISalesRepObj = ISalesRepObj;
    }
}





    private async addSalesRep(name: string,srv: string,db: string,prv: string,ccsname :string)
    {
        let f = this.salesRepsNames.filter(nm => nm === name);
        if(f[0] !== name) {
            this.viewIdName = this.viewIdName === '01' ? '0' : this.viewIdName;

            let storedProc = `EXEC [elt].[Save OleDB Connection] '${name}', '${srv}', '${db}', '${prv}', '${ccsname}', ${this.viewIdName}`;
            let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
            let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
    
            try
            {
                let data = await provider.runQueryString(defaultUri, storedProc);

                azdata.window.closeDialog(this.dialog);
                vscode.window.showInformationMessage('Connection successfully updated.');
                //new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.project_dropdown_name);

                
            } catch (error) 
            {
                vscode.window.showErrorMessage(error.message); 
            }

        }

    else
     {
         this.dialog.message = {text : "Sales representative can only have a one value per month"}
     }
        

    };


    private openDialog(): void {

        this.dialog = azdata.window.createModelViewDialog("Create entry");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Create');
/*         customButton1.onClick(() =>this.connection ?  this.addConnection(this.connectionName_,this.serverName_, this.databaseName_
                ,this.providerField_, this.customConnect_) : this.dialog.message ={text: this.NoConnectionObject}
        
        
    );
 */      
        this.dialog.registerContent(async (view) => {
            await this.getTabContent(view, 400);
        });

        
        let customButton2 = azdata.window.createButton('Cancel');
       /*  customButton2.onClick(
           // ()=> {new ConnectionConf(this.engineType, true, this.connection_dropdown_name, this.selectedPackage);
            azdata.window.closeDialog(this.dialog)
            }
        ); */
    
        this.dialog.customButtons = [customButton1, customButton2]
        this.dialog.okButton.hidden = true;
//        this.dialog.cancelButton.hidden = true
    

        azdata.window.openDialog(this.dialog);
    }

    private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {


        this.salesRepNamesInput = view.modelBuilder.dropDown().withValidation(value => this.viewNames.filter(v => v===value.value).length < 1 )
        .withProperties({
                value: "",
                required: true,
                editable: true,
            }).component();
        

        this.salesRepNamesInput.onValueChanged(value => {
            this.salesRepName_ = value;
        });

        
         this.viewNamesDropdown = view.modelBuilder.dropDown().withProperties({
            value: this.view_dropdown_name
            }).component();


        this.viewNamesDropdown.values = this.viewNames;
        this.viewIdName = this.viewsMAP.getProjectId(this.viewNamesDropdown.value as string);



        this.bonusField = view.modelBuilder.inputBox().withProperties({
            value: "",
        }).component();
        
        this.bonusField.onTextChanged(value => {
            this.bonusValue_ = value;
        });

        this.commissionPrecentageField = view.modelBuilder.inputBox().withProperties({
            value: "",
        }).component();
        this.commissionPrecentageField.onTextChanged(value => {
            this.commissionPercentValue = value;
        });

        this.vRepField = view.modelBuilder.inputBox().withProperties({
            value: "",
        }).component();
        this.vRepField.onTextChanged(value => {
            this.vRepValue = value;
        });

     
        this.viewNamesDropdown.onValueChanged(value =>{
            this.viewIdName = this.viewsMAP.getProjectId(value.selected);
            this.view_dropdown_name = value.selected;
        });

        this.monthYearField = view.modelBuilder.inputBox().withProperties({
            value: "",
        }).component();

        this.monthYearField.onTextChanged(value =>{
            this.monthYear_ = value.selected;
        });


        let formBuilder = view.modelBuilder.formContainer()
        .withFormItems([
            {
                components:[
                            {
                                component: this.viewNamesDropdown,
                                title: "View name"
                                        }
                        ],
                
            title: "Choose datetime interval"
            },
            {
                components:[
                    
                    {
                        component: this.salesRepNamesInput,
                        title: "Sales Representative name"
                    },
                    {
                        component: this.bonusField,
                        title: "Bonus",
                    },
                    {
                        component: this.commissionPrecentageField,
                        title: "Commission percentage"
                    },
                    {
                        component: this.vRepField,
                        title: "vRep"
                    },
                    {
                        component: this.monthYearField,
                        title: "Month/Year"
                    }


                ],
                title: "Create new Sales Rep entry"
            }

        ]
        ).withLayout({width:400}).component()


    let groupModel1 = view.modelBuilder.groupContainer()
        .withLayout({}).withItems([formBuilder]).component();

    await view.initializeModel(groupModel1);


    if(this.ISalesRepObj.salesRep !== "")
        {
            this.viewNamesDropdown.value = this.view_dropdown_name;
            this.salesRepNamesInput.value = this.ISalesRepObj.salesRep;
            this.bonusField.value = this.ISalesRepObj.bonus;
            this.commissionPrecentageField.value = this.ISalesRepObj.commissionPercentage;
            this.vRepField.value = this.ISalesRepObj.vRep;
            this.monthYearField.value = this.ISalesRepObj.monthYear;

            
        }
 
}
    }
