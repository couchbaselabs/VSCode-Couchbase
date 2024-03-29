export const dataExportWebview = async (buckets: string[]): Promise<string> => {
  return /*html*/`
    <!DOCTYPE html>
    <html lang="en">
       <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Data Export</title>
          <link href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css" rel="stylesheet">
          <style>
            .heading {
                text-align: center;
            }

            .advanced-header {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
            }

            input[type="checkbox"] {
                appearance: none;
                -webkit-appearance: none;
                width: 15px;
                height: 15px;
                border-radius: 2px;
                outline: none;
                border: 1px solid #999;
                background-color: white;
            }
            
            input[type="checkbox"]:checked {
                background-color: #ea2328;
            }
    
            input[type="checkbox"]:checked::before {
                content: '\\2714';
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 12px;
                color: white;
                height: 100%;
            }

            form {
                max-width: 500px;
                margin: 0 auto;
                padding: 30px;
                border: 1px solid var(--vscode-settings-sashBorder);
                background-color: var(--vscode-sideBar-background);
                color: var(--vscode-sideBar-foreground)
                border-radius: 5px;
            }
            
            /* Style for form labels */
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }

            .verboseLogContainer {
                display: flex;
                gap: 10px;
            }
            input[type="checkbox"] {
                transform: scale(1.1); 
            }

            input[type="text"], input[type="number"]{
                width: 99%;
                padding-top: 8px;
                padding-bottom: 8px;
                margin-bottom: 15px;
                border: 1px solid var(--vscode-settings-sashBorder);
                border-radius: 3px;
                font-size: 16px;
            }
            
            /* Style for form input fields and selects */
            select,
            input[type="file"] {
                width: 100%;
                padding-top: 8px;
                padding-bottom: 8px;
                margin-bottom: 15px;
                border: 1px solid var(--vscode-settings-sashBorder);
                border-radius: 3px;
                font-size: 16px;
                color: #444;
            }

            
            /* Style for the submit button */
            input[type="submit"] {
                
                color: var(--vscode-button-foreground);
                border: none;
                padding: 10px 50px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                margin: auto;
            }
            
            .select2-selection--multiple:before {
                content: "";
                position: absolute;
                right: 7px;
                top: 42%;
                border-top: 5px solid #888;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
            }
            .select2-container--open .select2-selection--multiple:before {
                border-top:0; border-bottom: 5px solid #888; 
            }

            .select2 {
                width: 100%; /* Set the select element to 100% of its container's width */
                max-width: 100%; /* Limit the maximum width to the container's width */
                box-sizing: border-box; /* Include padding and border in the width */
                margin-bottom: 15px;
                color: #444;
            }

            .select2-container--default.select2-container--disabled .select2-selection--multiple {
                background-color: #ccc;
            }

            .select2-results__option {
                color: #444;
            }

            .folder-container {
                display: flex; 
                align-items: start;
            }
            
            .folder-destination {
                padding: 11px;
                background-color: #007bff;
                color: #fff;
                cursor: pointer;

                white-space: nowrap;
            }
            
            .folder-destination:hover {
                background-color: #0056b3;
            }
            
            #selectedFolder {
                flex-grow: 1;
                margin-left: 10px;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 5px;
                background-color: #f9f9f9;
            }

            .validation-error {
                color: #ff0000;
                font-size: 14px;
                padding: 5px;
            }

            .redButton{
                background: #ea2328;
            }
            .redButton:hover {
                background: #bb1117;
            }
            
            .advanced-header {
                cursor: pointer;
                font-weight: bold;
                padding: 5px;
                display: flex;
                align-items: center;
            }
            
            .advanced-settings {
                display: none;
                padding: 10px;
            }
            .advanced-settings.active {
                display: block;
            }
            
            .arrow-icon {
                transition: transform 0.2s;
                margin-right:5px;
            }

            .tooltip {
                position: relative;
                display: inline-block;
            }

            .tooltip .tooltiptext {
                visibility: hidden;
                width: 400px;
                background-color: #555;
                color: #fff;
                text-align: center;
                border-radius: 6px;
                padding: 5px 10px;
                position: absolute;
                z-index: 1;
                bottom: 100%; 
                left: 50%; 
                margin-left: -40px; 
                opacity: 0;
                transition: opacity 0s;
            }

            .tooltip:hover .tooltiptext {
                visibility: visible;
                opacity: 1;
            }
            
          </style>
        </head>

        <body>
            <h1 class="heading">Export Data</h1>
            <form action="#" method="post" id="dataExportForm">
            <h4 >Before proceeding do checkout <a href="https://docs.couchbase.com/server/current/tools/cbexport.html">Couchbase docs</a> for CB Export</h4>
                <label for="bucket" class="tooltip">Bucket:
                    <span class="tooltiptext">Select the top level bucket on which export should happen. Only 1 bucket can be exported at a time</span>
                </label>
                <select name="bucket" id="bucket" onchange="onBucketClick(value)">
                <option value="" disabled selected>Select a bucket</option>
                    ${buckets.map((bucketName)=>{
                        return `
                            <option value="${bucketName}" >${bucketName}</option>
                        `;
                    })}
                </select>
                <br>

                <label for="scopes" class="tooltip">Scopes:
                    <span class="tooltiptext">Select the scopes that should be exported, you can also select all scopes which will override any other selection.</span>
                </label>
                <select name="scopes" id="scopes" multiple class="js-select2" disabled onchange="onScopeClick(options)" width="100%"></select>
                <br>

                <label for="collections" class="tooltip">Collections:
                    <span class="tooltiptext">The collections that you would like to include. You can select <strong>All</strong> or more than one option.</span>
                </label>
                <select name="collections" id="collections" multiple class="js-select2" disabled width="100%"></select>
                <br>

                <label for="documentsKeyField" class="tooltip">Document's Key Field:
                    <span class="tooltiptext">In Couchbase, the document's key is not part of the body of the document. But when you are exporting the dataset, it is recommended to also include the original keys. This property defines the name of the attribute in the final exported file that will contain the document's key.</span>
                </label>
                <input type="text" name="documentsKeyField" id="documentsKeyField" value="cbmid">
                <br>

                <label for="scopeFieldName" class="tooltip">Scope Field Name:
                    <span class="tooltiptext">This filed will be used to store the name of the scope the document came from. It will be created on each JSON document.</span>
                </label>
                <input type="text" name="scopeFieldName" id="scopeFieldName" value="cbms">
                <br>

                <label for="collectionFieldName" class="tooltip">Collection Field Name:
                    <span class="tooltiptext">This filed will be used to store the name of the collection the document came from. It will be created on each JSON document.</span>
                </label>
                <input type="text" name="collectionFieldName" id="collectionFieldName" value="cbmc">
                <br>

                <label for="format" class="tooltip">Format:
                    <span class="tooltiptext">The format of the dataset specified (lines or list). See the <a href='https://docs.couchbase.com/server/current/tools/cbexport-json.html#dataset-formats'>DATASET FORMATS</a> section for more details on the formats supported.</span>
                </label>
                <select name="format" id="format">
                    <option value="list">JSON Array</option>
                    <option value="lines">JSON Lines</option>
                </select>
                <br>

                <label for="fileDestination" class="tooltip">File Destination Folder:
                    <span class="tooltiptext">Folder where the exported file will be stored</span>
                </label>
                <div class="folder-container">
                    <div class="folder-destination redButton" id="folderDestination" onclick="getFolder()">Choose</div>
                    <input type="text" id="selectedFolder" name="selectedFolder" readonly>
                </div>
                <br>

                <div class="advanced-container">
                    <div class="advanced-header" id="advanced-header">
                    <span class="arrow-icon">▶️</span>
                        Advanced Settings
                    </div>
                    <div class="advanced-settings" id="advanced-settings">
                        <label for="threads" class="tooltip">Threads:
                            <span class="tooltiptext">Specifies the number of concurrent clients to use when exporting data.
                                Fewer clients means exports will take longer, but there will be less cluster resources used to complete the export.
                                More clients means faster exports, but at the cost of more cluster resource usage.
                            </span>
                        </label>
                        <input type="number" name="threads" id="threads" value="4">
                        <br>
                        <div class="verboseLogContainer">
                            <label for="verboseLog" id="verboseLogLabel" class="tooltip">Verbose Log:
                                <span class="tooltiptext">Specifies that detailed logging should be sent to stdout</span>
                            </label>
                            <input type="checkbox" name="verboseLog" id="verboseLog">
                        </div>
                    </div>
                </div>

                <div class="validation-error" id="validation-error"></div>

                <input type="submit" value="Export" onclick="submitForm(event)" class="redButton">
            </form>
        </body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        let scopesSpecData = [];
        function onBucketClick(bucketId) {
            document.getElementById('scopes').setAttribute('disabled',"");
            document.getElementById('collections').setAttribute('disabled',"");
            
            vscode.postMessage({
                command: 'vscode-couchbase.tools.dataExport.getScopes',
                bucketId: bucketId
            });
        }

        function getFolder(){
            vscode.postMessage({
                command: 'vscode-couchbase.tools.dataExport.getFolder'
            });
        }

        function onScopeClick(allScopes) {
            document.getElementById('collections').setAttribute('disabled',"");
            let selectedScopes = [];
            const allScopeCnt = allScopes.length;
            for(let i=0;i<allScopeCnt;i++){
                if(allScopes[i].selected === true){
                    if(i===0){
                        selectedScopes.push("All Scopes");
                    } else{
                        selectedScopes.push(scopesSpecData[i-1]); // scopeSpecData is i-1 for eliminating all scopes
                    } 
                }
            }
            if(selectedScopes.includes("All Scopes")){
                // No Collections Required
                document.getElementById('collections').setAttribute('disabled',"");

            } else {
                const collectionsDropdown = document.getElementById('collections');
                collectionsDropdown.innerHTML = '';
                selectedScopes.map((scopeDetails)=>{
                    // All Collections of the scope
                    const selectAllOption = document.createElement('option');
                    selectAllOption.value = 'All '+scopeDetails.name;
                    selectAllOption.text = 'Select all collections of scope: '+scopeDetails.name;
                    collectionsDropdown.appendChild(selectAllOption);

                    // Individual Collections
                    for(let collection of scopeDetails.collections){
                        const collectionOption = document.createElement('option');
                        collectionOption.value = collection.scopeName + "." + collection.name;
                        collectionOption.text = collection.scopeName + "." + collection.name;
                        collectionsDropdown.appendChild(collectionOption);
                    }
                    
                })
                document.getElementById('collections').removeAttribute('disabled');
            }
        }

        $(document).ready(function() {
            // Initialize Select2 on all dropdowns
            $('.js-select2').select2();
        });

        window.addEventListener('message', event => {
            const message = event.data; // The JSON data our extension sent
        
            switch (message.command) {
                case 'vscode-couchbase.tools.dataExport.scopesInfo':
                    const scopesData = message.scopes;
                    scopesSpecData = scopesData;
                    const scopeDropdown = document.getElementById('scopes');
        
                    // Clear existing options in the scope dropdown
                    scopeDropdown.innerHTML = '';
                    const selectAllOption = document.createElement('option');
                    selectAllOption.value = 'All Scopes';
                    selectAllOption.text = 'Select All';
                    scopeDropdown.appendChild(selectAllOption);
                    
                    // Add scope options
                    scopesData.forEach((scope) => {
                        const option = document.createElement('option');
                        option.value = scope.name;
                        option.text = scope.name;
                        scopeDropdown.appendChild(option);
                    });
                    scopeDropdown.removeAttribute('disabled');
                    break;
                case 'vscode-couchbase.tools.dataExport.folderInfo':
                    const folder = message.folder;
                    document.getElementById("selectedFolder").setAttribute("value", folder);
                    break;
                case 'vscode-couchbase.tools.dataExport.formValidationError':
                    const error = message.error;
                    document.getElementById("validation-error").innerHTML = message.error;
                    break;

            }
        });

        $(document).ready(function () {
            $("#advanced-header").click(function () {
                $("#advanced-settings").toggleClass("active");
                const arrowIcon = $(".arrow-icon");
                arrowIcon.text(arrowIcon.text() === "▶️" ? "▼" : "▶️");
            });
        });

        function submitForm(event) {
            event.preventDefault(); // Prevent the form from submitting in the traditional way
            document.getElementById("validation-error").innerHTML = "";
            // Gather data from form fields
            const bucket = document.getElementById('bucket').value;
            const scopes = Array.from(document.getElementById('scopes').selectedOptions).map(option => option.value);
            const collections = Array.from(document.getElementById('collections').selectedOptions).map(option => option.value);
            const documentsKeyField = document.getElementById('documentsKeyField').value;
            const scopeFieldName = document.getElementById('scopeFieldName').value;
            const collectionFieldName = document.getElementById('collectionFieldName').value;
            const format = document.getElementById('format').value;
            const fileDestination = document.getElementById('selectedFolder').value;
            const threads = document.getElementById('threads').value;
            const verboseLog =  document.getElementById('verboseLog').checked;
            // Consolidate the data into an object
            const formData = {
                bucket,
                scopes,
                collections,
                documentsKeyField,
                scopeFieldName,
                collectionFieldName,
                format,
                fileDestination,
                threads,
                verboseLog
            };
            vscode.postMessage({
                command: 'vscode-couchbase.tools.dataExport.runExport',
                data: formData
            });
        } 

    </script>
    </html>
    `;
};
