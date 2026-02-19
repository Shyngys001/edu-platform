"""AI-powered content generation for teachers using GPT."""

import json
from app.config import settings


def _call_gpt(system_prompt: str, user_prompt: str) -> str:
    """Call OpenAI and return raw text response."""
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=3000,
        temperature=0.7,
    )
    return response.choices[0].message.content


def _parse_json(text: str) -> dict:
    """Extract JSON from GPT response (handles markdown code blocks)."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        text = text.rsplit("```", 1)[0]
    return json.loads(text.strip())


# ── Generate Test ──────────────────────────────────────

def generate_test(module_title: str, difficulty: str, num_questions: int = 5, lang: str = "ru") -> dict:
    """Generate a complete test with questions using GPT."""
    lang_instruction = {
        "ru": "Write ALL question texts and options in Russian.",
        "en": "Write ALL question texts and options in English.",
        "kz": "Write ALL question texts and options in Kazakh.",
    }.get(lang, "Write in Russian.")

    system = f"""You are an expert Python programming teacher creating tests for students.
{lang_instruction}
You MUST return ONLY valid JSON, no markdown, no extra text.
"""

    prompt = f"""Create a Python programming test for the module: "{module_title}"
Difficulty: {difficulty}
Number of questions: {num_questions}

Requirements:
- Mix question types: "mcq" (multiple choice), "find_bug" (find error in code), "choose_code" (pick correct code), "matching" (match pairs)
- Each question must have 4 options for mcq/find_bug/choose_code
- For matching: options should have "left" (4 items) and "right" (4 items), correct_answer maps left->right
- Include explanations for each answer
- Make questions progressively harder
- Code examples should be practical and realistic

Return this exact JSON structure:
{{
  "title": "Test title here",
  "questions": [
    {{
      "question_type": "mcq",
      "text": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "Because..."
    }},
    {{
      "question_type": "find_bug",
      "text": "Find the error:\\n```python\\ncode here\\n```",
      "options": ["Line 1: ...", "Line 2: ...", "Line 3: ...", "No error"],
      "correct_answer": "Line 2: ...",
      "explanation": "The error is..."
    }},
    {{
      "question_type": "choose_code",
      "text": "Which code does X?",
      "options": ["code1", "code2", "code3", "code4"],
      "correct_answer": "code2",
      "explanation": "Because..."
    }},
    {{
      "question_type": "matching",
      "text": "Match the functions:",
      "options": {{"left": ["a()", "b()", "c()", "d()"], "right": ["does X", "does Y", "does Z", "does W"]}},
      "correct_answer": {{"a()": "does X", "b()": "does Y", "c()": "does Z", "d()": "does W"}},
      "explanation": "Explanation..."
    }}
  ]
}}"""

    raw = _call_gpt(system, prompt)
    return _parse_json(raw)


# ── Generate Lesson ────────────────────────────────────

def generate_lesson(module_title: str, topic: str, lang: str = "ru") -> dict:
    """Generate a complete lesson with rich markdown content."""
    lang_instruction = {
        "ru": "Write ALL content in Russian.",
        "en": "Write ALL content in English.",
        "kz": "Write ALL content in Kazakh.",
    }.get(lang, "Write in Russian.")

    system = f"""You are an expert Python programming teacher writing educational lessons.
{lang_instruction}
You MUST return ONLY valid JSON, no markdown wrapping, no extra text."""

    prompt = f"""Create a detailed Python lesson for the module: "{module_title}"
Topic: "{topic}"

Requirements:
- Rich markdown content with headers (## ##), code blocks (```python), tables, bold text
- Start with a clear introduction explaining the concept
- Include 3-5 practical code examples with explanations
- Add a "Practice" section with 2-3 exercises
- Add a "Key Points" summary at the end
- Make it engaging and clear for school students
- Content should be 500-800 words

Return this exact JSON structure:
{{
  "title": "{topic}",
  "content": "Full markdown content here...",
  "video_url": null
}}"""

    raw = _call_gpt(system, prompt)
    return _parse_json(raw)


# ── Generate Code Task ─────────────────────────────────

def generate_code_task(module_title: str, difficulty: str, lang: str = "ru") -> dict:
    """Generate a code task with test cases."""
    lang_instruction = {
        "ru": "Write task title and description in Russian.",
        "en": "Write task title and description in English.",
        "kz": "Write task title and description in Kazakh.",
    }.get(lang, "Write in Russian.")

    system = f"""You are an expert Python programming teacher creating coding exercises.
{lang_instruction}
You MUST return ONLY valid JSON, no markdown wrapping, no extra text."""

    prompt = f"""Create a Python coding task for the module: "{module_title}"
Difficulty: {difficulty}

Requirements:
- The task should read input with input() and print output with print()
- Include a clear description with examples in markdown
- Provide starter code that reads input
- Create exactly 5 test cases covering edge cases
- Difficulty guide: easy=basic operations, medium=loops/conditions, hard=algorithms

Return this exact JSON structure:
{{
  "title": "Task title",
  "description": "Full markdown description with examples...",
  "starter_code": "# starter code\\n",
  "test_cases": [
    {{"input": "test input 1", "expected_output": "expected 1"}},
    {{"input": "test input 2", "expected_output": "expected 2"}},
    {{"input": "test input 3", "expected_output": "expected 3"}},
    {{"input": "test input 4", "expected_output": "expected 4"}},
    {{"input": "test input 5", "expected_output": "expected 5"}}
  ]
}}"""

    raw = _call_gpt(system, prompt)
    return _parse_json(raw)
