import { IClusterOverview } from "../types/IClusterOverview";
import * as vscode from "vscode";
import * as path from "path";
export function getClusterOverview(overview: IClusterOverview, context: vscode.ExtensionContext, styleSrc: vscode.Uri): string {
   return `
    <!DOCTYPE html>
    <html lang="en">
       <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${overview.Title}</title>
          <link rel="stylesheet" href="${styleSrc}" type="text/css">
          <style>
             h3 {
             display: inline;
             }
          </style>
       </head>
       <body>
          
         <div class="container">
            <div class="sidebar">
               <div class="sidebar-list-container">
                  <div class="sidebar-list-header">
                     Overview
                  </div>
                  <div class="sidebar-list-values-container">
                     <div class="sidebar-list-value focussed" id="general-overview" onClick="showContainer('Overview','')">
                        General
                     </div>
                  </div>
               </div>
               <div class="sidebar-list-container">
                  <div class="sidebar-list-header">
                     Nodes
                  </div>
                  <div class="sidebar-list-values-container">
                     ${overview.Nodes?.map((node, index) =>
                        (`<div class="sidebar-list-value" id="nodes-${index}" onClick="showContainer('Node','${node.hostname}')">
                           ${node.hostname}
                        </div>`)).join('')
                     }
                  </div>
               </div>
               <div class="sidebar-list-container">
                  <div class="sidebar-list-header">
                     Buckets
                  </div>
                  <div class="sidebar-list-values-container">
                     ${overview.Buckets?.map((bucket, index) =>
                     (`<div class="sidebar-list-value" id="buckets-${index}" onClick="showContainer('Bucket','${bucket.name}')">
                           ${bucket.name}
                        </div>`)).join('')
                     }
                  </div>
               </div>
            </div>
            <div class="main-section">
               <div id="Overview-tab">
                  <div class="general-cluster no-flex">
                     ${overview.GeneralDetails?.Cluster?.map((kv, index) =>
                        (`<div class="field" id=general-cluster-${index}">
                              <div class="field-label">
                                 ${kv.key}:
                              </div>
                              <div class="field-value">
                                 ${kv.value}
                              </div>
                          </div>
                        `)).join('')}
                  </div>
                  <div class="separator-container">
                     <span class="separator-text">Quota</span>
                     <div class="separator"></div>
                  </div>
                  <div class="general-quota flex">
                     ${overview.GeneralDetails?.Quota?.map((kv, index) =>
                        (`<div class="field" id=general-quota-${index}">
                              <div class="field-label">
                                 ${kv.key}:
                              </div>
                              <div class="field-value">
                                 ${kv.value}
                              </div>
                          </div>
                        `)).join('')}
                  </div>
                  <div class="separator-container">
                     <span class="separator-text">RAM</span>
                     <div class="separator"></div>
                  </div>
                  <div class="general-ram flex">
                     ${overview.GeneralDetails?.RAM?.map((kv, index) =>
                        (`<div class="field" id=general-ram-${index}">
                              <div class="field-label">
                                 ${kv.key}:
                              </div>
                              <div class="field-value">
                                 ${kv.value}
                              </div>
                          </div>
                        `)).join('')}
                  </div>
                  <div class="separator-container">
                     <span class="separator-text">Storage</span>
                     <div class="separator"></div>
                  </div>
                  <div class="general-storage flex">
                     ${overview.GeneralDetails?.Storage?.map((kv, index) =>
                        (`<div class="field" id=general-storage-${index}">
                              <div class="field-label">
                                 ${kv.key}:
                              </div>
                              <div class="field-value">
                                 ${kv.value}
                              </div>
                          </div>
                        `)).join('')}
                  </div>
               </div>
               <div id="Bucket-tab"> </div>
               <div id="Node-tab"> </div>
            </div>
         </div>
       </body>
       <script>
       const vscode = acquireVsCodeApi();
       let allSidebarListItems = Array.from(document.querySelectorAll(".sidebar-list-value"));
            allSidebarListItems.map((item) =>
               item.addEventListener("click", () => {
                  deselectAllSidebars(item);
               })
            );
            function deselectAllSidebars(current_target) {
               allSidebarListItems.map((item) => {
                 if (current_target !== item) {
                   const togglerBtn = item;
                   togglerBtn.classList.remove("focussed");
                 } else {
                  const togglerBtn = item;
                  togglerBtn.classList.add("focussed");
                 }
               });
             }
         function showContainer(header, subheader) {
            
            if (header === "Overview"){
               document.getElementById("Node-tab").hidden = true;
               document.getElementById("Bucket-tab").hidden = true;
               document.getElementById("Overview-tab").hidden = false;
               

            } else if (header === "Bucket"){
               document.getElementById("Node-tab").hidden = true;
               document.getElementById("Overview-tab").hidden = true;
               document.getElementById("Bucket-tab").hidden = false;

               let currentBucketHTML = "";
               let buckets = [${overview.BucketsHTML.map((kv)=>{
                  return JSON.stringify(kv);
               })}];

               for (bucket of buckets) {
                  if(bucket.key === subheader){
                     currentBucketHTML = bucket.value
                     break;
                  }
               }
               document.getElementById("Bucket-tab").innerHTML = currentBucketHTML;
               
            } else if (header === "Node") {
               document.getElementById("Bucket-tab").hidden = true;
               document.getElementById("Overview-tab").hidden = true;
               document.getElementById("Node-tab").hidden = false;

               let currentNodeHTML = "";
               let nodes = [${overview.NodesHTML.map((kv)=>{
                  return JSON.stringify(kv);
               })}];
               
               for (node of nodes) {
                  if(node.key === subheader){
                     currentNodeHTML = node.value;
                     break;
                  }
               }
               document.getElementById("Node-tab").innerHTML = currentNodeHTML;
            }
         }
      
         
       </script>
    </html>`;
}
