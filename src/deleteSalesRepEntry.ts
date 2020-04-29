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

export class SalesRepDelete {

    // UI components
    private dialog: azdata.window.Dialog;


    // Connection details controls
    private connectionNamesInputBox: azdata.InputBoxComponent;
    private dateValueInputBox: azdata.InputBoxComponent;   
    
    
    private connectionExpressionField: azdata.InputBoxComponent;    
    private databaseNameField: azdata.InputBoxComponent;
    private providerField: azdata.InputBoxComponent;
    private customConnectField: azdata.InputBoxComponent;
    private readonly NoConnectionObject: string = localize('Connection.updatebutton', " Can't update withut choosing the connection!");



    // Create details in new wind


    // Model properties
    private connName: string;
    private selectedView!: string;
    private salesRepsMAP: SalesRepObjs;
    private viewsMAP: Views;
    private salesRepName_:string;  
    private salesRepDate: Date;
    private connection_dropdown_name;
    private datetoShow: string;


    private connection: azdata.connection.ConnectionProfile;

    constructor(openDialog=true, connection, salesRepName, salesRepDate, connection_dropdown_name, project_name) {
        this.connection = connection;

        this.salesRepName_ = salesRepName;
        this.salesRepDate = salesRepDate;
        this.datetoShow = salesRepDate.split(' ')[0]
        this.selectedView = project_name;
        if (openDialog) {
            this.openDialog()
            this.connection_dropdown_name = connection_dropdown_name;           
    }
}
    private async deleteConnection(name: string, date: Date)
    {
            let storedProc = `EXEC dbo.DeleteBonusTableRecord '${name}','${date}'`;

            let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
            let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
    
            try
            {

                let data = await provider.runQueryAndReturn(defaultUri, storedProc);

                
            } catch (error)
            {
                vscode.window.showErrorMessage(error.message); 
                this.dialog.message = {text : "Record  as such does not exists"}
            }

            vscode.window.showInformationMessage('Sales Rep entry successfully deleted');
            azdata.window.closeDialog(this.dialog);
            new SalesTable(true, this.connection_dropdown_name, this.selectedView);
        }   
        
    


    private openDialog(): void {

        this.dialog = azdata.window.createModelViewDialog("Delete Sales Rep entry");
        let packagesTab = azdata.window.createTab(EditDialogTitle);

        packagesTab.content = 'getpackage';
        this.dialog.content = [packagesTab];
        let customButton1 = azdata.window.createButton('Delete');
        customButton1.onClick(() =>this.connection ?  this.deleteConnection(this.salesRepName_, this.salesRepDate) : this.dialog.message ={text: this.NoConnectionObject}        
    );

    let customButton2 = azdata.window.createButton('Cancel');
    customButton2.onClick(
        ()=> {new SalesTable(true, this.connection_dropdown_name, this.selectedView);
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
            value: this.salesRepName_,
            required: true,
        }).component();


        this.dateValueInputBox = view.modelBuilder.inputBox().withProperties({
            value: this.datetoShow,
            required: true,
            inputType: 'date'            
        }).component();



      


        let formBuilder = view.modelBuilder.formContainer()
        .withFormItems([
            
                    {
                components:[
                    
                    {
                        component: this.connectionNamesInputBox,
                        title: "Sales Rep name"
                    },
                    {
                        component: this.dateValueInputBox,
                        title: "Entry Date"
                    }



                ],
                title: "Delete Sales Rep entry"
            }
        ]
        ).withLayout({width:400}).component()


    let groupModel1 = view.modelBuilder.groupContainer()
        .withLayout({}).withItems([formBuilder]).component();

    await view.initializeModel(groupModel1);

}
    }
