import { visit } from "unist-util-visit";
import type { Node } from "unist";

export function previewPlugin() {
  return (tree: Node) => {
    visit(tree, (node: Node) => {
      console.log("hi");
    });
  };
}
