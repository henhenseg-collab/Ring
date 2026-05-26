"""Seed the DB with demo data so the app is usable without an API key."""
import asyncio, json
from datetime import date, timedelta, datetime
from app.database import AsyncSessionLocal, engine
from app.models.models import User, Topic, Card, CardProgress, Session
from app.auth import hash_password


CARDS = [
    {
        "type": "flashcard",
        "question": "What is a React Hook?",
        "answer": "A function that lets you use state and other React features in function components.",
        "explanation": "Hooks were introduced in React 16.8 and start with the word 'use'.",
        "options": None,
    },
    {
        "type": "flashcard",
        "question": "What does useState return?",
        "answer": "An array of [currentValue, setterFunction].",
        "explanation": "You destructure it like: const [count, setCount] = useState(0).",
        "options": None,
    },
    {
        "type": "flashcard",
        "question": "When does useEffect run?",
        "answer": "After every render by default; or only when dependencies change if a dependency array is provided.",
        "explanation": "An empty [] array means it runs once on mount.",
        "options": None,
    },
    {
        "type": "multiple_choice",
        "question": "Which hook should you use to cache an expensive computation?",
        "answer": "useMemo",
        "explanation": "useMemo memoizes a value; useCallback memoizes a function.",
        "options": ["useRef", "useMemo", "useReducer", "useContext"],
    },
    {
        "type": "multiple_choice",
        "question": "What is the correct way to update state that depends on the previous value?",
        "answer": "setState(prev => prev + 1)",
        "explanation": "Using a functional update ensures you always read the latest state.",
        "options": [
            "setState(state + 1)",
            "setState(prev => prev + 1)",
            "state = state + 1",
            "setState(state++)",
        ],
    },
    {
        "type": "multiple_choice",
        "question": "Which hook lets you subscribe to a shared value across the component tree?",
        "answer": "useContext",
        "explanation": "useContext reads the nearest Provider value for a given Context.",
        "options": ["useState", "useGlobal", "useContext", "useShared"],
    },
    {
        "type": "multiple_choice",
        "question": "What does the dependency array in useEffect control?",
        "answer": "When the effect re-runs",
        "explanation": "React compares deps with the previous render using Object.is.",
        "options": [
            "The order of effects",
            "When the effect re-runs",
            "Which components can call the effect",
            "The cleanup function timing",
        ],
    },
    {
        "type": "multiple_choice",
        "question": "Which is NOT a valid hook rule?",
        "answer": "Call hooks inside loops",
        "explanation": "Hooks must always be called at the top level — never inside loops or conditions.",
        "options": [
            "Call hooks at the top level",
            "Call hooks inside loops",
            "Only call hooks in React functions",
            "Prefix custom hooks with 'use'",
        ],
    },
    {
        "type": "multiple_choice",
        "question": "What does useRef return?",
        "answer": "A mutable object { current: initialValue } that persists across renders",
        "explanation": "Mutating .current does not trigger a re-render.",
        "options": [
            "A state variable",
            "A mutable object { current: initialValue } that persists across renders",
            "A read-only snapshot of a value",
            "A callback ref function",
        ],
    },
    {
        "type": "flashcard",
        "question": "What is the purpose of the React key prop?",
        "answer": "It helps React identify which items in a list have changed, been added, or removed.",
        "explanation": "Keys should be stable, unique identifiers — avoid using array index when the list can reorder.",
        "options": None,
    },
    {
        "type": "flashcard",
        "question": "What is prop drilling?",
        "answer": "Passing props through many intermediate components that don't use them, just to reach a deeply nested child.",
        "explanation": "Context API or state managers like Zustand solve this.",
        "options": None,
    },
    {
        "type": "flashcard",
        "question": "What is reconciliation in React?",
        "answer": "The process React uses to diff the new virtual DOM against the previous one and determine the minimal DOM updates needed.",
        "explanation": "React uses a heuristic O(n) algorithm — same element type = update, different = remount.",
        "options": None,
    },
    {
        "type": "free_response",
        "question": "Explain the difference between useCallback and useMemo in your own words.",
        "answer": "useCallback memoizes a function reference so it doesn't get recreated on every render. useMemo memoizes the return value of a function. Both take a dependency array. Use useCallback when passing stable callbacks to child components; use useMemo for expensive computed values.",
        "explanation": None,
        "options": None,
    },
    {
        "type": "free_response",
        "question": "What problem does the React Context API solve, and what is its main limitation?",
        "answer": "Context solves prop drilling by making a value available to any component in the tree without passing it as a prop at every level. Its main limitation is performance: every consumer re-renders when the context value changes, making it unsuitable for frequently-updated state (use Zustand or Redux instead).",
        "explanation": None,
        "options": None,
    },
    {
        "type": "free_response",
        "question": "Describe how you would fetch data in a React component using hooks.",
        "answer": "Use useEffect with an async function inside it (or a helper), call the API, then call setState with the result. Include the relevant variables in the dependency array. Handle loading and error states with separate state variables. Clean up in-flight requests with AbortController in the cleanup function.",
        "explanation": None,
        "options": None,
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        # Create demo user
        from sqlalchemy import select
        existing = await db.execute(select(User).where(User.email == "demo@recall.app"))
        user = existing.scalar_one_or_none()
        if not user:
            user = User(email="demo@recall.app", hashed_password=hash_password("password123"))
            db.add(user)
            await db.flush()

        # Create topic
        topic = Topic(user_id=user.id, name="React Hooks")
        db.add(topic)
        await db.flush()

        # Create cards
        today = date.today()
        cards = []
        for i, c in enumerate(CARDS):
            card = Card(
                topic_id=topic.id,
                type=c["type"],
                question=c["question"],
                answer=c["answer"],
                explanation=c.get("explanation"),
                options=json.dumps(c["options"]) if c["options"] else None,
            )
            db.add(card)
            await db.flush()
            cards.append(card)

            # Add varied progress so mastery/weak-spots look interesting
            if i < 10:
                ef = 1.4 + (i * 0.15)  # range ~1.4 – 2.75
                prog = CardProgress(
                    card_id=card.id,
                    user_id=user.id,
                    interval=i + 1,
                    ease_factor=round(ef, 2),
                    due_date=today + timedelta(days=(i % 4) - 1),
                    repetitions=i + 1,
                    last_reviewed=datetime.utcnow() - timedelta(days=i),
                )
                db.add(prog)

        # Add a second topic (Python Basics)
        topic2 = Topic(user_id=user.id, name="Python Basics")
        db.add(topic2)
        await db.flush()

        python_cards = [
            ("flashcard", "What is a Python list comprehension?",
             "[expr for item in iterable if condition] — a concise way to create lists.", None, None),
            ("flashcard", "What does the 'with' statement do?",
             "Opens a context manager, ensuring __enter__ is called on entry and __exit__ on exit (even if an exception occurs).", None, None),
            ("multiple_choice", "Which is mutable in Python?",
             "list", "Mutable means its contents can be changed after creation.",
             ["tuple", "list", "frozenset", "str"]),
            ("multiple_choice", "What does *args capture?",
             "Extra positional arguments as a tuple", "**kwargs captures extra keyword arguments as a dict.",
             ["Extra positional arguments as a tuple", "A pointer to args", "Keyword arguments", "Default arguments"]),
        ]
        for ctype, q, a, expl, opts in python_cards:
            card = Card(
                topic_id=topic2.id,
                type=ctype,
                question=q,
                answer=a,
                explanation=expl,
                options=json.dumps(opts) if opts else None,
            )
            db.add(card)
            await db.flush()
            prog = CardProgress(
                card_id=card.id,
                user_id=user.id,
                interval=2,
                ease_factor=2.8,
                due_date=today + timedelta(days=3),
                repetitions=3,
                last_reviewed=datetime.utcnow() - timedelta(days=2),
            )
            db.add(prog)

        # Add past sessions to show streak
        for days_ago in [0, 1, 2, 4, 5, 7, 8, 10, 14, 15]:
            s = Session(
                user_id=user.id,
                topic_id=topic.id,
                started_at=datetime.utcnow() - timedelta(days=days_ago, hours=2),
                completed_at=datetime.utcnow() - timedelta(days=days_ago, hours=1),
                cards_reviewed=10,
                score=70 + days_ago,
            )
            db.add(s)

        await db.commit()
        print("✓ Seeded: demo@recall.app / password123")
        print("  Topics: React Hooks (15 cards), Python Basics (4 cards)")
        print("  Sessions: 10 past sessions (streak calendar populated)")


asyncio.run(seed())
