STATUS_FLOW = [
    "Applied",
    "Test",
    "Selected",
    "Payment",
    "Offer Letter",
    "Tasks",
    "Final Project",
    "LinkedIn Update",
    "Certificate",
]

PAYMENT_STATUSES = ["Pending", "Order Created", "Paid", "Failed", "Refunded"]

APPLICATION_DECISIONS = ["Approved", "Rejected"]

DEFAULT_TASKS = [
    (
        "Orientation and baseline assessment",
        "Complete onboarding, read the internship handbook, and finish the baseline test.",
    ),
    (
        "Domain mini project",
        "Build a small domain-specific project and submit the repository link.",
    ),
    (
        "Weekly mentor review",
        "Share progress notes and blockers with the assigned mentor.",
    ),
    (
        "Final project submission",
        "Submit the final project repository, demo notes, and deployment link if available.",
    ),
    (
        "LinkedIn completion update",
        "Publish a professional internship completion update and document your work.",
    ),
]

INTERNSHIP_DOMAINS = [
    {
        "name": "Python Development",
        "slug": "python-development",
        "summary": "Backend automation, APIs, scripting, testing, and deployment fundamentals.",
        "duration_weeks": 6,
        "fee": 2499,
        "skills": ["Python", "FastAPI", "SQLite", "APIs"],
    },
    {
        "name": "Web Development MERN Stack",
        "slug": "web-development-mern-stack",
        "summary": "Modern full-stack web apps using MongoDB, Express, React, and Node.",
        "duration_weeks": 8,
        "fee": 2999,
        "skills": ["React", "Node.js", "Express", "MongoDB"],
    },
    {
        "name": "Mobile App Development",
        "slug": "mobile-app-development",
        "summary": "Cross-platform app design, API integration, and release-ready workflows.",
        "duration_weeks": 8,
        "fee": 2999,
        "skills": ["React Native", "API Integration", "UX", "Testing"],
    },
    {
        "name": "Machine Learning and AI",
        "slug": "machine-learning-and-ai",
        "summary": "Model building, evaluation, prompt workflows, and practical AI projects.",
        "duration_weeks": 8,
        "fee": 3499,
        "skills": ["Python", "ML", "NLP", "Model Evaluation"],
    },
    {
        "name": "Data Science and Analytics",
        "slug": "data-science-and-analytics",
        "summary": "Data cleaning, dashboards, statistics, insights, and storytelling.",
        "duration_weeks": 6,
        "fee": 2799,
        "skills": ["Pandas", "SQL", "Visualization", "Analytics"],
    },
    {
        "name": "Cyber Security",
        "slug": "cyber-security",
        "summary": "Security basics, threat modeling, web security, and audit reporting.",
        "duration_weeks": 6,
        "fee": 3299,
        "skills": ["OWASP", "Networking", "Linux", "Security Reports"],
    },
    {
        "name": "Cloud Computing and DevOps",
        "slug": "cloud-computing-and-devops",
        "summary": "Cloud fundamentals, CI/CD, containers, monitoring, and deployment.",
        "duration_weeks": 8,
        "fee": 3499,
        "skills": ["Docker", "CI/CD", "Cloud", "Monitoring"],
    },
    {
        "name": "UI/UX Design",
        "slug": "ui-ux-design",
        "summary": "Research, wireframes, interaction design, prototypes, and design systems.",
        "duration_weeks": 6,
        "fee": 2499,
        "skills": ["Figma", "Research", "Prototyping", "Design Systems"],
    },
    {
        "name": "IoT and Embedded Systems",
        "slug": "iot-and-embedded-systems",
        "summary": "Sensors, microcontrollers, connectivity, firmware, and IoT dashboards.",
        "duration_weeks": 8,
        "fee": 3499,
        "skills": ["Arduino", "Sensors", "Firmware", "MQTT"],
    },
    {
        "name": "PLC and SCADA Automation",
        "slug": "plc-and-scada-automation",
        "summary": "Industrial automation concepts, ladder logic, SCADA screens, and safety.",
        "duration_weeks": 8,
        "fee": 3999,
        "skills": ["PLC", "SCADA", "Ladder Logic", "HMI"],
    },
]
