import networkx as nx
from typing import List, Dict


def build_course_graph(catalog: list) -> nx.DiGraph:
    G = nx.DiGraph()
    catalog_ids = {course["id"] for course in catalog}

    for course in catalog:
        G.add_node(
            course["id"],
            skill=course.get("skill", ""),
            title=course.get("title", course.get("skill", "")),
            estimated_hours=course.get("estimated_hours", 0),
            level=course.get("level", "beginner"),
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

    # Step 3: Identify target courses from gap_skills and map gap scores
    gap_score_map: Dict[str, float] = {}
    target_course_ids = set()
    for gap in gap_skills:
        gap_name = gap["skill"].lower()
        gap_score = gap.get("gap_score", 0.5)
        for course in catalog:
            if course.get("skill", "").lower() == gap_name:
                target_course_ids.add(course["id"])
                gap_score_map[course["id"]] = gap_score
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

    # Step 6: Topologically sort remaining courses
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
            "order": order,
            "course_id": course_id,
            "skill": node.get("skill", ""),
            "title": node.get("title", ""),
            "estimated_hours": hours,
            "level": node.get("level", "beginner"),
            "gap_relevance": gap_score_map.get(course_id, 0.0),
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
