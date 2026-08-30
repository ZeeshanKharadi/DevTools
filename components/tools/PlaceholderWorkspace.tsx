import { ToolWorkspace } from "./ToolWorkspace";
import type { Tool } from "@/lib/tools/types";

type PlaceholderWorkspaceProps = {
  tool: Tool;
};

export function PlaceholderWorkspace({ tool }: PlaceholderWorkspaceProps) {
  return (
    <ToolWorkspace
      label={`${tool.h1} workspace`}
      capabilities={tool.capabilities}
      emptyMessage={`${tool.h1} workspace coming next.`}
    />
  );
}
