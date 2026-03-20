# AI-Adaptive Onboarding Engine - Progress Report

## FULL PROJECT SCOPE — WHAT NEEDS TO EXIST

### BACKEND FILES (Python/FastAPI)
- [x] `backend/main.py` — FastAPI app entry point with CORS middleware
- [~] `backend/.env` — Environment variables (Has keys, needs verification)
- [x] `backend/requirements.txt` — All Python dependencies
- [x] `backend/routers/parse.py` — File upload and text extraction (PDF + DOCX support)
- [ ] `backend/routers/gap.py` — Skill gap analysis endpoint
- [x] `backend/routers/pathway.py` — Main analyze endpoint that ties everything together
- [x] `backend/services/llm_service.py` — OpenRouter API integration for skill extraction
- [x] `backend/services/embed_service.py` — BERT sentence-transformers for semantic matching
- [x] `backend/services/graph_service.py` — NetworkX DAG algorithm for learning pathway
- [~] `backend/data/course_catalog.json` — (File exists but size indicates it lacks 50 courses)

### FRONTEND FILES (Next.js 14 + TypeScript + Tailwind)
- [x] `frontend/app/page.tsx` — Home page with drag and drop upload zones
- [ ] `frontend/app/roadmap/page.tsx` — Roadmap visualizer page
- [x] `frontend/app/layout.tsx` — Root layout with dark theme
- [ ] `frontend/components/UploadZone.tsx` — Drag and drop file upload component
- [ ] `frontend/components/RoadmapTimeline.tsx` — Visual timeline of courses
- [x] `frontend/components/ReasoningTrace.tsx` — Collapsible AI reasoning panel
- [x] `frontend/.env.local` — NEXT_PUBLIC_API_URL

### ROOT FILES
- [x] `Dockerfile` — Docker container for backend
- [x] `.gitignore` — Excludes .env, node_modules, venv
- [ ] `README.md` — Setup instructions, algorithm explanation, dataset citations

### DATABASE (Supabase)
- [ ] `skills_catalog` table created with pgvector extension
- [ ] `analysis_sessions` table created
- [ ] Skills seeded with embeddings

### SUBMISSION DELIVERABLES
- [ ] Demo video recorded (2-3 minutes)
- [ ] 5-slide deck created
- [ ] GitHub repository is public

---

## OVERALL PROGRESS
```text
Backend      ████████░░  80%
Frontend     ████░░░░░░  40%
Database     ░░░░░░░░░░   0%
Submission   ░░░░░░░░░░   0%
OVERALL      ████░░░░░░  35%
```

---

## ⚠️ WARNINGS & NOTICES
1. **Course Catalog Size:** I noticed your `course_catalog.json` is only about 3.9KB. It likely doesn't have the 50 courses required to hit the *Grounding and Reliability* rubric item.
2. **Missing Endpoint Import:** You have `pathway.py` and `parse.py` imported directly in `main.py`, but you're missing `gap.py`.
3. **Time tracking:** A deadline was not specified. Ensure you are tracking time to submission.

---

## TOP 3 NEXT STEPS (Priority Order)

### STEP 1: Implement the Gap Analysis Router Endpoint
**File:** `backend/routers/gap.py`
**Code:**
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.llm_service import call_llm
from services.embed_service import calculate_gap_score

router = APIRouter()

class GapRequest(BaseModel):
    resume_text: str
    jd_text: str
    catalog_skills: List[str]

@router.post("/analyze")
async def analyze_gap(request: GapRequest):
    try:
        # 1. LLM Extraction
        prompt = f"""
        Extract skills from the resume and JD. Map them to the provided catalog skills.
        Catalog skills: {{", ".join(request.catalog_skills)}}
        
        Resume text: {{request.resume_text}}
        
        JD text: {{request.jd_text}}
        
        Return ONLY valid JSON. No explanation. No markdown. No code fences. Start directly with {{
        """
        
        llm_result = call_llm(prompt)
        
        # 2. Local BERT Semantic Gap Finding
        resume_skills_list = [s.get("skill", "") for s in llm_result.get("resume_skills", [])]
        jd_skills_list = [s.get("skill", "") for s in llm_result.get("jd_required_skills", [])]
        
        semantic_gaps = []
        for jd_skill in jd_skills_list:
            if not resume_skills_list:
                semantic_gaps.append({{"skill": jd_skill, "gap_score": 1.0, "reason": "No resume skills found"}})
                continue
                
            similarity = calculate_gap_score(jd_skill, resume_skills_list)
            gap_score = 1.0 - similarity
            
            # Rule: Only flag gaps > 0.3
            if gap_score > 0.3:
                semantic_gaps.append({{
                    "skill": jd_skill, 
                    "gap_score": round(gap_score, 2),
                    "reason": f"Semantic mismatch (Score: {{round(gap_score, 2)}})"
                }})
                
        llm_result["semantic_gaps"] = semantic_gaps
        return {{"status": "success", "data": llm_result}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### STEP 2: Create the Drag and Drop Component
**File:** `frontend/components/UploadZone.tsx`
**Code:**
```tsx
"use client";
import { useState, useCallback } from "react";

export default function UploadZone({ onUploadSuccess }: { onUploadSuccess: (data: any) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setLoading(true);
      
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/parse/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        onUploadSuccess(data);
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setLoading(false);
      }
    }
  }, [onUploadSuccess]);

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
        isDragging ? "border-[#2E86AB] bg-[#2E86AB]/10" : "border-gray-600 bg-[#1A2035]"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center space-y-4">
        <svg className="w-12 h-12 text-[#2E86AB]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        <p className="text-gray-300 font-medium">
          {loading ? "Processing Document..." : "Drag and drop your PDF/DOCX here"}
        </p>
      </div>
    </div>
  );
}
```

### STEP 3: Setup the Roadmap Visualizer Scaffold
**File:** `frontend/app/roadmap/page.tsx`
**Code:**
```tsx
"use client";
import { useEffect, useState } from "react";
import ReasoningTrace from "@/components/ReasoningTrace";

export default function RoadmapPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("pathway_data");
    if (stored) setData(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white p-8 font-sans">
      <header className="mb-10 flex justify-between items-center border-b border-gray-700 pb-6">
        <h1 className="text-3xl font-bold">Your Learning Pathway</h1>
        <div className="flex gap-4 text-sm font-semibold">
          <span className="bg-[#1A2035] px-4 py-2 rounded-lg text-[#2E86AB]">Total Courses: {data?.courses?.length || 0}</span>
          <span className="bg-[#1A2035] px-4 py-2 rounded-lg text-[#F18F01]">Skipped: {data?.skipped || 0}</span>
          <span className="bg-[#1A2035] px-4 py-2 rounded-lg text-green-400">Match Score: {data?.match_score || 0}%</span>
        </div>
      </header>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <main className="flex-1 rounded-xl bg-[#1A2035] p-6 text-center text-gray-400">
           [Timeline Component Scaffold]
        </main>
        
        <aside className="w-full lg:w-96">
          {data?.reasoning_trace && <ReasoningTrace trace={data.reasoning_trace} />}
        </aside>
      </div>
    </div>
  );
}
```
