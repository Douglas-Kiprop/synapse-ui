import React, { useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import ConditionNode  from "./nodes/ConditionNode";
import  GroupNode  from "./nodes/GroupNode";
import { LogicNodeGroup, LogicNodeRef, BaseCondition } from "@/types/builder";
import { ensureGroupHasId, updateGroupInTree, removeGroupFromTree, removeRefFromTree } from "@/lib/builderutils";

const nodeTypes = { condition: ConditionNode, group: GroupNode };

interface LogicTreeFlowProps {
  conditions: BaseCondition[];
  logicTree: LogicNodeGroup;
  onConditionsChange: (c: BaseCondition[]) => void;
  onLogicTreeChange: (t: LogicNodeGroup) => void;
  onAddConditionToGroup: (id: string) => void;
  onAddGroupToGroup: (id: string) => void;
}

export function LogicTreeFlow({
  conditions, logicTree, onConditionsChange, onLogicTreeChange, onAddConditionToGroup, onAddGroupToGroup
}: LogicTreeFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const buildFlow = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();
    let xCounter = 0;

    const traverse = (node: LogicNodeGroup | LogicNodeRef, parentId: string | null, depth: number) => {
      const isRef = "ref" in node;
      const id = isRef ? (node as LogicNodeRef).ref : (node as LogicNodeGroup).id;
      
      if (!id) return;
      if (visitedNodes.has(id)) return;
      visitedNodes.add(id);

      const positionX = xCounter * 320;
      const positionY = depth * 180;

      if (isRef) {
        const cond = conditions.find((c: any) => c.id === id);
        if (cond) {
            newNodes.push({
                id: cond.id, type: 'condition', position: { x: positionX, y: positionY },
                data: {
                    condition: cond,
                    onUpdate: (u: BaseCondition) => onConditionsChange(conditions.map((c: any) => c.id === u.id ? u : c)),
                    onRemove: (rid: string) => {
                        onConditionsChange(conditions.filter((c: any) => c.id !== rid));
                        onLogicTreeChange(removeRefFromTree(logicTree, rid));
                    }
                }
            });
            xCounter++;
        }
      } else {
        const group = ensureGroupHasId(node as LogicNodeGroup);
        const currentX = positionX;
        
        newNodes.push({
            id: group.id!, type: 'group', position: { x: currentX, y: positionY },
            data: {
                group,
                onUpdate: (g: LogicNodeGroup) => onLogicTreeChange(updateGroupInTree(logicTree, g)),
                onRemove: () => parentId ? onLogicTreeChange(removeGroupFromTree(logicTree, group.id!)) : onLogicTreeChange({ ...group, conditions: [] }),
                onAddCondition: onAddConditionToGroup,
                onAddGroup: onAddGroupToGroup
            }
        });

        if (parentId) {
             const edgeId = `${parentId}-${group.id}`;
             if (!visitedEdges.has(edgeId)) {
                newEdges.push({ id: edgeId, source: parentId, target: group.id!, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } });
                visitedEdges.add(edgeId);
             }
        }

        if (group.conditions && group.conditions.length > 0) {
            group.conditions.forEach((child) => {
                const childId = "ref" in child ? child.ref : (child as LogicNodeGroup).id;
                if(childId) {
                    const edgeId = `${group.id}-${childId}`;
                    if(!visitedEdges.has(edgeId)) {
                        newEdges.push({ id: edgeId, source: group.id!, target: childId, type: 'default', style: { stroke: '#94a3b8', strokeWidth: 2 } });
                        visitedEdges.add(edgeId);
                    }
                    traverse(child, group.id!, depth + 1);
                }
            });
        } else {
             xCounter++;
        }
      }
    };

    traverse(logicTree, null, 0);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [conditions, logicTree, setNodes, setEdges, onConditionsChange, onLogicTreeChange]);

  useEffect(() => { buildFlow(); }, [buildFlow]);

  return (
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView attributionPosition="bottom-right" defaultEdgeOptions={{ type: 'smoothstep', animated: true }}>
      <Background color="#94a3b8" gap={20} size={1} variant={BackgroundVariant.Dots} />
      <Controls />
      <MiniMap style={{ height: 100 }} zoomable pannable />
    </ReactFlow>
  );
}

export default LogicTreeFlow;