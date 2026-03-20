import networkx as nx
from typing import List, Dict


def build_course_graph(catalog: list) -> nx.DiGraph:
    G = nx.DiGraph()
    catalog_ids = {course["id"] for course in catalog}

    for course in catalog:
        G.add_node(
            course["id"],
            skill=course.get("skill", ""),
            display_name=course.get("display_name", course.get("skill", "")),
            estimated_hours=course.get("estimated_hours", 0),
            level=course.get("level", "beginner"),
            category=course.get("category", "fundamentals"),
            description=course.get("description", ""),
        )

    for course in catalog:
        for prereq_id in course.get("prerequisites", []):
            if prereq_id in catalog_ids:
                G.add_edge(prereq_id, course["id"])

    return G


def find_prerequisite_chain(G: nx.DiGraph, target_id: str) -> list:
    ancestors = nx.ancestors(G, target_id)
    subgraph_nodes = ancestors | {target_id}
    subgraph = G.subgraph(subgraph_nodes)
    return list(nx.topological_sort(subgraph))


def generate_adaptive_pathway(
    gap_skills: list,
    known_skills: list,
    catalog: list,
    max_hours: int = 120,
) -> dict:
    # Step 1: Build graph from catalog
    G = build_course_graph(catalog)

    # Step 2: Identify known course IDs by matching skill names
    known_skill_names = {s.lower() for s in known_skills}
    known_course_ids = set()
    for course in catalog:
        if course.get("skill", "").lower() in known_skill_names:
            known_course_ids.add(course["id"])

    # Step 3: Identify target courses from gap_skills and build gap_map
    # Key: course_id → gap_severity (sourced from catalog_skill matching)
    gap_map: Dict[str, float] = {}
    target_course_ids = set()
    for gap in gap_skills:
        catalog_skill = gap.get("catalog_skill", gap.get("skill", "")).lower()
        gap_severity = float(gap.get("gap_severity", 0.0))
        for course in catalog:
            if course.get("skill", "").lower() == catalog_skill:
                target_course_ids.add(course["id"])
                gap_map[course["id"]] = gap_severity
                break

    # Step 4: Collect all required courses (targets + their prerequisite chains)
    required_ids = set()
    for target_id in target_course_ids:
        if target_id in G:
            chain = find_prerequisite_chain(G, target_id)
            required_ids.update(chain)

    # Step 5: Remove known courses
    courses_skipped = len(required_ids & known_course_ids)
    required_ids -= known_course_ids

    # Step 6: Topologically sort remaining courses (deterministic order)
    subgraph = G.subgraph(required_ids)
    sorted_ids = list(nx.topological_sort(subgraph))

    # Step 7: Build pathway respecting max_hours
    pathway = []
    total_hours = 0
    order = 1

    for course_id in sorted_ids:
        node = G.nodes[course_id]
        hours = node.get("estimated_hours", 0)

        if total_hours + hours > max_hours:
            break

        pathway.append({
            "id": course_id,
            "skill": node.get("skill", ""),
            "display_name": node.get("display_name", node.get("skill", "")),
            "level": node.get("level", "beginner"),
            "estimated_hours": hours,
            "category": node.get("category", "fundamentals"),
            "description": node.get("description", ""),
            "order": order,
            "gap_relevance": gap_map.get(course_id, 0.0),
        })

        total_hours += hours
        order += 1

    return {
        "pathway": pathway,
        "total_courses": len(pathway),
        "total_estimated_hours": total_hours,
        "courses_skipped": courses_skipped,
        "efficiency_gain": f"{courses_skipped} courses skipped based on existing skills",
    }
