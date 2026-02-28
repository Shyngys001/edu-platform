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
    full_name="Айгерім Нұрова", role="teacher",
)
students = [
    User(username="aisha", hashed_password=hash_password("aisha123"),
         full_name="Айша Бекова", role="student", grade="10A", points=45),
    User(username="daniyar", hashed_password=hash_password("daniyar123"),
         full_name="Данияр Сейтов", role="student", grade="10A", points=120),
    User(username="zarina", hashed_password=hash_password("zarina123"),
         full_name="Зарина Алибекова", role="student", grade="10B", points=230),
]
db.add(teacher)
db.add_all(students)
db.flush()

# ── Modules ────────────────────────────────────────────
modules_data = [
    ("Python негіздері", "Python бағдарламалау тіліне кіріспе"),
    ("Айнымалылар мен деректер типтері", "Айнымалылар, сандар, жолдар және логикалық мәндер"),
    ("Жолдар тұжырымдамасы", "Python жолдарын тереңдетіп үйрену"),
    ("Жол функциялары", "len(), split(), replace(), lower()/upper() және т.б."),
    ("Жолдардағы циклдер", "for циклімен жолдарды аралау"),
    ("Тұрақты өрнектер", "re модулімен үлгілерді іздеу"),
    ("Мәтіндік файлдармен жұмыс", "Python-да файлдарды оқу және жазу"),
]
modules = []
for i, (title, desc) in enumerate(modules_data):
    m = Module(title=title, order=i + 1, description=desc)
    db.add(m)
    db.flush()
    modules.append(m)

# ── Lessons ────────────────────────────────────────────
lessons_data = [
    # Модуль 1: Python негіздері
    (modules[0].id, "Python дегеніміз не?", """# Python дегеніміз не?

Python — Гвидо ван Россум 1991 жылы жасаған жоғары деңгейлі, интерпретацияланатын бағдарламалау тілі. Ол таза, оқылымды синтаксисімен және икемділігімен танымал.

## Неліктен Python үйрену керек?

- **Үйренуге оңай** — синтаксис ағылшын тіліне жақын
- **Икемді** — веб, деректер ғылымы, ЖИ, автоматтандыру
- **Үлкен қоғамдастық** — мыңдаған кітапханалар
- **Сұранысқа ие** — ең танымал тілдердің бірі

## Алғашқы бағдарлама

```python
print("Сәлем, Әлем!")
```

Бұл бір жол экранға мәтін шығарады. Python-да `print()` — кірістірілген функция.

## Негізгі ерекшеліктер

1. **Шегіністер маңызды** — Python жақшалардың орнына шегіністерді пайдаланады
2. **Динамикалық типтеу** — айнымалы типтерін жариялаудың қажеті жоқ
3. **Интерпретацияланатын** — код жол-жолмен орындалады

## Python интерактивті режимі

```python
>>> 2 + 3
5
>>> "Сәлем" + " " + "Әлем"
'Сәлем Әлем'
```
""", None, "https://www.youtube.com/watch?v=kqtD5dpn9C8"),

    (modules[0].id, "Python орнату және IDE баптау", """# Ортаны баптау

## Python орнату

1. [python.org](https://python.org) сайтына кіріңіз
2. Соңғы нұсқаны жүктеп алыңыз (3.12+)
3. Орнатушыны іске қосыңыз — **"Add to PATH" белгіленуін тексеріңіз**

## Орнатуды тексеру

Терминалды ашыңыз:
```bash
python --version
# Python 3.12.x
```

## IDE таңдау

| IDE | Қолданылуы |
|-----|------------|
| VS Code | Жалпы мақсатты, жеңіл |
| PyCharm | Толық функционалды Python IDE |
| Jupyter | Деректер ғылымы, блокнот |
| IDLE | Python-мен бірге келеді, қарапайым |

## Алғашқы сценарий жазу

`salam.py` файлын жасаңыз:
```python
ат = input("Атыңыз кім? ")
print(f"Сәлем, {ат}! Python-ға қош келдіңіз!")
```

Іске қосыңыз:
```bash
python salam.py
```
""", None, None),

    # Модуль 2: Айнымалылар мен деректер типтері
    (modules[1].id, "Python-дағы айнымалылар", """# Python-дағы айнымалылар

**Айнымалы** — жадтағы мәнді сақтайтын атау.

## Айнымалылар жасау

```python
x = 10           # бүтін сан
ат = "Айша"      # жол
пи = 3.14        # жылжымалы нүктелі сан
белсенді = True  # логикалық мән
```

Python **динамикалық типтелген** — типті жариялаудың қажеті жоқ.

## Айнымалы атауына қойылатын талаптар

- Әріп немесе астын сызумен басталуы керек
- Әріптер, сандар, астын сызуды қамтуы мүмкін
- Регистрге сезімтал (`ат` ≠ `Ат`)
- Python кілт сөздерін қолдануға болмайды (`if`, `for`, `class` т.б.)

## Жақсы атау тәжірибелері

```python
# Жақсы
оқушы_аты = "Айша"
жалпы_ұпай = 95
тапсырылды = True

# Нашар
x = "Айша"
a = 95
b = True
```

## Бірнеше меншіктеу

```python
a, b, c = 1, 2, 3
x = y = z = 0
```
""", None, None),

    (modules[1].id, "Деректер типтері", """# Python деректер типтері

## Негізгі типтер

| Тип | Мысал | Сипаттама |
|-----|-------|-----------|
| `int` | `42` | Бүтін сандар |
| `float` | `3.14` | Ондық сандар |
| `str` | `"сәлем"` | Мәтін |
| `bool` | `True` | Рас/Жалған |

## Типтерді тексеру

```python
x = 42
print(type(x))  # <class 'int'>

ат = "Айша"
print(type(ат))  # <class 'str'>
```

## Тип түрлендіру

```python
# Жолды бүтін санға
сан = int("42")      # 42

# Бүтін санды жолға
мәтін = str(42)      # "42"

# Жолды жылжымалы нүктелі санға
пи = float("3.14")   # 3.14

# Жылжымалы нүктелі санды бүтін санға (қиып алады)
бүтін = int(3.99)    # 3
```

## Типтер бойынша амалдар

```python
# Сандар
10 + 3    # 13
10 / 3    # 3.333...
10 // 3   # 3 (бүтін бөлу)
10 % 3    # 1 (қалдық)
2 ** 3    # 8 (дәреже)
```
""", None, None),

    # Модуль 3: Жолдар тұжырымдамасы
    (modules[2].id, "Жолдарды түсіну", """# Python-дағы жолдар

Жол — тырнақшаға алынған **символдар тізбегі**.

## Жол жасау

```python
с1 = 'Сәлем'          # бір тырнақша
с2 = "Әлем"           # қос тырнақша
с3 = \"\"\"Көп жолды
жол\"\"\"               # үш тырнақша
```

## Жол индексациясы

```python
мәтін = "Python"
#         P y t h o n
#         0 1 2 3 4 5
#        -6-5-4-3-2-1

print(мәтін[0])    # P
print(мәтін[-1])   # n
```

## Жол кесінділері

```python
мәтін = "Python"
print(мәтін[0:3])   # Pyt
print(мәтін[2:])    # thon
print(мәтін[:4])    # Pyth
print(мәтін[::2])   # Pto (әрбір 2-ші символ)
print(мәтін[::-1])  # nohtyP (кері ретпен)
```

## Жол қасиеттері

- **Өзгермейді** — жекелеген символдарды өзгерту мүмкін емес
- **Аралануға болады** — символдар арқылы цикл жүргізуге болады
- **Реттелген** — символдар өз позицияларын сақтайды

```python
# Бұл қатеге әкеледі:
мәтін = "Сәлем"
# мәтін[0] = "с"  # TypeError!

# Оның орнына жаңа жол жасаңыз:
мәтін = "с" + мәтін[1:]  # "сәлем"
```
""", None, None),

    # Модуль 4: Жол функциялары
    (modules[3].id, "Негізгі жол функциялары", """# Жол функциялары

## len() — Ұзындық

```python
мәтін = "Сәлем Әлем"
print(len(мәтін))  # 10
```

## split() — Тізімге бөлу

```python
сөйлем = "Сәлем Әлем Python"
сөздер = сөйлем.split()
print(сөздер)  # ['Сәлем', 'Әлем', 'Python']

csv = "а,б,в,г"
элементтер = csv.split(",")
print(элементтер)  # ['а', 'б', 'в', 'г']
```

## replace() — Ішкі жолды ауыстыру

```python
мәтін = "Сәлем Әлем"
жаңа_мәтін = мәтін.replace("Әлем", "Python")
print(жаңа_мәтін)  # Сәлем Python
```

## Регистр функциялары

```python
мәтін = "Сәлем Әлем"
print(мәтін.upper())      # СӘЛЕМ ӘЛЕМ
print(мәтін.lower())      # сәлем әлем
print(мәтін.title())      # Сәлем Әлем
print(мәтін.capitalize()) # Сәлем әлем
```

## Іздеу және тексеру

```python
мәтін = "Сәлем Әлем"
print(мәтін.find("Әлем"))      # 6
print(мәтін.count("е"))        # 2
print(мәтін.startswith("Сәл")) # True
print(мәтін.endswith("лем"))   # True
print("Әлем" in мәтін)         # True
```

## Бос орындарды кесу

```python
мәтін = "  Сәлем  "
print(мәтін.strip())   # "Сәлем"
print(мәтін.lstrip())  # "Сәлем  "
print(мәтін.rstrip())  # "  Сәлем"
```
""", None, None),

    # Модуль 5: Жолдардағы циклдер
    (modules[4].id, "Жолдарды циклмен аралау", """# Жолдардағы циклдер

## Жолмен for циклі

```python
сөз = "Python"
for символ in сөз:
    print(символ)
# P
# y
# t
# h
# o
# n
```

## Индекспен цикл

```python
сөз = "Python"
for i in range(len(сөз)):
    print(f"Индекс {i}: {сөз[i]}")
```

## enumerate() пайдалану

```python
сөз = "Python"
for i, символ in enumerate(сөз):
    print(f"{i}: {символ}")
```

## Практикалық мысалдар

### Дауысты дыбыстарды санау
```python
мәтін = "Сәлем Әлем"
дауысты = "аәеиіоөуүяюёэ"
саны = 0
for символ in мәтін.lower():
    if символ in дауысты:
        саны += 1
print(f"Дауысты дыбыстар: {саны}")
```

### Жолды кері айналдыру
```python
мәтін = "Сәлем"
кері_мәтін = ""
for символ in мәтін:
    кері_мәтін = символ + кері_мәтін
print(кері_мәтін)  # меләС
```

### Палиндром тексеру
```python
сөз = "казак"
палиндром = сөз == сөз[::-1]
print(палиндром)  # True
```
""", None, None),

    # Модуль 6: Тұрақты өрнектер
    (modules[5].id, "Тұрақты өрнектерге кіріспе", """# Тұрақты өрнектер (Regex)

`re` модулі Python-да regex қолдауын қамтамасыз етеді.

## Негізгі қолданыс

```python
import re

мәтін = "Менің телефоным 123-456-7890"
үлгі = r'\\d{3}-\\d{3}-\\d{4}'
сәйкестік = re.search(үлгі, мәтін)
print(сәйкестік.group())  # 123-456-7890
```

## Жалпы үлгілер

| Үлгі | Сәйкес келеді |
|------|---------------|
| `\\d` | Кез келген цифр (0-9) |
| `\\w` | Кез келген сөз символы |
| `\\s` | Кез келген бос орын |
| `.` | Кез келген символ |
| `+` | Бір немесе одан көп |
| `*` | Нөл немесе одан көп |
| `?` | Нөл немесе бір |
| `{n}` | Дәл n рет |

## Негізгі функциялар

```python
import re

# findall — барлық сәйкестіктерді табу
сандар = re.findall(r'\\d+', "abc 123 def 456")
print(сандар)  # ['123', '456']

# sub — үлгіні ауыстыру
нәтиже = re.sub(r'\\d+', 'X', "abc 123 def 456")
print(нәтиже)  # abc X def X

# split — үлгімен бөлу
бөліктер = re.split(r'[,;]', "а,б;в,г")
print(бөліктер)  # ['а', 'б', 'в', 'г']
```

## Практикалық мысал: Электрондық пошта тексеру

```python
import re

email = "user@example.com"
үлгі = r'^[\\w.-]+@[\\w.-]+\\.\\w+$'
if re.match(үлгі, email):
    print("Жарамды электрондық пошта")
```
""", None, None),

    # Модуль 7: Мәтіндік файлдармен жұмыс
    (modules[6].id, "Файлдарды оқу және жазу", """# Мәтіндік файлдармен жұмыс

## Файлды оқу

```python
# Бүкіл файлды оқу
with open("деректер.txt", "r") as ф:
    мазмұн = ф.read()
    print(мазмұн)

# Жол-жолмен оқу
with open("деректер.txt", "r") as ф:
    for жол in ф:
        print(жол.strip())

# Барлық жолдарды тізімге оқу
with open("деректер.txt", "r") as ф:
    жолдар = ф.readlines()
```

## Файлға жазу

```python
# Жазу (бар мазмұнды жояды)
with open("нәтиже.txt", "w") as ф:
    ф.write("Сәлем Әлем\\n")
    ф.write("Екінші жол\\n")

# Файлға қосу
with open("нәтиже.txt", "a") as ф:
    ф.write("Жаңа жол қосылды\\n")
```

## `with` операторы

`with` файлдың дұрыс жабылуын қамтамасыз етеді:

```python
# Жақсы — файл автоматты жабылады
with open("деректер.txt") as ф:
    деректер = ф.read()

# with-сіз — қолмен жабу керек
ф = open("деректер.txt")
деректер = ф.read()
ф.close()  # Ұмытпаңыз!
```

## Практикалық мысал: Сөздерді санау

```python
with open("мәтін.txt", "r") as ф:
    мәтін = ф.read()

сөздер = мәтін.split()
сөздер_саны = len(сөздер)
print(f"Жалпы сөздер: {сөздер_саны}")

# Нақты сөзді санау
нысан = "python"
саны = мәтін.lower().split().count(нысан)
print(f"'{нысан}' саны: {саны} рет")
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
# Тест 1: Python негіздері
test1 = Test(title="Python негіздері бойынша тест", module_id=modules[0].id, difficulty="easy")
db.add(test1)
db.flush()

test1_questions = [
    Question(test_id=test1.id, question_type="mcq", order=1,
             text="print(2 ** 3) нәтижесі қандай?",
             options=["5", "6", "8", "9"],
             correct_answer="8",
             explanation="** дәреже операторы. 2-нің 3-ші дәрежесі = 8"),
    Question(test_id=test1.id, question_type="mcq", order=2,
             text="Python-да функцияны анықтау үшін қай кілт сөз қолданылады?",
             options=["function", "func", "def", "define"],
             correct_answer="def",
             explanation="Python-да функциялар 'def' кілт сөзімен анықталады."),
    Question(test_id=test1.id, question_type="mcq", order=3,
             text="True мәнінің типі қандай?",
             options=["int", "str", "bool", "float"],
             correct_answer="bool",
             explanation="True және False логикалық (bool) мәндер болып табылады."),
    Question(test_id=test1.id, question_type="choose_code", order=4,
             text="Қай код 0-ден 4-ке дейінгі сандарды дұрыс шығарады?",
             options=[
                 "for i in range(5): print(i)",
                 "for i in range(1,5): print(i)",
                 "for i in range(4): print(i)",
                 "for i in [0,1,2,3,4,5]: print(i)",
             ],
             correct_answer="for i in range(5): print(i)",
             explanation="range(5) 0,1,2,3,4 сандарын генерациялайды"),
    Question(test_id=test1.id, question_type="mcq", order=5,
             text="len('Сәлем') қанша қайтарады?",
             options=["4", "5", "6", "Қате"],
             correct_answer="5",
             explanation="len() символдар санын қайтарады. 'Сәлем' 5 символдан тұрады."),
]
db.add_all(test1_questions)

# Тест 2: Жол функциялары
test2 = Test(title="Жол функциялары тесті", module_id=modules[3].id, difficulty="medium")
db.add(test2)
db.flush()

test2_questions = [
    Question(test_id=test2.id, question_type="mcq", order=1,
             text="'сәлем әлем'.split() нені қайтарады?",
             options=["['сәлем әлем']", "['сәлем', 'әлем']", "('сәлем', 'әлем')", "['с','ә','л','е','м',' ','ә','л','е','м']"],
             correct_answer="['сәлем', 'әлем']",
             explanation="split() аргументсіз бос орын бойынша бөледі."),
    Question(test_id=test2.id, question_type="find_bug", order=2,
             text="Қатені табыңыз:\n```python\nмәтін = 'Сәлем'\nмәтін[0] = 'с'\nprint(мәтін)\n```",
             options=["1-жол: тырнақша қате", "2-жол: жолдар өзгермейді", "3-жол: print қате", "Қате жоқ"],
             correct_answer="2-жол: жолдар өзгермейді",
             explanation="Python-дағы жолдар өзгермейді. Жекелеген символдарды өзгерту мүмкін емес."),
    Question(test_id=test2.id, question_type="mcq", order=3,
             text="'Python'.replace('P', 'J') нені қайтарады?",
             options=["'Python'", "'Jython'", "'python'", "Қате"],
             correct_answer="'Jython'",
             explanation="replace() бірінші аргументті екіншісіне ауыстырады."),
    Question(test_id=test2.id, question_type="matching", order=4,
             text="Функцияны оның мақсатымен сәйкестендіріңіз:",
             options={
                 "left": ["len()", "split()", "upper()", "strip()"],
                 "right": ["Ұзындықты қайтарады", "Тізімге бөледі", "БАС ӘРІП", "Бос орынды кеседі"],
             },
             correct_answer={"len()": "Ұзындықты қайтарады", "split()": "Тізімге бөледі", "upper()": "БАС ӘРІП", "strip()": "Бос орынды кеседі"},
             explanation="Бұл негізгі жол әдістері."),
    Question(test_id=test2.id, question_type="choose_code", order=5,
             text="Сөйлемдегі сөздерді санайтын қай код дұрыс?",
             options=[
                 "len(сөйлем.split())",
                 "сөйлем.count(' ')",
                 "len(сөйлем)",
                 "сөйлем.words()",
             ],
             correct_answer="len(сөйлем.split())",
             explanation="split() сөйлемді сөздерге бөледі, len() оларды санайды."),
]
db.add_all(test2_questions)

# Тест 3: Тұрақты өрнектер
test3 = Test(title="Тұрақты өрнектер тесті", module_id=modules[5].id, difficulty="hard")
db.add(test3)
db.flush()

test3_questions = [
    Question(test_id=test3.id, question_type="mcq", order=1,
             text="\\d+ нені сәйкестендіреді?",
             options=["Бір цифр", "Бір немесе одан көп цифр", "Нөл немесе одан көп цифр", "Әріптер"],
             correct_answer="Бір немесе одан көп цифр",
             explanation="\\d бір цифрды сәйкестендіреді, + бір немесе одан көп дегенді білдіреді."),
    Question(test_id=test3.id, question_type="mcq", order=2,
             text="Барлық сәйкестіктерді тізім ретінде қайтаратын функция қайсы?",
             options=["re.search()", "re.match()", "re.findall()", "re.split()"],
             correct_answer="re.findall()",
             explanation="findall() қабаттаспайтын барлық сәйкестіктерді қайтарады."),
    Question(test_id=test3.id, question_type="choose_code", order=3,
             text="Мәтіндегі барлық email-дерді табатын код қайсы?",
             options=[
                 "re.findall(r'[\\w.]+@[\\w.]+', мәтін)",
                 "re.search(r'email', мәтін)",
                 "мәтін.find('@')",
                 "re.match(r'@', мәтін)",
             ],
             correct_answer="re.findall(r'[\\w.]+@[\\w.]+', мәтін)",
             explanation="Regex үлгісі email-тәрізді жолдарды сәйкестендіреді."),
]
db.add_all(test3_questions)

# ── Code Tasks ─────────────────────────────────────────
task1 = CodeTask(
    title="Мәтіндегі сөздерді санау",
    description="""Мәтінді оқитын және сөздер санын шығаратын Python бағдарламасын жазыңыз.

Сөз — бос орындармен бөлінген символдардың кез келген тізбегі.

**Мысал:**
Кіріс: `Сәлем Әлем Python`
Шығыс: `3`""",
    module_id=modules[3].id,
    difficulty="easy",
    starter_code='мәтін = input()\n# Кодыңызды осында жазыңыз\n',
    test_cases=[
        {"input": "Сәлем Әлем Python", "expected_output": "3"},
        {"input": "бір", "expected_output": "1"},
        {"input": "Бұл сынақ сөйлемі", "expected_output": "3"},
        {"input": "  бос  орындар  ", "expected_output": "2"},
        {"input": "", "expected_output": "0"},
    ],
)

task2 = CodeTask(
    title="Жолды кері айналдыру",
    description="""Жолды оқитын және оны кері ретпен шығаратын бағдарлама жазыңыз.

**Мысал:**
Кіріс: `Сәлем`
Шығыс: `меләС`""",
    module_id=modules[2].id,
    difficulty="easy",
    starter_code='мәтін = input()\n# Кодыңызды осында жазыңыз\n',
    test_cases=[
        {"input": "Сәлем", "expected_output": "меләС"},
        {"input": "Python", "expected_output": "nohtyP"},
        {"input": "abcde", "expected_output": "edcba"},
        {"input": "а", "expected_output": "а"},
        {"input": "казак", "expected_output": "казак"},
    ],
)

task3 = CodeTask(
    title="Дауысты дыбыстарды санау",
    description="""Берілген жолдағы дауысты дыбыстар (а, е, и, о, у, ә, і, ө, ү) санын есептейтін бағдарлама жазыңыз. Регистрге сезімтал емес.

**Мысал:**
Кіріс: `Сәлем Әлем`
Шығыс: `4`""",
    module_id=modules[4].id,
    difficulty="medium",
    starter_code='мәтін = input()\n# Кодыңызды осында жазыңыз\n',
    test_cases=[
        {"input": "Сәлем Әлем", "expected_output": "4"},
        {"input": "АЕИОУ", "expected_output": "5"},
        {"input": "xyz", "expected_output": "0"},
        {"input": "Python", "expected_output": "1"},
        {"input": "аәеиіоөуү", "expected_output": "9"},
    ],
)

db.add_all([task1, task2, task3])

# ── Badges ─────────────────────────────────────────────
badges_data = [
    ("first_lesson", "Алғашқы сабақ", "Алғашқы сабағыңызды аяқтадыңыз", "📖"),
    ("first_test", "Алғашқы тест", "Алғашқы тестіңізді тапсырдыңыз", "📝"),
    ("five_lessons", "Білім іздеуші", "5 сабақты аяқтадыңыз", "🎯"),
    ("three_tests_passed", "Тест шебері", "3 тестті тапсырдыңыз", "🏆"),
    ("perfect_score", "Мінсіз нәтиже", "Тестте 100% алдыңыз", "⭐"),
    ("seven_day_streak", "Апта жауынгері", "7 күндік серияны сақтадыңыз", "🔥"),
]
for key, title, desc, icon in badges_data:
    db.add(Badge(key=key, title=title, description=desc, icon=icon))

db.commit()
db.close()

print("✅ Деректер базасы сәтті толтырылды!")
print()
print("Кіру деректері:")
print("  Мұғалім: teacher / teacher123")
print("  Оқушы: aisha / aisha123")
print("  Оқушы: daniyar / daniyar123")
print("  Оқушы: zarina / zarina123")
