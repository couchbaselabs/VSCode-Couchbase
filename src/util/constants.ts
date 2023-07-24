/*
 *     Copyright 2011-2020 Couchbase, Inc.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
const pkg = require('../../package.json');
export class Constants {
  public static extensionID = "vscode-couchbase";
  public static connectionKeys = "cluster.connections";
  public static notebookType = "couchbase-query-notebook";
  public static capellaUrlPostfix = "cloud.couchbase.com";
  public static prefixSecureURL = "couchbases://";
  public static prefixURL = "couchbase://";
  public static extensionVersion = pkg.version;
  public static COUCHBASEVERSIONKEY = "Couchbase Version";
  public static STATUS = "Status";
  public static SERVICES= "Services";
  public static NODES= "Nodes";
  public static BUCKETS= "Buckets";
  public static OS= "OS";
  public static DATA="Data";
  public static EVENTING="Eventing";
  public static INDEX="Index";
  public static SEARCH="Search";
  public static ANALYTICS="Analytics";
  public static TOTAL="Total";
  public static USED="Used";
  public static QUOTA_TOTAL="Quota Total";
  public static QUOTA_USED="Quota Used";
  public static QUOTA_USED_PER_NODE="Quota Used per Node";
  public static QUOTA_TOTAL_PER_NODE="Quota Total per Node";
  public static USED_BY_DATA="Used by Data";
  public static FREE="Free";
  public static TYPE="Type";
  public static STORAGE_BACKEND="Storage Backend";
  public static REPLICAS="Replicas";
  public static EVICTION_POLICY="Eviction Policy";
  public static DURABILITY_LEVEL="Durability Level";
  public static MAX_TTL="Max TTL";
  public static COMPRESSION_MODE="Compression Mode";
  public static CONFLICT_RESOLUTION="Conflict Resolution";
  public static RAM="RAM";
  public static RAW_RAM="Raw RAM";
  public static OPS_PER_SEC="Ops per Sec";
  public static DISK_FETCHES="Disk Fetches";
  public static DISK_USED="Disk Used";
  public static ITEM_COUNT="Item Count";
  public static MEMORY_USED="Memory Used";
  public static NUM_ACTIVE_VBUCKET_NR="# Active vBukcet Non Residents";
  public static DATA_USED="Data Used";
}
