export interface NodeConfig {
  id: string;
  clusterId?: string;
  [key: string]: any;
}
export interface EdgeConfig {
  source: string;
  target: string;
  weight?: number;
  [key: string]: any;
}

export interface GraphData {
  nodes?: NodeConfig[];
  edges?: EdgeConfig[];
}
