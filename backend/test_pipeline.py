import json, traceback
from dotenv import load_dotenv
load_dotenv()

try:
    from services.llm_service import extract_skills_and_gaps
    from services.embed_service import compute_gap_scores
    from services.graph_service import generate_adaptive_pathway
    from database.session_store import save_session

    catalog = json.load(open("data/course_catalog.json"))
    resume = "John Smith - Python, SQL, Git, React developer with 2 years experience. B.E. Computer Science"
    jd = "Senior SWE requiring Java, Machine Learning, Docker, Kubernetes, AWS, CI/CD, System Design"

    print("Step 1: LLM...")
    llm_result = extract_skills_and_gaps(resume, jd, catalog)
    resume_skills = llm_result.get("resume_skills") or []
    jd_skills = llm_result.get("jd_required_skills") or []
    skill_gaps_raw = llm_result.get("skill_gaps") or []
    print(f"  resume_skills={len(resume_skills)}, jd_skills={len(jd_skills)}, gaps={len(skill_gaps_raw)}")

    print("Step 2: Semantic gaps...")
    semantic_gaps = []
    if resume_skills and jd_skills:
        semantic_gaps = compute_gap_scores(resume_skills, jd_skills)
    print(f"  semantic_gaps={len(semantic_gaps)}")

    print("Step 3: Merge gaps...")
    merged = {}
    for gap in skill_gaps_raw:
        skill = gap.get("skill", "")
        catalog_skill = gap.get("catalog_skill") or skill
        severity = float(gap.get("gap_severity", gap.get("gap_score", 0.5)))
        merged[catalog_skill.lower()] = {"skill": skill, "catalog_skill": catalog_skill, "gap_severity": severity, "priority": "high" if severity > 0.6 else "medium"}
    for gap in semantic_gaps:
        skill = gap.get("skill", "")
        catalog_skill = gap.get("catalog_skill") or skill
        severity = float(gap.get("gap_severity", gap.get("gap_score", 0.5)))
        key = catalog_skill.lower()
        if key not in merged or severity > merged[key]["gap_severity"]:
            merged[key] = {"skill": skill, "catalog_skill": catalog_skill, "gap_severity": severity, "priority": "high" if severity > 0.6 else "medium"}
    final_gaps = list(merged.values())
    print(f"  final_gaps={len(final_gaps)}")

    print("Step 4: Generate pathway...")
    known_skills = [s.get("skill", "") for s in resume_skills]
    pathway_result = generate_adaptive_pathway(final_gaps, known_skills, catalog, 120)
    pway = pathway_result.get("pathway", [])
    print(f"  pathway courses={len(pway)}")

    print("Step 5: Save session...")
    session_id = save_session(
        resume_filename="test_resume",
        jd_filename="test_jd",
        resume_skills=resume_skills,
        jd_required_skills=jd_skills,
        skill_gaps=final_gaps,
        pathway=pathway_result,
        reasoning_trace=llm_result.get("reasoning_trace", ""),
        match_score=llm_result.get("match_score", 0)
    )
    print(f"  session_id={session_id}")

    print("ALL STEPS PASSED")
except Exception as e:
    traceback.print_exc()
