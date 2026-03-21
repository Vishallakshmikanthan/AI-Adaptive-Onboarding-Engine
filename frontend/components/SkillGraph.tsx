"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface SkillGraphProps {
  resumeSkills: Array<{ skill: string; level: string }>;
  jdSkills: Array<{ skill: string; priority: string }>;
  gaps: Array<{ skill: string; gap_severity: number }>;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: "owned" | "gap";
  level?: string;
  severity?: number;
  radius: number;
  color: string;
  glow?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

function getGapNodeStyle(severity: number) {
  if (severity >= 0.7) return { color: "#EF4444", radius: 18, glow: "rgba(239,68,68,0.4)" };
  if (severity >= 0.4) return { color: "#F59E0B", radius: 16, glow: "rgba(245,158,11,0.3)" };
  return { color: "#8892A4", radius: 14 };
}

export default function SkillGraph({ resumeSkills, jdSkills, gaps }: SkillGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
    sub: string;
    visible: boolean;
  }>({ x: 0, y: 0, text: "", sub: "", visible: false });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = 400;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Build nodes
    const gapSkillSet = new Set(gaps.map((g) => g.skill.toLowerCase()));
    const resumeSet = new Set(resumeSkills.map((r) => r.skill.toLowerCase()));

    const nodes: GraphNode[] = [];
    const nodeIds = new Set<string>();

    resumeSkills.forEach((r) => {
      const id = r.skill.toLowerCase();
      if (nodeIds.has(id)) return;
      nodeIds.add(id);
      nodes.push({
        id: r.skill,
        type: "owned",
        level: r.level,
        radius: 20,
        color: "#10B981",
        glow: "rgba(16,185,129,0.4)",
      });
    });

    gaps.forEach((g) => {
      const id = g.skill.toLowerCase();
      if (nodeIds.has(id)) return;
      nodeIds.add(id);
      const style = getGapNodeStyle(g.gap_severity);
      nodes.push({
        id: g.skill,
        type: "gap",
        severity: g.gap_severity,
        ...style,
      });
    });

    jdSkills.forEach((j) => {
      const id = j.skill.toLowerCase();
      if (nodeIds.has(id)) return;
      nodeIds.add(id);
      if (!resumeSet.has(id) && !gapSkillSet.has(id)) {
        nodes.push({
          id: j.skill,
          type: "gap",
          severity: 0.3,
          ...getGapNodeStyle(0.3),
        });
      }
    });

    // Build links — connect skills that share a type or are related via JD
    const links: GraphLink[] = [];
    const ownedNodes = nodes.filter((n) => n.type === "owned");
    const gapNodes = nodes.filter((n) => n.type === "gap");

    // Link each gap to 1-2 random owned skills (simulates relationships)
    gapNodes.forEach((gn, i) => {
      if (ownedNodes.length > 0) {
        links.push({ source: gn.id, target: ownedNodes[i % ownedNodes.length].id });
      }
      if (ownedNodes.length > 1) {
        links.push({ source: gn.id, target: ownedNodes[(i + 1) % ownedNodes.length].id });
      }
    });

    // Link owned skills in a chain
    for (let i = 0; i < ownedNodes.length - 1; i++) {
      links.push({ source: ownedNodes[i].id, target: ownedNodes[i + 1].id });
    }

    // Defs for glow filters
    const defs = svg.append("defs");

    nodes.forEach((n) => {
      if (!n.glow) return;
      const filter = defs
        .append("filter")
        .attr("id", `glow-${n.id.replace(/[^a-zA-Z0-9]/g, "_")}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", "4")
        .attr("result", "blur");
      filter
        .append("feMerge")
        .selectAll("feMergeNode")
        .data(["blur", "SourceGraphic"])
        .enter()
        .append("feMergeNode")
        .attr("in", (d) => d);
    });

    // Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .strength(0.3)
      )
      .force("charge", d3.forceManyBody<GraphNode>().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<GraphNode>().radius(40));

    const g = svg.append("g");

    // Links
    const link = g
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#4F9EF8")
      .attr("stroke-opacity", 0.15)
      .attr("stroke-width", 1);

    // Node groups
    const nodeGroup = g
      .selectAll<SVGGElement, GraphNode>("g.node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Glow ring
    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius + 8)
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.2);

    // Main circle
    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => d.color)
      .attr("filter", (d) =>
        d.glow ? `url(#glow-${d.id.replace(/[^a-zA-Z0-9]/g, "_")})` : null
      );

    // Labels
    nodeGroup
      .append("text")
      .text((d) => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.radius + 16)
      .attr("fill", "white")
      .attr("font-size", "11px")
      .attr("font-family", "var(--font-dm-sans), system-ui, sans-serif")
      .attr("pointer-events", "none");

    // Hover interactivity
    const svgEl = svgRef.current;
    nodeGroup
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(150).attr("transform", function () {
          return `translate(${d.x},${d.y}) scale(1.3)`;
        });
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setTooltip({
            x: event.clientX - containerRect.left + 12,
            y: event.clientY - containerRect.top - 10,
            text: d.id,
            sub:
              d.type === "owned"
                ? `Level: ${d.level || "Known"}`
                : `Gap severity: ${Math.round((d.severity || 0) * 100)}%`,
            visible: true,
          });
        }
      })
      .on("mousemove", function (event) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          setTooltip((prev) => ({
            ...prev,
            x: event.clientX - containerRect.left + 12,
            y: event.clientY - containerRect.top - 10,
          }));
        }
      })
      .on("mouseout", function (event, d) {
        d3.select(this).transition().duration(150).attr("transform", `translate(${d.x},${d.y}) scale(1)`);
        setTooltip((prev) => ({ ...prev, visible: false }));
      });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [resumeSkills, jdSkills, gaps]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: 400, background: "#060810", borderRadius: 16 }}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none bg-[#0D1117] border border-[rgba(79,158,248,0.2)] rounded-lg px-3 py-2 text-xs text-white z-50"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-semibold">{tooltip.text}</div>
          <div className="text-[var(--text-secondary)] mt-0.5">{tooltip.sub}</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[10px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
          You have this
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block" />
          Skill gap
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
          Partial gap
        </span>
      </div>
    </div>
  );
}
