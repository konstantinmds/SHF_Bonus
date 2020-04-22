'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
import { ConnectionInfo } from './editConnections';
import {ConnectionADD } from './addConnection';
import { DeleteConnection } from './deleteConnection';
import { CloneConnection } from './cloneConnection';


const localize = nls.loadMessageBundle();
const ConfigureDialogTitle: string = localize('confConnectionsDialog.Connection', "Configure data connections");


export enum OpeType {
    Add = "Add",
    Edit = "Edit"
}
export interface IConnectionObject
{
    connectionName: string;
    serverName: string;
    database_name: string;
    provider: string;
    custom_connect_string: string;
    connection_expression:string;


}
export class ConnectionObject {
    public connectionName: string;
    public serverName: string;
    public database_name: string;
    public provider: string;
    public custom_connect_string: string;
    public connection_expression:string;

    /**
     *
     */
    constructor(obj: IConnectionObject);
    constructor(obj: any) {
        this.connectionName= obj.connectionName && obj.connectionName || "";
        this.serverName = obj.serverName && obj.serverName || "";
        this.database_name = obj.database_name && obj.database_name || "";
        this.provider = obj.provider && obj.provider || "";
        this.custom_connect_string = obj.custom_connect_string && obj.custom_connect_string || "";
        this.connection_expression = obj.connection_expression && obj.connection_expression || "";
    }

    getId(conn: string){
        return this.connectionName;
    }

    
    }

export class ConnectionObjects{
    public connObjects: Array <ConnectionObject>;

    constructor() {
        this.connObjects = new Array < ConnectionObject > ();
    }

    public addConObj(pckge: ConnectionObject): void {
        this.connObjects.push(pckge);
    }

    public getConObj(name: string): ConnectionObject | void {
        for (let index = 0; index < this.connObjects.length; index++) {
            const element = this.connObjects[index];
            if (name === element.connectionName) {
                return element;
        }
    }
    }

    public getConnNames(): string[]
    {
        let conNames = [];
        this.connObjects.forEach(element => {
               conNames.push(element.connectionName);
        });
        return conNames;
    }
}
export class Project {
    public id!: string;
    public project_name!: string;
    public connectionObjects: ConnectionObjects;

    constructor() {
        this.id ='';
        this.project_name='';
        this.connectionObjects = new ConnectionObjects();
    }

    public getId(): string {
        return this.id;
    }

    public getCon_Obj_names(): string[]{
        let l = []
        this.connectionObjects.connObjects.forEach(element => {
            l.push(element.connectionName)
        });
        return l;
    }

    public getConnObj(cName :string): ConnectionObject{
        for (let index = 0; index < this.connectionObjects.connObjects.length; index++) {
            const element = this.connectionObjects.connObjects[index];
            if (element.connectionName === cName){
                return element;
            }
            
        }
        let obj: IConnectionObject = {connectionName:'', serverName:'',database_name: '', provider: '',custom_connect_string: '',connection_expression: ''};
        return new ConnectionObject(obj);


    }

    public getConnObjs() {
        return this.connectionObjects;
    }

    public setId(id: string) {
        this.id = id;
    }
    public getProjectName(): string {
        return this.project_name;
    }

    public setProjectName(v: string) {
        this.project_name = v;
    }
}
export class Projects {
    public projects: Array < Project > ;

    constructor() {
        this.projects = new Array < Project > ();
    }

    public addProject(pckge: Project): void {
        this.projects.push(pckge);
    }

    public getProjectName(name: string): Project | void {
        for (let index = 0; index < this.projects.length; index++) {
            const element = this.projects[index];
            if (name === element.project_name) {
                return element;
            }
        }
    
    }

    public getProjectId(name: string): string {
        for (let index = 0; index < this.projects.length; index++) {
            const element = this.projects[index];
            if (name === element.project_name) {
                return element.id;
            }
        }
        return '';
        
    }

    public getProjectFromId(id:string): Project|void{
        for (let index = 0; index < this.projects.length; index++) {
            const element = this.projects[index];
            if (id === element.id) {
                return element;
                }
    
            
        };
        

    }
}


export class ConnectionConf {

    // UI components
    private engineType: string
    private dialog: azdata.window.Dialog;
    private projectNamesDropdown: azdata.DropDownComponent;
    private table: azdata.TableComponent;
    private connectionDropdown: azdata.DropDownComponent;




    // Connection details controls
    private project: string;
    private projectNames: string;
    private projectMAP = new Projects();
    private connectionMAP = new ConnectionObjects();
    private dataObj;
    private project_dropdown;
    private connection_dropdown;
    private databaseName: string;
    private ChosenConnectionObject: ConnectionObject;
    private projectNamesStringList: string[];

    private connection: azdata.connection.ConnectionProfile;
    private connections: azdata.connection.ConnectionProfile[];




    constructor(engineType = "eltSnap", openDialog=true, connection_dropdown = '', project_dropdown = '') {
        this.engineType = engineType;
        this.getConnections();
        if (openDialog) {
            this.project = '';
            this.projectNames='';
            this.dataObj = Array();
            this.connection_dropdown = connection_dropdown;
            this.project_dropdown = project_dropdown;
            this.openDialog(this.engineType)

    }
}


private async getcreateProjectNames(databaseName: string, engineType: string): Promise < Array < string >> {
    if (engineType === "eltSnap") {
        var projectQuery: string = `select [project_id],[project_name] from [${databaseName}].[elt].[project]`;
    } else if (engineType === "bimlSnap") {
        var projectQuery: string = `select [project_id],[project_name] from [${databaseName}].[biml].[project]`;
    }



    let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
    let defaultUri =  await azdata.connection.getUriForConnection(this.connection.connectionId);
    let data: any;

    try {
        data = await provider.runQueryAndReturn(defaultUri, projectQuery);
        //allCons = await provider.runQueryAndReturn(defaultUri, allConsQu);

        } catch (error) {
            if (error.message == 'Query has no results to return') {
                vscode.window.showErrorMessage("The schema is not compatible with dialog type");
            } else {
                vscode.window.showErrorMessage(error.message); 
            }
            
            return;
        }

    let rows = data.rows;

    let values: Array < string > = [];
    let noProject = new Project();


    let AllconPro = new Project();
    AllconPro.setId("01");
    AllconPro.setProjectName("All Connections");
    this.projectMAP.addProject(AllconPro);
    values.push("All Connections");

    noProject.setId("0");
    noProject.setProjectName("Conections without Project");
    this.projectMAP.addProject(noProject);
    values.push("Conections without Project");



    rows.forEach(element => {
        let eltPackage = new Project();
        eltPackage.setId(element[0].displayValue);
        eltPackage.setProjectName(element[1].displayValue);
        let num = this.projectMAP;
        num.addProject(eltPackage);
        values.push(element[1].displayValue);
    });
    return values;

}

public async getConnectionNames(databaseName: string, engineType: string): Promise < string[] > {
    let provider: azdata.QueryProvider = azdata.dataprotocol.getProvider < azdata.QueryProvider > (this.connection.providerId, azdata.DataProviderType.QueryProvider);
    let defaultUri = await azdata.connection.getUriForConnection(this.connection.connectionId);
    let projectId = this.projectMAP.getProjectId(this.project);
    if (engineType === "eltSnap") {
            var query = `SELECT project_id, connection_name
            FROM [eltsnap_v2].[elt].[vw_project_connection]
            WHERE connection_type='OleDb'`

            var query2 = `SELECT  [connection_name]
            ,[server_name]
            ,[database_name]
            ,[provider]
            ,[custom_connect_string]
            ,[connection_expression]
            FROM [elt].[oledb_connection]`

            var query3 = `SELECT p.[connection_name], p.[server_name]
            ,p.[database_name]
            ,p.[provider]
            ,p.[custom_connect_string]
            ,p.[connection_expression]
            FROM [elt].[oledb_connection] p LEFT JOIN 
            elt.vw_project_connection pp ON pp.connection_name = p.connection_name where pp.connection_name is null`;
        }
        
    else if (engineType === "bimlSnap") {
        query = `SELECT [project_id], [connection_name]
         FROM [biml].[vw_project_connection] WHERE connection_type='OleDb'`;
        
    }

    let data: any;
    try {
        data = await provider.runQueryAndReturn(defaultUri, query);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }

    let dataConn: any;
    try {
        dataConn = await provider.runQueryAndReturn(defaultUri, query2);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }

    let dataNoConn: any;
    try {
        dataNoConn = await provider.runQueryAndReturn(defaultUri, query3);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }

    try {

        let noCons = new ConnectionObjects;
        dataNoConn.rows.forEach(element => {
            let obj: IConnectionObject = {connectionName: element[0].displayValue , serverName: element[1].displayValue,
                database_name: element[2].displayValue, provider: element[3].displayValue, custom_connect_string: element[4].displayValue, connection_expression: element[5].displayValue};
    
            let ConObj = new ConnectionObject(obj);
            noCons.addConObj(ConObj);
            });
    
            let ProjectNameNoCon = this.projectMAP.getProjectFromId('0');
            if ( ProjectNameNoCon instanceof Project){
                ProjectNameNoCon.connectionObjects = noCons;
            }  
    
        
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;        
    }



    dataConn.rows.forEach(element => {
        let obj: IConnectionObject = {connectionName: element[0].displayValue , serverName: element[1].displayValue,
            database_name: element[2].displayValue, provider: element[3].displayValue, custom_connect_string: element[4].displayValue, connection_expression: element[5].displayValue};

        let ConObj = new ConnectionObject(obj);
        let num = this.connectionMAP;
        num.addConObj(ConObj);
        });
    let ProjectName = this.projectMAP.getProjectFromId('01');
    if ( ProjectName instanceof Project){
        ProjectName.connectionObjects = this.connectionMAP;
    }


    let values: Array < string > = [];

    data.rows.forEach(element => {
        let ProjectName = this.projectMAP.getProjectFromId(element[0].displayValue);
        if ( ProjectName instanceof Project){
            var conobj = this.connectionMAP.getConObj(element[1].displayValue);
            if (conobj instanceof ConnectionObject){
                try {
                    ProjectName.connectionObjects.addConObj(conobj);
                    
                } catch (error) {
                    console.log(error);
                                    }}                                   }                       
                            } 
            );

    return values;
    
}

private async getProjectNames():Promise<string[]>{
    
    let projects:string[]= [];
    this.projectMAP.projects.forEach(element => {
        projects.push(element.project_name);      
    });
    return projects;
}

private objArrayToD(conObjs: Array<ConnectionObject>):Array<Array<string>>{
    let dataOBJ: Array<Array<string>>=[];
    conObjs.forEach(element => {
        let singleOBJ:Array<string> = [element.connectionName, element.serverName, element.database_name,element.provider, element.custom_connect_string, element.connection_expression,];
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
            let obj: IConnectionObject = {connectionName:'', serverName:'',database_name: '', provider: '',custom_connect_string: '',connection_expression: ''};
            new ConnectionADD(this.engineType, true, this.connection, this.projectMAP, this.connectionMAP, this.project, obj);
    azdata.window.closeDialog(this.dialog)
        }
    );
    
    let customButton2 = azdata.window.createButton('Delete');
    customButton2.onClick(() => { this.ChosenConnectionObject ? new DeleteConnection(this.engineType, true, this.connection, this.ChosenConnectionObject.connectionName, this.connectionMAP, this.projectMAP, this.connectionDropdown.value as string, this.project) : this.dialog.message={text: " You need to choose one connection"} 
    if(this.ChosenConnectionObject){
        azdata.window.closeDialog(this.dialog);
    }
    });

    let customButton3 = azdata.window.createButton('Clone');
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


    this.dialog.okButton.hidden=true;
    
    this.dialog.cancelButton.label = 'Done';

    this.dialog.customButtons = [customButton1, customButton2,customButton3, customButton4];



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


    this.projectNamesDropdown = view.modelBuilder.dropDown().component();

    this.table = view.modelBuilder.table().withProperties({
        columns: ['connection name', 'server name', 'database name', 'provider name', 'custom connection string', 'connection expression'],
        height: 1000
    }).component();



    // On connection change 

    this.connectionDropdown.onValueChanged(value => {
        this.connections.forEach(element => {
            if ((element.connectionName + ' | ' + element.serverName === value.selected) || (element.connectionName === value.selected)) {
                this.connection = element;

                this.projectNamesDropdown.values = [''];
            }
        });

        this.projectMAP = new Projects();
        this.connectionMAP = new ConnectionObjects();
        this.projectNamesDropdown.values = [''];
        this.projectNamesDropdown.value = '';
        this.table.data;        

        this.databaseName = this.connection.databaseName;
        let projectNames = this.getcreateProjectNames(this.databaseName, this.engineType);
        projectNames.then(result => {
            if (result) {
                this.projectNamesDropdown.values = result;
                this.projectNamesStringList = result;
                this.projectNamesDropdown.value = result[0];
                this.project = result[0];

                this.getConnectionNames(this.databaseName, this.engineType).then(()=> {
                    var project_name = this.projectMAP.getProjectName(result[0]);
                    if (project_name instanceof Project){
                       let listOfConnNamesForProject =  project_name.getCon_Obj_names();   
                       let con_bojects = project_name.connectionObjects.connObjects
                       this.dataObj = this.objArrayToD(con_bojects);
                        this.table.data = this.dataObj;

                }});
                        }
                        
                        });
               
       });

    let projectNames = await this.getProjectNames();
        this.projectNamesDropdown.values = projectNames;
        this.projectNamesDropdown.value = "";

    this.projectNamesDropdown.onValueChanged(p_name =>{
    let project = this.projectMAP.getProjectName(p_name.selected)
    this.project = p_name.selected;
    if(project instanceof Project)
    {
        let con_bojects = project.connectionObjects.connObjects
        this.dataObj = this.objArrayToD(con_bojects);
         this.table.data = this.dataObj;
    }
    });

    this.table.onRowSelected(value => {
        if(this.table.selectedRows.length === 1){
        let p = this.table.data[this.table.selectedRows[0]];
        let obj: IConnectionObject = {connectionName: p[0], serverName: p[1], database_name: p[2], provider: p[3], custom_connect_string: p[4], connection_expression: p[5]};

        this.ChosenConnectionObject = new ConnectionObject(obj);
        }
    });

    let toolbarModel2 = view.modelBuilder.toolbarContainer()
    .withToolbarItems([
        {
            
            component: this.connectionDropdown,
            title: 'Choose a connection:'
        },
        
        {
        component: this.projectNamesDropdown,
        title: 'Project:'
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

    if (this.connection_dropdown  === '' && this.project_dropdown === ''){

    

    if (this.connections.length == 1) {
        this.connection = this.connections[0];
        let connectionName = this.connection.connectionName + ' | ' + this.connection.serverName;
        this.connectionDropdown.value = connectionName;

        this.projectMAP = new Projects();
        this.connectionMAP = new ConnectionObjects();

        this.databaseName = this.connection.databaseName;
        let projectNames = this.getcreateProjectNames(this.databaseName, this.engineType);
        projectNames.then(result => {
            if (result) {
                this.projectNamesDropdown.values = result;
                this.projectNamesStringList = result;
                this.projectNamesDropdown.value = result[0];
                this.project = result[0];

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
    
            this.projectMAP = new Projects();
            this.connectionMAP = new ConnectionObjects();
    
            this.databaseName = this.connection.databaseName;
            let projectNames = this.getcreateProjectNames(this.databaseName, this.engineType);
            projectNames.then(result => {
                if (result) {
                    this.projectNamesDropdown.values = result;
                    this.projectNamesStringList = result;
                    this.projectNamesDropdown.value = this.project_dropdown;
                    this.project = this.project_dropdown;
    
                    this.getConnectionNames(this.databaseName, this.engineType).then(()=> {
                        var project_name = this.projectMAP.getProjectName(this.project);
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
}        

}