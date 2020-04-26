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
    private viewsMAP: Views;
    private salesRepMAP: SalesRepObjs;
    private salesRepName_:string;
    private bonusValue_:string;
    private commissionPercentValue:string;
    private vRepValue:string;
    private monthYear_: Date;
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
        this.viewNames= this.viewsMAP.views.map(m => m.identification_name.trim()).filter((v,i) => i > 0);   
        this.viewNames.unshift("New month entry");

        this.salesRepMAP = salesRepMAP;
        if (openDialog) {
            this.openDialog()
                        
            this.viewIdName = '';
            this.salesRepName_ = '';
            this.bonusValue_ = '0';
            this.commissionPercentValue = '0';
            this.vRepValue = '0';
            this.monthYear_ = null;
            this.connection_dropdown_name = this.connection.connectionName + ' | ' + this.connection.serverName;
            this.view_dropdown_name = (view_dropdown_name === "All Records") ? this.viewNames[1] : view_dropdown_name;
            this.salesRepsNames = this.salesRepMAP.salesRepObjects.map(value => (value.salesRep).trim()).filter((v,i,a)=> a.indexOf(v)===i);
            this.ISalesRepObj = ISalesRepObj;
    }
}





    private async addSalesRep(name: string,bonus: string,percentage: string,vrep: string,monthYear :Date)
    {

            let storedProc = `INSERT INTO dbo.Bonus_Table (Sales_Rep, Bonus,Commission_Percentage,VRep,[Date]) VALUES ('${name}', '${bonus}', cast('${percentage}' as numeric), '${vrep}', '${monthYear}')`;
            let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
            let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
    
            try
            {
                let data = await provider.runQueryString(defaultUri, storedProc);

                azdata.window.closeDialog(this.dialog);
                vscode.window.showInformationMessage('Connection successfully updated.');

                
            } catch (error) 
            {
                vscode.window.showErrorMessage(error.message); 
                this.dialog.message = {text : "Sales representative can only have a one value per month, check your data"}

            }
            new SalesTable(true, this.connection_dropdown_name, this.view_dropdown_name);


    };


    private openDialog(): void {

        this.dialog = azdata.window.createModelViewDialog("Create entry");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Create');
        customButton1.onClick(() =>this.connection ?  this.addSalesRep(this.salesRepName_,this.bonusValue_, this.commissionPercentValue
                ,this.vRepValue, this.monthYear_) : this.dialog.message ={text: this.NoConnectionObject}
        
        
    );
       
        this.dialog.registerContent(async (view) => {
            await this.getTabContent(view, 400);
        });

        
        let customButton2 = azdata.window.createButton('Cancel');
         customButton2.onClick(
            ()=> {new SalesTable(true, this.connection_dropdown_name, this.viewIdName);
            azdata.window.closeDialog(this.dialog)
            }
        ); 
    
        this.dialog.customButtons = [customButton1, customButton2]
        this.dialog.okButton.hidden = true;
        this.dialog.cancelButton.hidden = true
    

        azdata.window.openDialog(this.dialog);
    }

    private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {


        this.salesRepNamesInput = view.modelBuilder.dropDown().withValidation(value => this.viewNames.filter(v => v===value.value).length < 1 )
        .withProperties({
                value: "",
                required: true,
                editable: true,
            }).component();
        
        let viewSalesmens = (this.viewsMAP.getViewName(this.view_dropdown_name) as View).salesRepRecords.getConnNames() || [""];
        this.salesRepNamesInput.values = this.salesRepsNames.filter(array => !viewSalesmens.includes(array));

        this.salesRepNamesInput.onValueChanged(value => {
            this.salesRepName_ = value;
        });

        
         this.viewNamesDropdown = view.modelBuilder.dropDown().withProperties({
            value: this.view_dropdown_name,
            values: this.viewNames
            }).component();

        
        this.viewNamesDropdown.onValueChanged(viewVal =>{
            this.view_dropdown_name = viewVal.selected;
            let viewSalesmens = this.viewsMAP.getViewName(this.view_dropdown_name).salesRepRecords.getConnNames() || [""];
            this.salesRepNamesInput.values = this.salesRepsNames.filter(array => !viewSalesmens.includes(array));
            });

        this.viewIdName = this.viewsMAP.getProjectId(this.viewNamesDropdown.value as string);



        this.bonusField = view.modelBuilder.inputBox().withProperties({
            value: "",
            inputType: 'number'
        }).component();
        
        this.bonusField.onTextChanged(value => {
            this.bonusValue_ = value;
        });

        this.commissionPrecentageField = view.modelBuilder.inputBox().withProperties({
            value: "",
            inputType: 'number'

        }).component();
        this.commissionPrecentageField.onTextChanged(value => {
            this.commissionPercentValue = value;
        });

        this.vRepField = view.modelBuilder.inputBox().withProperties({
            value: "",
            inputType: 'number'
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
            inputType: 'date'
        }).component();

        this.monthYearField.onTextChanged(value =>{
            this.monthYear_ = value;
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
                        title: "Date"
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
