'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
import { SalesRepEdit } from './editSalesRepEntry';
import {SalesRepADD } from './addSalesRepEntry';
import { DeleteConnection } from './deleteConnection';


const localize = nls.loadMessageBundle();
const ConfigureDialogTitle: string = localize('confConnectionsDialog.Connection', "Bonus Table");


export interface ISalesRepObj
    {
        salesRep: string;
        bonus: string;
        commissionPercentage: string;
        vRep: string;
        monthYear: string;
    }

export class SalesRepObj {
    public salesRep: string;
    public bonus: string;
    public commissionPercentage: string;
    public vRep: string;
    public monthYear: string;


    constructor(obj: ISalesRepObj);
    constructor(obj: any) {
        this.salesRep= obj.salesRep && obj.salesRep || "";
        this.bonus = obj.bonus && obj.bonus || "";
        this.commissionPercentage = obj.commissionPercentage && obj.commissionPercentage || "";
        this.vRep = obj.vRep && obj.vRep || "";
        this.monthYear = obj.monthYear && obj.monthYear || "";
    }
    
    }

export class SalesRepObjs{
    public salesRepObjects: Array <SalesRepObj>;

    constructor() {
        this.salesRepObjects = new Array < SalesRepObj > ();
    }

    public addSalesObj(pckge: SalesRepObj): void {
        this.salesRepObjects.push(pckge);
    }

    public getSalesObj(name: string, date: string): SalesRepObj | void {
        for (let index = 0; index < this.salesRepObjects.length; index++) {
            const element = this.salesRepObjects[index];
            if ((name === element.salesRep) && (date=== element.monthYear)) {
                return element;
        }
    }
    }

    public getConnNames(): string[]
    {
        let conNames = [];
        this.salesRepObjects.forEach(element => {
               conNames.push(element.salesRep);
        });
        return conNames;
    }
}
export class View {
    public identification_name!: string;
    public salesRepRecords : SalesRepObjs;

    constructor() {
        this.identification_name='';

        this.salesRepRecords = new SalesRepObjs();
    }

    public getId(): string {
        return this.identification_name;
    }

    public getSalesRepObjnames(): string[]{
        let l = []
        this.salesRepRecords.salesRepObjects.forEach(element => {
            l.push(element.salesRep)
        });
        return l;
    }

    public getSalesRepObj(cName :string): SalesRepObj{
        for (let index = 0; index < this.salesRepRecords.salesRepObjects.length; index++) {
            const element = this.salesRepRecords.salesRepObjects[index];
            if (element.salesRep === cName){
                return element;
            }
            
        }
        let obj: ISalesRepObj = {bonus:'', commissionPercentage:'',monthYear: '', salesRep: '',vRep: ''};
        return new SalesRepObj(obj);
    }

    public getSaleRepObjs() {
        return this.salesRepRecords;
    }

    public getViewName(): string {
        return this.identification_name;
    }

    public setIdName(v: string) {
        this.identification_name = v;
    }
}

export class Views {
    public views: Array < View > ;

    constructor() {
        this.views = new Array < View > ();
    }

    public addView(pckge: View): void {
        let having = this.views.filter(view =>view.identification_name === pckge.identification_name);
        if (having.length <1 ) {
            this.views.push(pckge);
    }
    }

    public getViewName(name: string): View | void {
        for (let index = 0; index < this.views.length; index++) {
            const element = this.views[index];
            if (name === element.identification_name) {
                return element;
            }
        }
    
    }

    public getProjectId(name: string): string {
        for (let index = 0; index < this.views.length; index++) {
            const element = this.views[index];
            if (name === element.identification_name) {
                return element.identification_name;
            }
        }
        return '';
        
    }

    public getProjectFromId(id:string): View|void{
        for (let index = 0; index < this.views.length; index++) {
            const element = this.views[index];
            if (id === element.identification_name) {
                return element;
                }
    
            
        };
        

    }
}


export class SalesTable {

    // UI components
    private engineType: string
    private dialog: azdata.window.Dialog;
    private viewsByDayMonthDropdown: azdata.DropDownComponent;
    private table: azdata.TableComponent;
    private connectionDropdown: azdata.DropDownComponent;

    // Connection details controls
    private view: string;
    private projectNames: string;
    private viewsMAP = new Views();
    private salesRepObjsMAP = new SalesRepObjs();
    private dataObj;
    private months: String[];
    private view_dropdown: string;
    private connection_dropdown;
    private databaseName: string;
    private ChosenSalesRepObj: SalesRepObj;
    private dateTimeViewsStringList: string[];

    private connection: azdata.connection.ConnectionProfile;
    private connections: azdata.connection.ConnectionProfile[];




    constructor(openDialog=true, connection_dropdown = '', view_dropdown = '') {
        this.getConnections();
        this.getcreateViewNames();
        if (openDialog) {
            this.view = '';
            this.projectNames='';
            this.dataObj = Array();
            this.connection_dropdown = connection_dropdown;
            this.view_dropdown = view_dropdown;
            this.months = [ 'January','February','March','April','May','June', 'July', 'August', 'September', 'October', 'November', 'December' ]

            this.openDialog(this.engineType)
            

    }
}

private async getcreateViewNames(): Promise < Array < string >> {
    var projectQuery: string = `SELECT [Sales Rep],[Bonus],[CommissionPercentage],[VRep],[Month/Year] FROM [dbo].[Bonus]`;


    let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
    let defaultUri =  await azdata.connection.getUriForConnection(this.connection.connectionId);
    let data: any;

    try {
        data = await provider.runQueryAndReturn(defaultUri, projectQuery);
        //allCons = await provider.runQueryAndReturn(defaultUri, allConsQu);

        } catch (error) {
            if (error.message == 'Query has no results to return') {
                vscode.window.showErrorMessage("Check your connection or database name");
            } else {
                vscode.window.showErrorMessage(error.message); 
            }
            
            return;
        }

    let rows = data.rows;

    let values: Array < string > = [];


    let AllViews = new View();
    AllViews.setIdName("All Records");
    this.viewsMAP.addView(AllViews);
    values.push("All Records");
  
    rows.forEach(element => {
        let eltPackage = new View();
        let parsedDate= new Date(element[4].displayValue);
        let yearMonthVar = this.months[parsedDate.getMonth()] +' | '+ parsedDate.getFullYear();
        eltPackage.setIdName(yearMonthVar);
        let num = this.viewsMAP;
        num.addView(eltPackage);
        values.push();
    });
    return this.viewsMAP.views.map(v=> v.identification_name);

}

 public async getConnectionNames(): Promise < string[] > {
    let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
    let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
    let projectId = this.viewsMAP.getProjectId(this.view);
    
    
    var query = `SELECT [Sales Rep],[Bonus],[CommissionPercentage],[VRep],[Month/Year] FROM [dbo].[Bonus]`;
        
        
    let data: any;
    try {
        data = await provider.runQueryAndReturn(defaultUri, query);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }


    data.rows.forEach(element => {
        let obj: ISalesRepObj = {salesRep: element[0].displayValue , bonus: element[1].displayValue,
            commissionPercentage: element[2].displayValue, vRep: element[3].displayValue, monthYear: element[4].displayValue};

        let SalesObj = new SalesRepObj(obj);
        let num = this.salesRepObjsMAP;
        num.addSalesObj(SalesObj);
        });
        let AllSalesReps = this.viewsMAP.getProjectFromId('All Records');
        if ( AllSalesReps instanceof View){
            AllSalesReps.salesRepRecords = this.salesRepObjsMAP;
        }


    let values: Array < string > = [];

     data.rows.forEach(element => {
        let parsedDate= new Date(element[4].displayValue);
        let yearMonthVar = this.months[parsedDate.getMonth()] +' | '+ parsedDate.getFullYear();

        let ViewName = this.viewsMAP.getProjectFromId(yearMonthVar);
        if ( ViewName instanceof View){
            var conobj = this.salesRepObjsMAP.getSalesObj(element[0].displayValue, element[4].displayValue);
            if (conobj instanceof SalesRepObj){
                try {
                    ViewName.salesRepRecords.addSalesObj(conobj);
                    
                } catch (error) {
                    console.log(error);
                                    }}                                   }                       
                            } 
            );

    return values;
    
}
 

  private async getProjectNames():Promise<string[]>{
    
    let projects:string[]= [];
    this.viewsMAP.views.forEach(element => {
        projects.push(element.identification_name);      
    });
    return projects;
}
 


 private objArrayToD(conObjs: Array<SalesRepObj>):Array<Array<string>>{
    let dataOBJ: Array<Array<string>>=[];
    conObjs.forEach(element => {
        let singleOBJ:Array<string> = [element.salesRep, element.bonus, element.commissionPercentage,element.vRep, element.monthYear];
        dataOBJ.push(singleOBJ)
    });
    return dataOBJ;
}
 


private openDialog(engineType: string): void {

    this.dialog = azdata.window.createModelViewDialog("Configure data connections");
    let packagesTab = azdata.window.createTab(ConfigureDialogTitle);

    packagesTab.content = 'getpackage';
    this.dialog.content = [packagesTab];
    this.dialog.isWide = true;

    let customButton1 = azdata.window.createButton('Add');
    customButton1.onClick(
        () => { 
            let obj: ISalesRepObj = {bonus:'', commissionPercentage:'',monthYear: '', salesRep: '',vRep: ''};
            new SalesRepADD(true, this.connection, this.viewsMAP, this.salesRepObjsMAP, this.view, obj);
    azdata.window.closeDialog(this.dialog)
        }
    );
    
    let customButton2 = azdata.window.createButton('Delete');
    //customButton2.onClick(() => { this.ChosenConnectionObject ? new DeleteConnection(this.engineType, true, this.connection, this.ChosenConnectionObject.connectionName, this.connectionMAP, this.projectMAP, this.connectionDropdown.value as string, this.project) : this.dialog.message={text: " You need to choose one connection"} 
    //if(this.ChosenConnectionObject){
      //  azdata.window.closeDialog(this.dialog);
    //}
   // });

/*     let customButton3 = azdata.window.createButton('Clone');
    customButton3.onClick(() => { this.ChosenConnectionObject ? new CloneConnection(this.engineType, true, this.connection, this.ChosenConnectionObject.connectionName, this.connectionMAP, this.projectMAP, this.connectionDropdown.value as string, this.project) : this.dialog.message={text: " You need to choose one connection"}
    if(this.ChosenConnectionObject){
        azdata.window.closeDialog(this.dialog);
    }
    });


    let customButton4 = azdata.window.createButton('Edit');
    customButton4.onClick(() => { this.ChosenConnectionObject ? new ConnectionInfo(this.engineType, true, this.ChosenConnectionObject,this.connection, this.connectionDropdown.value as string,this.connectionMAP, this.projectMAP, this.project) : this.dialog.message={text: " You need to choose one connection"}
    if(this.ChosenConnectionObject){
    azdata.window.closeDialog(this.dialog);
         }
            });
 */

    this.dialog.okButton.hidden=true;
    
    this.dialog.cancelButton.label = 'Done';

    this.dialog.customButtons = [customButton1, customButton2];



    this.dialog.registerContent(async (view) => {
        await this.getTabContent(view, 600);
    });

    azdata.window.openDialog(this.dialog);
}
private async getConnections(): Promise < void > {
    let availableConnections = await azdata.connection.getConnections(true);
    let connections: azdata.connection.ConnectionProfile[] = [];
    availableConnections.forEach(element => {
        if (element.databaseName != "master" && element.databaseName != "model" && element.databaseName != "msdb" && element.databaseName != "tempdb") {
            connections.push(element);
        }
    });
    this.connections = connections;
}

 
private async getTabContent(view: azdata.ModelView, componentWidth: number): Promise < void > {

    let connectionNames: string[] = [];
    connectionNames.push('');

      this.connections.forEach(element => {
        if (element.connectionName === '') {

            element.connectionName = element.databaseName + ' | ' + element.serverName;
            connectionNames.push(element.databaseName + ' | ' + element.serverName);

        } else {
            connectionNames.push(element.connectionName + ' | ' + element.serverName);
        }
    });




    this.connectionDropdown = view.modelBuilder.dropDown().withProperties({
        value: '',
        values: connectionNames
    }).component();


    this.viewsByDayMonthDropdown = view.modelBuilder.dropDown().component();

    this.table = view.modelBuilder.table().withProperties({
        columns: ['Sales representative name', 'Bonus', 'Commission Percentage', 'VRep', 'Month/Year'],
        height: 1000
    }).component();



    // On connection change 

    this.connectionDropdown.onValueChanged(value => {
        this.connections.forEach(element => {
            if ((element.connectionName + ' | ' + element.serverName === value.selected) || (element.connectionName === value.selected)) {
                this.connection = element;

                this.viewsByDayMonthDropdown.values = [''];
            }
        });

        this.viewsMAP = new Views();
        this.salesRepObjsMAP = new SalesRepObjs();
        this.viewsByDayMonthDropdown.values = [''];
        this.viewsByDayMonthDropdown.value = '';
        this.table.data;        

        this.databaseName = this.connection.databaseName;
        let projectNames = this.getcreateViewNames();
        projectNames.then(result => {
            if (result) {
                this.viewsByDayMonthDropdown.values = result;
                this.dateTimeViewsStringList = result;
                this.viewsByDayMonthDropdown.value = result[0];
                this.view = result[0];

                this.getConnectionNames().then(()=> {
                    var project_name = this.viewsMAP.getProjectFromId(result[0]);
                    if (project_name instanceof View){
                       let con_bojects = project_name.salesRepRecords.salesRepObjects
                       this.dataObj = this.objArrayToD(con_bojects);
                        this.table.data = this.dataObj;

                }});
                        }
                        
                        });
               
       });

    
    let viewNames = await this.getProjectNames();
        this.viewsByDayMonthDropdown.values = viewNames;
        this.viewsByDayMonthDropdown.value = "";

    this.viewsByDayMonthDropdown.onValueChanged(p_name =>{
    let view = this.viewsMAP.getProjectFromId(p_name.selected)
    this.view = p_name.selected;
    if(view instanceof View)
    {
        let salesObjs = view.salesRepRecords.salesRepObjects
        this.dataObj = this.objArrayToD(salesObjs);
         this.table.data = this.dataObj;
    }
    });

    this.table.onRowSelected(value => {
        if(this.table.selectedRows.length === 1){
        let p = this.table.data[this.table.selectedRows[0]];
        let obj: ISalesRepObj = {salesRep: p[0], bonus: p[1], commissionPercentage: p[2], vRep: p[3], monthYear: p[4]};

        this.ChosenSalesRepObj = new SalesRepObj(obj);
        }
    });

    let toolbarModel2 = view.modelBuilder.toolbarContainer()
    .withToolbarItems([
        {
            
            component: this.connectionDropdown,
            title: 'Choose a connection:'
        },
        
        {
        component: this.viewsByDayMonthDropdown,
        title: 'Year/Month Filter:'
        }      
    ]).component();

    let webview = view.modelBuilder.webView().component();

    let flexModel = view.modelBuilder.flexContainer().component();
    flexModel.addItem(toolbarModel2, { flex: '3' });
    flexModel.addItem(webview, { flex: '4' });
    flexModel.addItem(this.table, { flex: '5' });

    flexModel.setLayout({
        flexFlow: 'column',
    alignItems: 'stretch',
        height: '100%',
        width: '100%',

    });

    await view.initializeModel(flexModel);

/*     if (this.connection_dropdown  === '' && this.project_dropdown === ''){

    

    if (this.connections.length == 1) {
        this.connection = this.connections[0];
        let connectionName = this.connection.connectionName + ' | ' + this.connection.serverName;
        this.connectionDropdown.value = connectionName;

        this.projectMAP = new Projects();
        this.connectionMAP = new ConnectionObjects();

        this.databaseName = this.connection.databaseName;
        let projectNames = this.getcreateViewNames();
        projectNames.then(result => {
            if (result) {
                this.viewsByDayMonthDropdown.values = result;
                this.projectNamesStringList = result;
                this.viewsByDayMonthDropdown.value = result[0];
                this.view = result[0];

                this.getConnectionNames(this.databaseName, this.engineType).then(()=> {
                    var project_name = this.projectMAP.getProjectName(result[0]);
                        if(project_name instanceof Project)
                        {
                            let con_bojects = project_name.connectionObjects.connObjects
                            this.dataObj = this.objArrayToD(con_bojects);
                             this.table.data = this.dataObj;
                        }
                        
                        });

            }});
}

    }
    else

    {
        if (this.connections.length == 1) {

            this.connection = this.connections[0];
            this.connectionDropdown.value = this.connection_dropdown;
    
            this.salesRepObjsMAP = new SalesRepObjs();
            this. = new ConnectionObjects();
    
            this.databaseName = this.connection.databaseName;
            let projectNames = this.getcreateViewNames();
            projectNames.then(result => {
                if (result) {
                    this.viewsByDayMonthDropdown.values = result;
                    this.projectNamesStringList = result;
                    this.viewsByDayMonthDropdown.value = this.project_dropdown;
                    this.view = this.project_dropdown;
    
                    this.getConnectionNames(this.databaseName, this.engineType).then(()=> {
                        var project_name = this.projectMAP.getProjectName(this.view);
                            if(project_name instanceof Project)
                            {
                                let con_bojects = project_name.connectionObjects.connObjects
                                this.dataObj = this.objArrayToD(con_bojects);
                                 this.table.data = this.dataObj;
                            }
                            
                            });    
                }});
    
    
    
    
            }


    } */
}        

}