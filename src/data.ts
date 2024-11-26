import chroma from "chroma-js";
import { edgeList } from "./dataset/edge";
import { nodeList } from "./dataset/node";
export type Node = {
  [key: string]: unknown;
  id: string;
  label?: string;
  value?: number;
  language?: string;
  description?: string;
};

export type Link = {
  [key: string]: unknown;
  id: string;
  source: string;
  target: string;
  time?: string;
  width?: number;
  color?: string;
  forwards?: number;
};

// Define min and max values for the colormap range
//const minNodeValue = Math.min(...nodeList.map(node => node.value));
//export const maxNodeValue = Math.max(...nodeList.map(node => node.value));


export const links: Link[] = edgeList.map((d) => ({
  id: d.source + "_"+ d.target + "_" + d.id,
  source: d.source,
  target: d.target,
  date: new Date(d.time),
  width: Math.log10(d.forwards + 3),
  forwards: d.forwards,
  views: d.views,
  language: d.language,
  message: d.message,
  url: d.attached_url
}));

export const nodes: Node[] = nodeList.map((d) => ({
  id: d.id,
  group: d.group,
  label: d.label,
  value: d.value,
  language: d.language,
  description: d.discription,
  size: Math.log10(d.value + 3),
}));
