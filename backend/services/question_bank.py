"""
Question bank organized by topic and difficulty level.
Supports adaptive difficulty progression.
"""

import random

QUESTIONS = {
    "HR": {
        "Fresher": [
            "Tell me about yourself.",
            "Why do you want to work at our company?",
            "What are your strengths and weaknesses?",
            "Where do you see yourself in 5 years?",
            "Why should we hire you?",
            "Tell me about a time you worked in a team.",
            "How do you handle stress and pressure?",
            "What motivates you?",
        ],
        "Mid": [
            "Describe a conflict you had with a coworker and how you resolved it.",
            "Tell me about a time you failed and what you learned.",
            "How do you prioritize tasks when you have multiple deadlines?",
            "Describe your leadership style.",
            "How do you handle constructive criticism?",
            "Tell me about a project you're most proud of.",
            "How do you stay updated with industry trends?",
        ],
        "Senior": [
            "How do you mentor junior team members?",
            "Describe a time you had to make a difficult decision with incomplete data.",
            "How do you handle disagreements with your manager?",
            "Tell me about a time you had to influence stakeholders without direct authority.",
            "How do you balance technical debt with feature delivery?",
            "Describe your approach to building and leading high-performing teams.",
        ],
        "Staff": [
            "How do you drive organizational change across multiple teams?",
            "Describe a time you had to align competing business priorities.",
            "How do you evaluate and introduce new technologies at scale?",
            "Tell me about a strategic decision that had company-wide impact.",
            "How do you build a culture of innovation and continuous improvement?",
        ],
    },
    "DSA": {
        "Fresher": [
            "What is the difference between an array and a linked list?",
            "Explain how a stack works. Give a real-world example.",
            "What is the time complexity of binary search?",
            "How does a hash map work internally?",
            "What is recursion? Give an example.",
            "Explain the difference between BFS and DFS.",
            "What is a queue and where is it used?",
            "What is Big O notation and why does it matter?",
        ],
        "Mid": [
            "How would you detect a cycle in a linked list?",
            "Explain the difference between merge sort and quicksort.",
            "How would you find the shortest path in a weighted graph?",
            "Describe how a balanced BST maintains its height.",
            "Explain dynamic programming with an example problem.",
            "How would you design an LRU cache?",
            "What is the difference between a heap and a BST?",
        ],
        "Senior": [
            "Explain the amortized time complexity of a dynamic array.",
            "How would you solve the traveling salesman problem for a small input?",
            "Describe a trie and its applications in real systems.",
            "Explain the Boyer-Moore string matching algorithm.",
            "How would you implement a concurrent hash map?",
            "Describe the A* search algorithm and when you'd use it.",
        ],
        "Staff": [
            "How do you choose the right data structure for a system processing millions of events per second?",
            "Explain how you would design a distributed sorting system.",
            "Describe probabilistic data structures and their tradeoffs.",
            "How does garbage collection affect algorithm performance at scale?",
            "Explain the CAP theorem's relationship to distributed data structures.",
        ],
    },
    "System Design": {
        "Fresher": [
            "What is the difference between SQL and NoSQL databases?",
            "Explain what a REST API is.",
            "What is caching and why is it useful?",
            "What is a load balancer?",
            "Explain the client-server architecture.",
            "What is the difference between horizontal and vertical scaling?",
            "What is a CDN and how does it work?",
        ],
        "Mid": [
            "Design a URL shortener like bit.ly.",
            "How would you design a notification system?",
            "Design a rate limiter for an API.",
            "How would you design a chat application?",
            "Explain the difference between monolithic and microservice architectures.",
            "How would you design a file storage service like Google Drive?",
        ],
        "Senior": [
            "Design Twitter's newsfeed system.",
            "How would you design a real-time collaborative document editor?",
            "Design a distributed task scheduling system.",
            "How would you architect a payment processing system?",
            "Design a search autocomplete system at scale.",
            "How would you design a video streaming platform?",
        ],
        "Staff": [
            "How would you design a global-scale event streaming platform?",
            "Design a multi-region database with strong consistency guarantees.",
            "How would you architect a machine learning platform for a large organization?",
            "Design a system that handles 10 million concurrent WebSocket connections.",
            "How would you migrate a monolith to microservices without downtime?",
        ],
    },
    "Behavioral": {
        "Fresher": [
            "Tell me about a time you had to learn something new quickly.",
            "Describe a project where you took initiative.",
            "How do you handle tight deadlines?",
            "Tell me about a time you received feedback and acted on it.",
            "Describe a situation where you had to work with someone difficult.",
        ],
        "Mid": [
            "Tell me about a time you went above and beyond at work.",
            "Describe a situation where you had to persuade others to adopt your idea.",
            "How did you handle a project that was going off track?",
            "Tell me about a time you had to make a trade-off between quality and speed.",
            "Describe a situation where you identified and solved a problem proactively.",
        ],
        "Senior": [
            "Tell me about a time you had to deliver bad news to a stakeholder.",
            "Describe a situation where you had to navigate organizational politics.",
            "How do you handle burnout in yourself and your team?",
            "Tell me about a strategic mistake you made and how you recovered.",
            "Describe a time you had to balance technical vision with business needs.",
        ],
        "Staff": [
            "Tell me about a time you transformed how an organization approaches a problem.",
            "Describe a situation where you had to build consensus across competing teams.",
            "How do you evaluate the long-term impact of technical decisions?",
            "Tell me about a time you championed diversity and inclusion in your team.",
            "Describe a situation where you had to sunset a product or technology.",
        ],
    },
    "Frontend": {
        "Fresher": [
            "What is the difference between HTML, CSS, and JavaScript?",
            "Explain the box model in CSS.",
            "What is the DOM and how does JavaScript interact with it?",
            "What is the difference between let, const, and var?",
            "Explain what responsive design means.",
            "What are semantic HTML elements?",
        ],
        "Mid": [
            "Explain the virtual DOM and how React uses it.",
            "What is the difference between state and props in React?",
            "How does event delegation work?",
            "Explain the concept of closures in JavaScript.",
            "What are Web Workers and when would you use them?",
            "How do you optimize the performance of a React application?",
        ],
        "Senior": [
            "Explain micro-frontend architecture.",
            "How would you implement code splitting in a large React app?",
            "Describe your approach to design system architecture.",
            "How do you handle state management in a complex application?",
            "Explain server-side rendering vs client-side rendering tradeoffs.",
        ],
        "Staff": [
            "How would you architect the frontend for a platform serving 100M users?",
            "Describe your approach to frontend observability and monitoring.",
            "How do you balance developer experience with end-user performance?",
            "Explain your strategy for cross-team frontend architecture governance.",
        ],
    },
    "Backend": {
        "Fresher": [
            "What is an API and how does it work?",
            "Explain the difference between GET and POST requests.",
            "What is a database index and why is it important?",
            "What is middleware in a web framework?",
            "Explain what CORS is and why it exists.",
            "What is the difference between authentication and authorization?",
        ],
        "Mid": [
            "How do you handle database migrations in production?",
            "Explain the concept of connection pooling.",
            "How would you implement pagination for a large dataset?",
            "What is an ORM and what are its tradeoffs?",
            "How do you handle background job processing?",
            "Explain the difference between optimistic and pessimistic locking.",
        ],
        "Senior": [
            "How do you design an API versioning strategy?",
            "Explain the saga pattern for distributed transactions.",
            "How would you implement a multi-tenant architecture?",
            "Describe your approach to API security at scale.",
            "How do you handle data consistency in event-driven systems?",
        ],
        "Staff": [
            "How would you architect a backend that handles 1M requests per second?",
            "Describe your approach to platform reliability and SLO management.",
            "How do you drive backend standardization across 50+ microservices?",
            "Explain your strategy for data governance across the organization.",
        ],
    },
}

DIFFICULTY_ORDER = ["Fresher", "Mid", "Senior", "Staff"]


def get_question(topic: str, difficulty: str = "Fresher", exclude: list = None) -> dict:
    """
    Get a random question for the given topic and difficulty.
    Excludes previously asked questions.
    """
    exclude = exclude or []
    topic_questions = QUESTIONS.get(topic, {})
    level_questions = topic_questions.get(difficulty, [])

    available = [q for q in level_questions if q not in exclude]
    if not available:
        # Fallback: pick from any remaining in that difficulty
        available = level_questions

    if not available:
        return {
            "question": "No more questions available for this topic and difficulty.",
            "topic": topic,
            "difficulty": difficulty,
        }

    return {
        "question": random.choice(available),
        "topic": topic,
        "difficulty": difficulty,
    }


def get_next_difficulty(current_difficulty: str, recent_scores: list) -> str:
    """
    Adaptive difficulty: adjust based on recent performance.
    - If avg of last 3 scores >= 80, go up
    - If avg of last 3 scores <= 40, go down
    - Otherwise stay
    """
    if len(recent_scores) < 2:
        return current_difficulty

    recent = recent_scores[-3:] if len(recent_scores) >= 3 else recent_scores
    avg = sum(recent) / len(recent)

    idx = DIFFICULTY_ORDER.index(current_difficulty) if current_difficulty in DIFFICULTY_ORDER else 0

    if avg >= 80 and idx < len(DIFFICULTY_ORDER) - 1:
        return DIFFICULTY_ORDER[idx + 1]
    elif avg <= 40 and idx > 0:
        return DIFFICULTY_ORDER[idx - 1]

    return current_difficulty


def get_all_topics() -> list:
    """Return available topics."""
    return list(QUESTIONS.keys())


def get_all_difficulties() -> list:
    """Return difficulty levels in order."""
    return DIFFICULTY_ORDER
