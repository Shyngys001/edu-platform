"""AI helper for Python education — uses OpenAI GPT with rule-based fallback."""

from app.config import settings

SYSTEM_PROMPT = """You are a friendly Python programming tutor for school students.
Your job is to:
- Explain Python concepts clearly with examples
- Help debug code and explain errors
- Suggest fixes and improvements
- Show short, working code examples
- Answer in the same language the student writes in (Russian, Kazakh, or English)

Rules:
- Keep answers concise but helpful (under 300 words)
- Always include code examples when relevant
- Use markdown formatting with ```python code blocks
- Be encouraging and supportive
- If the student shares code, analyze it carefully
- Do NOT give full solutions for homework — guide them instead
"""


def generate_response(message: str, history: list = None) -> str:
    """Try OpenAI GPT first, fall back to rule-based if no API key."""
    if settings.OPENAI_API_KEY:
        return _gpt_response(message, history)
    return _rule_based_response(message)


def _gpt_response(message: str, history: list = None) -> str:
    """Call OpenAI ChatCompletion API."""
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add recent history for context (last 10 messages)
        if history:
            for h in history[-10:]:
                messages.append({"role": h["role"], "content": h["content"]})

        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=800,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        # Fallback to rule-based on any error
        print(f"OpenAI error: {e}")
        return _rule_based_response(message)


def _rule_based_response(message: str) -> str:
    """Rule-based fallback when OpenAI API key is not configured."""
    lower = message.lower().strip()

    KNOWLEDGE_BASE = {
        "variable": "In Python, a variable is a name that stores a value. Example:\n```python\nx = 10\nname = 'Alice'\n```\nYou don't need to declare the type — Python figures it out automatically.",
        "data type": "Python has several built-in data types:\n- `int` — integers (1, 42)\n- `float` — decimals (3.14)\n- `str` — strings ('hello')\n- `bool` — True/False\n- `list` — ordered collection [1, 2, 3]\n- `dict` — key-value pairs {'a': 1}",
        "string": "A string is a sequence of characters enclosed in quotes.\n```python\ns = 'Hello, World!'\nprint(len(s))  # 13\nprint(s.upper())  # HELLO, WORLD!\n```",
        "loop": "Python has `for` and `while` loops.\n```python\nfor i in range(5):\n    print(i)\n\nwhile x > 0:\n    x -= 1\n```",
        "function": "Define a function with `def`:\n```python\ndef greet(name):\n    return f'Hello, {name}!'\n```",
        "list": "A list is an ordered, mutable collection:\n```python\nnums = [1, 2, 3]\nnums.append(4)\nprint(nums[0])  # 1\n```",
        "dict": "A dict maps keys to values:\n```python\nstudent = {'name': 'Ali', 'age': 20}\nprint(student['name'])\n```",
        "regex": "Use the `re` module for regular expressions:\n```python\nimport re\npattern = r'\\d+'\nresult = re.findall(pattern, 'abc 123 def 456')\nprint(result)  # ['123', '456']\n```",
        "file": "Read a file:\n```python\nwith open('data.txt', 'r') as f:\n    content = f.read()\n```\nWrite:\n```python\nwith open('out.txt', 'w') as f:\n    f.write('Hello')\n```",
        "error": "Common Python errors:\n- `SyntaxError` — typo or wrong syntax\n- `NameError` — using undefined variable\n- `TypeError` — wrong type in operation\n- `IndexError` — list index out of range\n\nAlways read the error message — it tells you the line number!",
        "len": "`len()` returns the number of items:\n```python\nprint(len('hello'))  # 5\nprint(len([1,2,3]))  # 3\n```",
        "split": "`split()` breaks a string into a list:\n```python\n'a,b,c'.split(',')  # ['a', 'b', 'c']\n'hello world'.split()  # ['hello', 'world']\n```",
        "replace": "`replace()` substitutes substrings:\n```python\n'hello'.replace('l', 'r')  # 'herro'\n```",
        "if": "Conditional statements:\n```python\nif x > 0:\n    print('positive')\nelif x == 0:\n    print('zero')\nelse:\n    print('negative')\n```",
        "print": "`print()` outputs text:\n```python\nprint('Hello')\nprint(f'Value: {x}')\n```",
        "class": "Define a class:\n```python\nclass Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        return 'Woof!'\n```",
    }

    GREETINGS = ["hello", "hi", "hey", "привет", "салем", "сәлем"]

    if any(g in lower for g in GREETINGS):
        return "Hello! I'm your Python learning assistant. Ask me about any Python concept — variables, loops, strings, functions, errors, and more! 🐍"

    if "help" in lower and len(lower) < 15:
        return ("I can help with Python concepts! Try asking about:\n"
                "- Variables & data types\n- Strings & string functions\n"
                "- Loops & conditionals\n- Functions & classes\n"
                "- Regular expressions\n- File handling\n- Common errors")

    best_match = None
    best_score = 0
    for key, answer in KNOWLEDGE_BASE.items():
        if key in lower:
            score = len(key)
            if score > best_score:
                best_score = score
                best_match = answer

    if best_match:
        return best_match

    error_patterns = ["error", "bug", "doesn't work", "not working", "wrong", "fix", "ошибка", "не работает", "қате"]
    if any(p in lower for p in error_patterns):
        return ("Here are some debugging tips:\n"
                "1. Read the error message carefully — it tells the line number\n"
                "2. Check for typos in variable names\n"
                "3. Make sure parentheses and quotes match\n"
                "4. Use `print()` to check intermediate values\n"
                "5. Check indentation — Python is strict about it")

    return ("I'm not sure about that specific topic, but I can help with: "
            "variables, strings, loops, functions, regex, files, or common errors.\n\n"
            "💡 **Tip:** Set `OPENAI_API_KEY` in the `.env` file to enable GPT-powered answers!")
