# Azure Data Studio Extension for eltSnap

This extension allows for the editing of SQL Queries stored in the eltSnap database.

## Prerequisites
- eltsnap database

## Steps to Retrieve a SQL Query for Editing
1. Create a connection to the 'eltsnap_v2' database
1. Create a "New Query" for the connection
1. From the "Command Palette" enter: "eltsnap"
1. Choose "eltsnap Retrieve Query Dialog"
1. Choose (or verify) Connection
1. Optionally filter by 'Project' and 'Package type'
1. Select a Package to Edit (if using a 'Foreach' package, choose 'Source Query" for the **inner** query, or 'For each query' for the **outer** query)

## SQL Editing
Changes can now be made in Azure Data Studio to your retrieved SQL query. In the event the query uses parameter expressions, 
the parameters are commented out, and the *default* runtime value is placed in the query. This allows for the query to be runnable. Upon saving, this logic is reversed, 
and the runtime value is replaced by the original parameter reference

## Steps to Save the SQL Query back into eltSnap
1. From the "Command Palette" enter: "eltsnap"
1. Choose "eltsnap Save Query Dialog"
1. Verify the Connection and Package names
1. Click on 'Update'

## Generate snipets for SQL and Python scripts
1. From the "Command Palette" enter: "eltsnap"
1. Choose "eltsnap: Generate Snippets"
1. Choose the Connection from the dropdown

## Configure eltSnap from python notebook with snippets
1. After generating snippets(see previous section) you can open python file or notebook to use snippets in
1. Database table elt.application_config needs to have 'path to html files location' populated field 
1. If the PATH to the folder provided in upper field is not available, python will ask you to provide the right PATH
1. Install **eltSnap** module for CRUD operations over the eltSnap database from PYPI  with command :  **pip install eltsnap**
1. You are free to use the python snippets inside the python files

## Command open generated HTML report 
1. **eltsnap** python package generates database HTML report for database after any successfully executed python function
1. generated python snippets have function generate_report for HTML report generation



## List of Python snippets
|Snippet name| Snippet description|
|:-----------|:-------------------|
|PyEltSnapCreateProject|create project with python snippet function|
|PyEltSnapRenameProject|rename project with python snippet function|
|PyEltSnapDeleteProject|delete project with python snippet function|
|PyEltSnapCloneProject|clone project with python snippet function|
|PyEltSnapChangeTemplateGroup|rename projects template group with python snippet function|
|PyEltSnapCloneDataConnection|clone existing connection with python snippet fuction|
|PyEltSnapDeleteDataConnection|delete connection with python snippet fuction|
|PyEltSnapCreateDataConnection|create connection with python snippet fuction|
|PyEltSnapCreateDataFlowPackage|create new Data Flow package with python snippet fuction|
|PyEltSnapCloneDataFlowPackage|clone Data Flow package with python snippet fuction|
|PyEltSnapCreateForeachDataFlowPackage|create new Foreach Data Flow package| 
|PyEltSnapCloneForeachDataFlowPackage|clone Foreach Data Flow package| 
|PyEltSnapCreateExecuteProcessPackage|create new Execute Process package with python snippet fuction| 
|PyEltSnapCloneExecuteProcessPackage|clone Execute Process package with python snippet fuction| 
|PyEltSnapCreateExecuteSQLPackage|create Execute SQL package with python snippet fuction| 
|PyEltSnapCloneExecuteSQLPackage|clone Execute SQL package with python snippet fuction| 
|PyEltSnapCreateForeachExecuteSQLPackage|create Foreach Execute SQL package with python snippet fuction| 
|PyEltSnapCloneForeachExecuteSQLPackage|clone Foreach Execute SQL package with python snippet fuction| 
|PyEltSnapDeletePackage|delete package with python snippet fuction| 




