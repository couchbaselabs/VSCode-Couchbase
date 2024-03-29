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
import { Bucket } from "couchbase";
import { IKeyValuePair } from "./IKeyValuePair";
import { CBNode } from "../util/apis/CBNode";

export interface IOverviewGeneral {
  cluster: IKeyValuePair[] | null;
  quota: IKeyValuePair[] | null;
  RAM: IKeyValuePair[] | null;
  storage: IKeyValuePair[] | null;
}
export interface IClusterOverview {
  readonly generalDetails: IOverviewGeneral | null;
  readonly buckets: Bucket[] | null;
  readonly nodes: CBNode[] | null;
  readonly title: string;
  readonly bucketsHTML: IKeyValuePair[];
  readonly nodesHTML: IKeyValuePair[];
  readonly currentConnection: string;
}
