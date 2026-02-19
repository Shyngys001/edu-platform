"""Seed script — run once to populate the database with demo data."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models.models import (
    User, Module, Lesson, Test, Question, CodeTask, Badge,
)
from app.utils.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Clear existing data ────────────────────────────────
for table in reversed(Base.metadata.sorted_tables):
    db.execute(table.delete())
db.commit()

# ── Users ──────────────────────────────────────────────
teacher = User(
    username="teacher", hashed_password=hash_password("teacher123"),
    full_name="Ms. Aigerim Nurova", role="teacher",
)
students = [
    User(username="alice", hashed_password=hash_password("alice123"),
         full_name="Alice Johnson", role="student", grade="10A", points=45),
    User(username="bob", hashed_password=hash_password("bob123"),
         full_name="Bob Smith", role="student", grade="10A", points=120),
    User(username="charlie", hashed_password=hash_password("charlie123"),
         full_name="Charlie Brown", role="student", grade="10B", points=230),
]
db.add(teacher)
db.add_all(students)
db.flush()

# ── Modules ────────────────────────────────────────────
modules_data = [
    ("Python Basics", "Introduction to Python programming language"),
    ("Variables and Data Types", "Understanding variables, numbers, strings, and booleans"),
    ("String Concept", "Deep dive into Python strings"),
    ("String Functions", "len(), split(), replace(), lower()/upper() and more"),
    ("String Loops", "Iterating over strings with for loops"),
    ("Regular Expressions", "Pattern matching with the re module"),
    ("Working with Text Files", "Reading and writing files in Python"),
]
modules = []
for i, (title, desc) in enumerate(modules_data):
    m = Module(title=title, order=i + 1, description=desc)
    db.add(m)
    db.flush()
    modules.append(m)

# ── Lessons ────────────────────────────────────────────
lessons_data = [
    # Module 1: Python Basics
    (modules[0].id, "What is Python?", """# What is Python?

Python is a high-level, interpreted programming language created by Guido van Rossum in 1991. It's known for its clean, readable syntax and versatility.

## Why Learn Python?

- **Easy to learn** — syntax is close to English
- **Versatile** — web, data science, AI, automation
- **Large community** — thousands of libraries
- **In demand** — one of the most popular languages

## Your First Program

```python
print("Hello, World!")
```

This single line outputs text to the screen. In Python, `print()` is a built-in function that displays output.

## Key Features

1. **Indentation matters** — Python uses indentation instead of braces
2. **Dynamic typing** — no need to declare variable types
3. **Interpreted** — code runs line by line

## Python Interactive Mode

You can test Python code interactively:

```python
>>> 2 + 3
5
>>> "Hello" + " " + "World"
'Hello World'
```
""", None, "https://www.youtube.com/watch?v=kqtD5dpn9C8"),

    (modules[0].id, "Installing Python & IDE Setup", """# Setting Up Your Environment

## Installing Python

1. Visit [python.org](https://python.org)
2. Download the latest version (3.12+)
3. Run the installer — **check "Add to PATH"**

## Verifying Installation

Open terminal/command prompt:
```bash
python --version
# Python 3.12.x
```

## Choosing an IDE

| IDE | Best For |
|-----|----------|
| VS Code | General purpose, lightweight |
| PyCharm | Full-featured Python IDE |
| Jupyter | Data science, notebooks |
| IDLE | Comes with Python, simple |

## Writing Your First Script

Create a file `hello.py`:
```python
name = input("What is your name? ")
print(f"Hello, {name}! Welcome to Python!")
```

Run it:
```bash
python hello.py
```
""", None, None),

    # Module 2: Variables and Data Types
    (modules[1].id, "Variables in Python", """# Variables in Python

A **variable** is a name that stores a value in memory.

## Creating Variables

```python
x = 10          # integer
name = "Alice"  # string
pi = 3.14       # float
is_active = True # boolean
```

Python is **dynamically typed** — no need to declare the type.

## Variable Naming Rules

- Must start with a letter or underscore
- Can contain letters, numbers, underscores
- Case-sensitive (`name` ≠ `Name`)
- Cannot use Python keywords (`if`, `for`, `class`, etc.)

## Good Naming Practices

```python
# Good
student_name = "Alice"
total_score = 95
is_passed = True

# Bad
x = "Alice"
a = 95
b = True
```

## Multiple Assignment

```python
a, b, c = 1, 2, 3
x = y = z = 0
```
""", None, None),

    (modules[1].id, "Data Types", """# Python Data Types

## Basic Types

| Type | Example | Description |
|------|---------|-------------|
| `int` | `42` | Whole numbers |
| `float` | `3.14` | Decimal numbers |
| `str` | `"hello"` | Text |
| `bool` | `True` | True/False |

## Checking Types

```python
x = 42
print(type(x))  # <class 'int'>

name = "Alice"
print(type(name))  # <class 'str'>
```

## Type Conversion

```python
# String to int
num = int("42")      # 42

# Int to string
text = str(42)       # "42"

# String to float
pi = float("3.14")   # 3.14

# Float to int (truncates)
whole = int(3.99)     # 3
```

## Operations by Type

```python
# Numbers
10 + 3    # 13
10 / 3    # 3.333...
10 // 3   # 3 (floor division)
10 % 3    # 1 (remainder)
2 ** 3    # 8 (power)
```
""", None, None),

    # Module 3: String Concept
    (modules[2].id, "Understanding Strings", """# Strings in Python

A string is a **sequence of characters** enclosed in quotes.

## Creating Strings

```python
s1 = 'Hello'        # single quotes
s2 = "World"        # double quotes
s3 = \"\"\"Multi-line
string\"\"\"              # triple quotes
```

## String Indexing

```python
text = "Python"
#       P y t h o n
#       0 1 2 3 4 5
#      -6-5-4-3-2-1

print(text[0])    # P
print(text[-1])   # n
```

## String Slicing

```python
text = "Python"
print(text[0:3])   # Pyt
print(text[2:])    # thon
print(text[:4])    # Pyth
print(text[::2])   # Pto (every 2nd char)
print(text[::-1])  # nohtyP (reversed)
```

## String Properties

- **Immutable** — cannot change individual characters
- **Iterable** — can loop through characters
- **Ordered** — characters maintain their position

```python
# This causes an error:
text = "Hello"
# text[0] = "h"  # TypeError!

# Instead, create a new string:
text = "h" + text[1:]  # "hello"
```
""", None, None),

    # Module 4: String Functions
    (modules[3].id, "Essential String Functions", """# String Functions

## len() — Length

```python
text = "Hello World"
print(len(text))  # 11
```

## split() — Split into List

```python
sentence = "Hello World Python"
words = sentence.split()
print(words)  # ['Hello', 'World', 'Python']

csv = "a,b,c,d"
items = csv.split(",")
print(items)  # ['a', 'b', 'c', 'd']
```

## replace() — Replace Substring

```python
text = "Hello World"
new_text = text.replace("World", "Python")
print(new_text)  # Hello Python
```

## Case Functions

```python
text = "Hello World"
print(text.upper())    # HELLO WORLD
print(text.lower())    # hello world
print(text.title())    # Hello World
print(text.capitalize()) # Hello world
```

## Finding & Checking

```python
text = "Hello World"
print(text.find("World"))    # 6
print(text.count("l"))       # 3
print(text.startswith("He")) # True
print(text.endswith("ld"))   # True
print("World" in text)       # True
```

## Stripping Whitespace

```python
text = "  Hello  "
print(text.strip())   # "Hello"
print(text.lstrip())  # "Hello  "
print(text.rstrip())  # "  Hello"
```
""", None, None),

    # Module 5: String Loops
    (modules[4].id, "Looping Through Strings", """# String Loops

## For Loop with Strings

```python
word = "Python"
for char in word:
    print(char)
# P
# y
# t
# h
# o
# n
```

## Loop with Index

```python
word = "Python"
for i in range(len(word)):
    print(f"Index {i}: {word[i]}")
```

## Using enumerate()

```python
word = "Python"
for i, char in enumerate(word):
    print(f"{i}: {char}")
```

## Practical Examples

### Count vowels
```python
text = "Hello World"
vowels = "aeiouAEIOU"
count = 0
for char in text:
    if char in vowels:
        count += 1
print(f"Vowels: {count}")  # 3
```

### Reverse a string
```python
text = "Hello"
reversed_text = ""
for char in text:
    reversed_text = char + reversed_text
print(reversed_text)  # olleH
```

### Check palindrome
```python
word = "racecar"
is_palindrome = word == word[::-1]
print(is_palindrome)  # True
```
""", None, None),

    # Module 6: Regex
    (modules[5].id, "Introduction to Regex", """# Regular Expressions (Regex)

The `re` module provides regex support in Python.

## Basic Usage

```python
import re

text = "My phone is 123-456-7890"
pattern = r'\\d{3}-\\d{3}-\\d{4}'
match = re.search(pattern, text)
print(match.group())  # 123-456-7890
```

## Common Patterns

| Pattern | Matches |
|---------|---------|
| `\\d` | Any digit (0-9) |
| `\\w` | Any word character |
| `\\s` | Any whitespace |
| `.` | Any character |
| `+` | One or more |
| `*` | Zero or more |
| `?` | Zero or one |
| `{n}` | Exactly n times |

## Key Functions

```python
import re

# findall — find all matches
nums = re.findall(r'\\d+', "abc 123 def 456")
print(nums)  # ['123', '456']

# sub — replace pattern
result = re.sub(r'\\d+', 'X', "abc 123 def 456")
print(result)  # abc X def X

# split — split by pattern
parts = re.split(r'[,;]', "a,b;c,d")
print(parts)  # ['a', 'b', 'c', 'd']
```

## Practical Example: Email Validation

```python
import re

email = "user@example.com"
pattern = r'^[\\w.-]+@[\\w.-]+\\.\\w+$'
if re.match(pattern, email):
    print("Valid email")
```
""", None, None),

    # Module 7: Text Files
    (modules[6].id, "Reading and Writing Files", """# Working with Text Files

## Reading a File

```python
# Read entire file
with open("data.txt", "r") as f:
    content = f.read()
    print(content)

# Read line by line
with open("data.txt", "r") as f:
    for line in f:
        print(line.strip())

# Read all lines into a list
with open("data.txt", "r") as f:
    lines = f.readlines()
```

## Writing to a File

```python
# Write (overwrites existing content)
with open("output.txt", "w") as f:
    f.write("Hello World\\n")
    f.write("Second line\\n")

# Append to file
with open("output.txt", "a") as f:
    f.write("New line appended\\n")
```

## The `with` Statement

Using `with` ensures the file is properly closed:

```python
# Good — file auto-closes
with open("data.txt") as f:
    data = f.read()

# Without with — must close manually
f = open("data.txt")
data = f.read()
f.close()  # Don't forget this!
```

## Practical Example: Word Counter

```python
with open("story.txt", "r") as f:
    text = f.read()

words = text.split()
word_count = len(words)
print(f"Total words: {word_count}")

# Count specific word
target = "python"
count = text.lower().split().count(target)
print(f"'{target}' appears {count} times")
```
""", None, None),
]

for mod_id, title, content, img, video in lessons_data:
    existing = db.query(Lesson).filter(Lesson.module_id == mod_id).count()
    db.add(Lesson(
        module_id=mod_id, title=title, content=content,
        image_url=img, video_url=video, order=existing + 1,
    ))
db.flush()

# ── Tests ──────────────────────────────────────────────
# Test 1: Python Basics MCQ
test1 = Test(title="Python Basics Quiz", module_id=modules[0].id, difficulty="easy")
db.add(test1)
db.flush()

test1_questions = [
    Question(test_id=test1.id, question_type="mcq", order=1,
             text="What is the output of print(2 ** 3)?",
             options=["5", "6", "8", "9"],
             correct_answer="8",
             explanation="** is the power operator. 2^3 = 8"),
    Question(test_id=test1.id, question_type="mcq", order=2,
             text="Which keyword is used to define a function in Python?",
             options=["function", "func", "def", "define"],
             correct_answer="def",
             explanation="In Python, functions are defined using the 'def' keyword."),
    Question(test_id=test1.id, question_type="mcq", order=3,
             text="What type is the value True?",
             options=["int", "str", "bool", "float"],
             correct_answer="bool",
             explanation="True and False are boolean (bool) values."),
    Question(test_id=test1.id, question_type="choose_code", order=4,
             text="Which code correctly prints numbers 0 to 4?",
             options=[
                 "for i in range(5): print(i)",
                 "for i in range(1,5): print(i)",
                 "for i in range(4): print(i)",
                 "for i in [0,1,2,3,4,5]: print(i)",
             ],
             correct_answer="for i in range(5): print(i)",
             explanation="range(5) generates 0,1,2,3,4"),
    Question(test_id=test1.id, question_type="mcq", order=5,
             text="What does len('Hello') return?",
             options=["4", "5", "6", "Error"],
             correct_answer="5",
             explanation="len() returns the number of characters. 'Hello' has 5 characters."),
]
db.add_all(test1_questions)

# Test 2: String Functions
test2 = Test(title="String Functions Test", module_id=modules[3].id, difficulty="medium")
db.add(test2)
db.flush()

test2_questions = [
    Question(test_id=test2.id, question_type="mcq", order=1,
             text="What does 'hello world'.split() return?",
             options=["['hello world']", "['hello', 'world']", "('hello', 'world')", "['h','e','l','l','o',' ','w','o','r','l','d']"],
             correct_answer="['hello', 'world']",
             explanation="split() without arguments splits by whitespace."),
    Question(test_id=test2.id, question_type="find_bug", order=2,
             text="Find the bug:\n```python\ntext = 'Hello'\ntext[0] = 'h'\nprint(text)\n```",
             options=["Line 1: wrong quotes", "Line 2: strings are immutable", "Line 3: print is wrong", "No bug"],
             correct_answer="Line 2: strings are immutable",
             explanation="Strings in Python are immutable. You cannot change individual characters."),
    Question(test_id=test2.id, question_type="mcq", order=3,
             text="What does 'Python'.replace('P', 'J') return?",
             options=["'Python'", "'Jython'", "'python'", "Error"],
             correct_answer="'Jython'",
             explanation="replace() substitutes the first argument with the second."),
    Question(test_id=test2.id, question_type="matching", order=4,
             text="Match the function to its purpose:",
             options={
                 "left": ["len()", "split()", "upper()", "strip()"],
                 "right": ["Returns length", "Breaks into list", "UPPERCASE", "Remove whitespace"],
             },
             correct_answer={"len()": "Returns length", "split()": "Breaks into list", "upper()": "UPPERCASE", "strip()": "Remove whitespace"},
             explanation="These are basic string methods."),
    Question(test_id=test2.id, question_type="choose_code", order=5,
             text="Which code counts words in a sentence?",
             options=[
                 "len(sentence.split())",
                 "sentence.count(' ')",
                 "len(sentence)",
                 "sentence.words()",
             ],
             correct_answer="len(sentence.split())",
             explanation="split() breaks the sentence into words, len() counts them."),
]
db.add_all(test2_questions)

# Test 3: Regex
test3 = Test(title="Regex Basics", module_id=modules[5].id, difficulty="hard")
db.add(test3)
db.flush()

test3_questions = [
    Question(test_id=test3.id, question_type="mcq", order=1,
             text="What does \\d+ match?",
             options=["One digit", "One or more digits", "Zero or more digits", "Letters"],
             correct_answer="One or more digits",
             explanation="\\d matches a digit, + means one or more."),
    Question(test_id=test3.id, question_type="mcq", order=2,
             text="Which function returns all matches as a list?",
             options=["re.search()", "re.match()", "re.findall()", "re.split()"],
             correct_answer="re.findall()",
             explanation="findall() returns all non-overlapping matches."),
    Question(test_id=test3.id, question_type="choose_code", order=3,
             text="Which code finds all emails in text?",
             options=[
                 "re.findall(r'[\\w.]+@[\\w.]+', text)",
                 "re.search(r'email', text)",
                 "text.find('@')",
                 "re.match(r'@', text)",
             ],
             correct_answer="re.findall(r'[\\w.]+@[\\w.]+', text)",
             explanation="The regex pattern matches email-like strings."),
]
db.add_all(test3_questions)

# ── Code Tasks ─────────────────────────────────────────
task1 = CodeTask(
    title="Count Words in Text",
    description="Write a Python program that reads a text from input and prints the number of words.\n\nA word is any sequence of characters separated by spaces.\n\n**Example:**\nInput: `Hello World Python`\nOutput: `3`",
    module_id=modules[3].id,
    difficulty="easy",
    starter_code='text = input()\n# Your code here\n',
    test_cases=[
        {"input": "Hello World Python", "expected_output": "3"},
        {"input": "one", "expected_output": "1"},
        {"input": "This is a test sentence", "expected_output": "5"},
        {"input": "  spaces   everywhere  ", "expected_output": "2"},
        {"input": "", "expected_output": "0"},
    ],
)

task2 = CodeTask(
    title="Reverse a String",
    description="Write a program that reads a string and prints it reversed.\n\n**Example:**\nInput: `Hello`\nOutput: `olleH`",
    module_id=modules[2].id,
    difficulty="easy",
    starter_code='text = input()\n# Your code here\n',
    test_cases=[
        {"input": "Hello", "expected_output": "olleH"},
        {"input": "Python", "expected_output": "nohtyP"},
        {"input": "abcde", "expected_output": "edcba"},
        {"input": "a", "expected_output": "a"},
        {"input": "racecar", "expected_output": "racecar"},
    ],
)

task3 = CodeTask(
    title="Count Vowels",
    description="Write a program that counts the number of vowels (a, e, i, o, u) in a given string. Case-insensitive.\n\n**Example:**\nInput: `Hello World`\nOutput: `3`",
    module_id=modules[4].id,
    difficulty="medium",
    starter_code='text = input()\n# Your code here\n',
    test_cases=[
        {"input": "Hello World", "expected_output": "3"},
        {"input": "AEIOU", "expected_output": "5"},
        {"input": "xyz", "expected_output": "0"},
        {"input": "Python Programming", "expected_output": "4"},
        {"input": "aEiOu", "expected_output": "5"},
    ],
)

db.add_all([task1, task2, task3])

# ── Badges ─────────────────────────────────────────────
badges_data = [
    ("first_lesson", "First Lesson", "Completed your first lesson", "📖"),
    ("first_test", "First Test", "Completed your first test", "📝"),
    ("five_lessons", "Knowledge Seeker", "Completed 5 lessons", "🎯"),
    ("three_tests_passed", "Test Master", "Passed 3 tests", "🏆"),
    ("perfect_score", "Perfect Score", "Got 100% on a test", "⭐"),
    ("seven_day_streak", "Week Warrior", "Maintained a 7-day streak", "🔥"),
]
for key, title, desc, icon in badges_data:
    db.add(Badge(key=key, title=title, description=desc, icon=icon))

db.commit()
db.close()

print("✅ Seed data created successfully!")
print()
print("Login credentials:")
print("  Teacher: teacher / teacher123")
print("  Student: alice / alice123")
print("  Student: bob / bob123")
print("  Student: charlie / charlie123")
