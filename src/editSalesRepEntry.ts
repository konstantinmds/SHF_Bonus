'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
import { ISalesRepObj, SalesRepObj, SalesRepObjs, SalesTable, View, Views} from './viewBonusTable';

const localize = nls.loadMessageBundle();

const CreateDialogTitle: string = localize('connectionsDialog.Connection', "Create new data connection");
const EditDialogTitle: string = localize('connectionsDialog.editConnection', "Edit existing data connection");

//const ConnectionNameUnique: string = localize('connectionsDialog.newConnection', "Create new data connection");
const CreateNewSeparatorTitle: string = localize('connectionsDialog.newConnection', "Create new Connection");


export function deactivate() {}

export class SalesRepEdit {

    // UI components
    private dialog: azdata.window.Dialog;
    private salesRepNamesDropdown: azdata.InputBoxComponent;
    private secretConnectionContainer: azdata.GroupContainer;
    private pickViewConnectionsButton: azdata.ButtonComponent;

    // Connection details controls
    private bonusField: azdata.InputBoxComponent;    
    private vRepField: azdata.InputBoxComponent;    
    private commissionPercentField: azdata.InputBoxComponent;
    private monthYearField: azdata.InputBoxComponent;
    private customConnectField: azdata.InputBoxComponent;
    private readonly NoConnectionObject: string = localize('Connection.updatebutton', " Can't update withut choosing the connection!");
    // Create details in new wind

    // Model properties
    private engineType: string;
    private project_id: string;
    private connectionName_:string;
    private bonus_:string;
    private vRep_: string;
    private commissionPercent_:string;
    private monthYearField_:string;
    private customConnect_:string;
    private ChosenSalesRepObject: SalesRepObj;
    private dropdown_name;
    private project_dropdown_name;
    private opeType: string;

    private viewsMAP: Views;
    private salesRepsMAP: SalesRepObjs;


    private connection: azdata.connection.ConnectionProfile;
    private connections: azdata.connection.ConnectionProfile[];

    constructor(openDialog=true, objToEdid: SalesRepObj, connection: azdata.connection.ConnectionProfile,
     connection_dropdown_name, conn_map, project_map, project_dropdown_name) {
        if (openDialog) {
            this.openDialog();
            this.ChosenSalesRepObject = objToEdid;   
            this.connection = connection;
            this.dropdown_name = connection_dropdown_name;
            this.project_dropdown_name = project_dropdown_name;
            this.salesRepsMAP = conn_map;
            this.viewsMAP = project_map;
            this.project_id = this.viewsMAP.getProjectId(project_dropdown_name);

    }
}

    private async updateSalesRep(name: string,srv: string,db: string,prv: string,ccsname :string)
    {
        let storedProc = `EXEC [elt].[Save OleDB Connection] '${name}', '${srv}', '${db}', '${prv}', '${ccsname}'`;
        let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
        let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);

        try
        {
            let data = await provider.runQueryString(defaultUri, storedProc);

            azdata.window.closeDialog(this.dialog);
            vscode.window.showInformationMessage('Connection successfully updated.');
            new (this.engineType, true, this.dropdown_name, this.project_dropdown_name);

            
        } catch (error) 
        {
            vscode.window.showErrorMessage(error.message); 
        }

                

    };
    
    private openDialog(): void {

        this.dialog = azdata.window.createModelViewDialog("Edit data connection");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Update');
        customButton1.onClick(() =>this.connection ?  this.updateSalesRep(this.connectionName_,this.bonus_,this.commissionPercent_
                ,this.monthYearField_, this.customConnect_) : this.dialog.message ={text: this.NoConnectionObject}  
    );
     
        this.dialog.registerContent(async (view) => {
            await this.getTabContent(view, 400);
        });


        let customButton2 = azdata.window.createButton('Cancel');
        customButton2.onClick(
            ()=> {new SalesTable(true, this.dropdown_name, this.project_dropdown_name);
            azdata.window.closeDialog(this.dialog)
            }
        );
    

        this.dialog.customButtons = [customButton1,customButton2]
        this.dialog.okButton.hidden = true;
        this.dialog.cancelButton.hidden = true;


        
        azdata.window.openDialog(this.dialog);



    }

    private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {


        this.salesRepNamesDropdown = view.modelBuilder.inputBox().withProperties({
            value: this.ChosenSalesRepObject.salesRep, enabled:false, width: 150
        }).component();

        ///changing values
             
        this.bonusField = view.modelBuilder.inputBox().component();
        this.bonusField.onTextChanged(value => {
            this.bonus_ = value;
        });
        
        this.commissionPercentField = view.modelBuilder.inputBox().component();
        this.commissionPercentField.onTextChanged(value => {
            this.commissionPercent_ = value;
        });

        this.vRepField = view.modelBuilder.inputBox().component();
        this.vRepField.onTextChanged(value => {
            this.vRep_ = value;
        });

        this.monthYearField = view.modelBuilder.inputBox().component();
        this.monthYearField.onTextChanged(value => {
            this.monthYearField_ = value;
        });





        this.connectionName_ =this.ChosenSalesRepObject.salesRep;
        this.bonus_= this.bonusField.value = this.ChosenSalesRepObject.bonus;
        this.commissionPercent_= this.commissionPercentField.value = this.ChosenSalesRepObject.commissionPercentage;
        this.monthYearField_=this.monthYearField.value = this.ChosenSalesRepObject.monthYear;
        this.vRep_ = this.vRepField.value = this.ChosenSalesRepObject.vRep;
    
                
         

        let formBuilder = view.modelBuilder.formContainer()
        .withFormItems([


            {
                components: [    

                     {
                    component: this.salesRepNamesDropdown,
                    title: ""
                    }
                
                ],
                title:"Edit existing sales rep object"
            },
                {
                components:[
                    
                    {
                        component:this.bonusField ,
                        title: "Bonus value",
                    },
                    {
                        component: this.commissionPercentField,
                        title: "Commission percent"
                    },
                    {
                        component: this.vRepField,
                        title: "vRep value"
                    },
                    {
                        component: this.monthYearField,
                        title: "Month/Year value column"
                    }   

                ],
                title: "Edit Sales Rep object atributes"
            }
        ]
        ).withLayout({width: 400}).component()




    let groupModel1 = view.modelBuilder.groupContainer()
        .withLayout({}).withItems([formBuilder]).component();

    await view.initializeModel(groupModel1);

}
    }
