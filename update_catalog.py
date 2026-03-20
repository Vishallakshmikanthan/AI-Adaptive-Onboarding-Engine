import json
import os

catalog_path = r"c:\Users\visha\Downloads\AI-Adaptive Onboarding Engine\backend\data\course_catalog.json"

extra_links = {
    "python-programming": {"name": "freeCodeCamp Python", "url": "https://www.freecodecamp.org/learn/scientific-computing-with-python/"},
    "python-advanced": {"name": "Corey Schafer Python Tutorials", "url": "https://www.youtube.com/playlist?list=PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU"},
    "javascript": {"name": "freeCodeCamp JavaScript", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/"},
    "typescript": {"name": "Total TypeScript", "url": "https://www.totaltypescript.com/"},
    "react": {"name": "Epic React", "url": "https://epicreact.dev/"},
    "nodejs": {"name": "Node.js Crash Course", "url": "https://www.youtube.com/watch?v=fBNz5xF-Kx4"},
    "java": {"name": "Java Brains", "url": "https://javabrains.io/"},
    "sql": {"name": "Mode SQL Tutorial", "url": "https://mode.com/sql-tutorial/"},
    "sql-advanced": {"name": "StrataScratch SQL", "url": "https://www.stratascratch.com/"},
    "statistics": {"name": "StatQuest with Josh Starmer", "url": "https://statquest.org/"},
    "data-analysis": {"name": "DataCamp Data Analysis", "url": "https://www.datacamp.com/"},
    "data-visualization": {"name": "Towards Data Science: Visualization", "url": "https://towardsdatascience.com/data-visualization/home"},
    "machine-learning": {"name": "fast.ai Machine Learning", "url": "https://course.fast.ai/"},
    "deep-learning": {"name": "Kaggle Deep Learning", "url": "https://www.kaggle.com/learn/intro-to-deep-learning"},
    "nlp": {"name": "Spacy Documentation", "url": "https://spacy.io/"},
    "data-engineering": {"name": "Data Engineer Roadmap", "url": "https://roadmap.sh/data-engineer"},
    "docker": {"name": "TechWorld with Nana Docker", "url": "https://www.youtube.com/watch?v=3c-iBn73dDE"},
    "kubernetes": {"name": "Kubernetes The Hard Way", "url": "https://github.com/kelseyhightower/kubernetes-the-hard-way"},
    "aws": {"name": "A Cloud Guru AWS", "url": "https://acloudguru.com/"},
    "azure": {"name": "Azure Friday", "url": "https://azure.microsoft.com/en-us/resources/videos/azure-friday/"},
    "google-cloud-platform": {"name": "GCP YouTube Channel", "url": "https://www.youtube.com/user/googlecloudplatform"},
    "ci-cd": {"name": "GitLab CI/CD Docs", "url": "https://docs.gitlab.com/ee/ci/"},
    "devops": {"name": "DevOps Directive", "url": "https://devopsdirective.com/"},
    "cloud-security": {"name": "SANS Cloud Security", "url": "https://www.sans.org/cloud-security/"},
    "git": {"name": "Atlassian Git Tutorial", "url": "https://www.atlassian.com/git/tutorials"},
    "linux": {"name": "Linux Foundation Free Courses", "url": "https://training.linuxfoundation.org/resources/?_format=free-course"},
    "computer-networking": {"name": "NetworkChuck Networking Basics", "url": "https://www.youtube.com/playlist?list=PLIhvC56v63IJVXv0GJcl9vO5Z6znCVb1P"},
    "microsoft-excel": {"name": "Excel for Windows Training", "url": "https://support.microsoft.com/en-us/training"},
    "problem-solving": {"name": "Brilliant.org", "url": "https://brilliant.org/"},
    "cybersecurity": {"name": "TryHackMe", "url": "https://tryhackme.com/"},
    "system-design": {"name": "Grokking the System Design Interview", "url": "https://www.educative.io/courses/grokking-the-system-design-interview"},
    "rest-api-design": {"name": "API Design Patterns", "url": "https://apihandyman.io/"},
    "microservices": {"name": "Martin Fowler Microservices", "url": "https://martinfowler.com/articles/microservices.html"},
    "database-design": {"name": "Prisma Data Guide", "url": "https://www.prisma.io/dataguide"},
    "software-testing": {"name": "Ministry of Testing", "url": "https://www.ministryoftesting.com/"},
    "ux-design": {"name": "Law of UX", "url": "https://lawsofux.com/"},
    "agile-methodology": {"name": "Mountain Goat Software", "url": "https://www.mountaingoatsoftware.com/"},
    "project-management": {"name": "Google Project Management Certificate", "url": "https://grow.google/certificates/project-management/"},
    "team-leadership": {"name": "Simon Sinek Leadership Insights", "url": "https://simonsinek.com/"},
    "business-communication": {"name": "LinkedIn Learning Communication Series", "url": "https://www.linkedin.com/learning/topics/communication"},
    "product-management": {"name": "Lenny's Newsletter", "url": "https://www.lennysnewsletter.com/"},
    "financial-management": {"name": "Investopedia Basics", "url": "https://www.investopedia.com/financial-term-dictionary-4769738"},
    "inventory-management": {"name": "TradeGecko Inventory Academy", "url": "https://www.quickbooks.com/inventory-management/"},
    "supply-chain-management": {"name": "Supply Chain Dive", "url": "https://www.supplychaindive.com/"},
    "safety-protocols": {"name": "Safety+Health Magazine", "url": "https://www.safetyandhealthmagazine.com/"},
    "erp-systems": {"name": "ERP Focus", "url": "https://www.erpfocus.com/"},
    "quality-management": {"name": "Quality Digest", "url": "https://www.qualitydigest.com/"},
    "customer-service": {"name": "Zendesk Customer Service Blog", "url": "https://www.zendesk.com/blog/"},
    "forklift-operation": {"name": "Toyota Forklift Safety", "url": "https://www.toyotaforklift.com/resource-library/safety"}
}

# Fallback links
fallback = {"name": "Coursera Generic Courses", "url": "https://www.coursera.org/"}

with open(catalog_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for course in data:
    new_res = extra_links.get(course['id'], fallback)
    # Check if this exact url is already in resources
    if not any(r['url'] == new_res['url'] for r in course.get('resources', [])):
        course.setdefault('resources', []).append(new_res)

with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Course catalog updated successfully!")
