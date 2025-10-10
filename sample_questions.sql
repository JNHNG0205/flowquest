-- Python Control Flow Questions for FlowQuest
-- Run this in your Supabase SQL Editor to add questions
-- All questions are randomized when fetched during gameplay

-- Clear existing questions (optional - comment out if you want to keep existing)
-- TRUNCATE TABLE public.question RESTART IDENTITY CASCADE;

-- Insert 80+ Python Control Flow Questions across different difficulty levels

-- ============================================
-- EASY QUESTIONS (30 questions)
-- ============================================

-- Basic If Statements
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? if 5 > 3: print("Hello")', '["Hello", "Error", "Nothing", "5"]', 'Hello', 'easy'),
('What keyword is used for conditional statements in Python?', '["when", "if", "check", "condition"]', 'if', 'easy'),
('What is the output? if False: print("A") else: print("B")', '["A", "B", "AB", "Error"]', 'B', 'easy'),
('Which operator checks if two values are equal?', '["=", "==", "!=", "is"]', '==', 'easy'),
('What is the output? if 10 == 10: print("Yes")', '["Yes", "No", "10", "Error"]', 'Yes', 'easy');

-- Basic Loops
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('Which loop is used to iterate a specific number of times?', '["while", "for", "loop", "repeat"]', 'for', 'easy'),
('What is the output? for i in range(3): print(i)', '["0 1 2", "1 2 3", "0 1 2 3", "1 2"]', '0 1 2', 'easy'),
('Which keyword exits a loop early?', '["exit", "break", "stop", "end"]', 'break', 'easy'),
('Which keyword skips to the next iteration of a loop?', '["skip", "next", "continue", "pass"]', 'continue', 'easy'),
('What is the output? while True: print("Hi"); break', '["Hi", "Infinite Hi", "Error", "Nothing"]', 'Hi', 'easy');

-- Boolean Logic
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the result of: True and False?', '["True", "False", "None", "Error"]', 'False', 'easy'),
('What is the result of: True or False?', '["True", "False", "None", "Error"]', 'True', 'easy'),
('What is the result of: not True?', '["True", "False", "None", "1"]', 'False', 'easy'),
('What is the output? if 5 < 10 and 3 > 1: print("OK")', '["OK", "Error", "Nothing", "5"]', 'OK', 'easy'),
('What is the output? if 5 > 10 or 3 > 1: print("Yes")', '["Yes", "No", "Error", "Nothing"]', 'Yes', 'easy');

-- Basic Function Control Flow
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('Which keyword is used to define a function?', '["func", "define", "def", "function"]', 'def', 'easy'),
('Which keyword returns a value from a function?', '["give", "return", "output", "send"]', 'return', 'easy'),
('What is the output? def f(): return 5; print(f())', '["5", "f()", "None", "Error"]', '5', 'easy'),
('What does pass do in Python?', '["Exits program", "Does nothing", "Returns None", "Raises error"]', 'Does nothing', 'easy'),
('What is the output? def f(): pass; print(f())', '["pass", "None", "Error", "Nothing"]', 'None', 'easy');

-- Range and Iteration
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What does range(5) generate?', '["1 to 5", "0 to 5", "0 to 4", "1 to 4"]', '0 to 4', 'easy'),
('What is the output? print(len(range(5)))', '["4", "5", "6", "Error"]', '5', 'easy'),
('What is the output? for i in [1,2,3]: print(i, end="")', '["123", "1 2 3", "Error", "[1,2,3]"]', '123', 'easy'),
('Which function is used to iterate over a list?', '["for", "while", "each", "iterate"]', 'for', 'easy'),
('What is the output? print(list(range(1, 4)))', '["[1, 2, 3]", "[0, 1, 2, 3]", "[1, 4]", "Error"]', '[1, 2, 3]', 'easy');

-- Comparison Operators
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What does != mean?', '["Equal to", "Not equal to", "Less than", "Greater than"]', 'Not equal to', 'easy'),
('What is the output? print(5 != 3)', '["True", "False", "5", "3"]', 'True', 'easy'),
('What is the output? print(10 >= 10)', '["True", "False", "10", "Error"]', 'True', 'easy'),
('What operator checks if value is in a list?', '["contains", "has", "in", "exists"]', 'in', 'easy'),
('What is the output? print(2 in [1,2,3])', '["True", "False", "2", "Error"]', 'True', 'easy');

-- ============================================
-- MEDIUM QUESTIONS (30 questions)
-- ============================================

-- Nested If Statements
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? x=5; if x>3: if x<10: print("OK")', '["OK", "Nothing", "Error", "5"]', 'OK', 'medium'),
('What is elif short for?', '["else function", "else if", "end if", "equal if"]', 'else if', 'medium'),
('What is the output? x=7; if x<5: print("A") elif x<10: print("B") else: print("C")', '["A", "B", "C", "AB"]', 'B', 'medium'),
('How many elif statements can you have?', '["1", "2", "Unlimited", "None"]', 'Unlimited', 'medium'),
('What is the output? x=15; if x<10: print("A") elif x==15: print("B") elif x>10: print("C")', '["A", "B", "C", "BC"]', 'B', 'medium');

-- Loop Control
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? for i in range(5): if i==3: break; print(i, end="")', '["01234", "0123", "012", "01"]', '012', 'medium'),
('What is the output? for i in range(3): if i==1: continue; print(i, end="")', '["012", "02", "01", "12"]', '02', 'medium'),
('What happens if break is in nested loop?', '["Exits all loops", "Exits innermost loop", "Error", "Nothing"]', 'Exits innermost loop', 'medium'),
('What is the output? for i in range(3): pass; print(i)', '["0 1 2", "2", "Error", "Nothing"]', '2', 'medium'),
('What does else do after a for loop?', '["Never runs", "Runs if no break", "Runs always", "Syntax error"]', 'Runs if no break', 'medium');

-- While Loop Logic
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? x=0; while x<3: print(x, end=""); x+=1', '["012", "123", "0123", "Infinite"]', '012', 'medium'),
('What is the output? x=5; while x>0: x-=1; print(x, end="")', '["54321", "43210", "4321", "5432"]', '43210', 'medium'),
('What causes an infinite loop?', '["while True", "while False", "while 0", "All of above"]', 'while True', 'medium'),
('What is the output? x=0; while x<2: print(x); if x==1: break; x+=1', '["0 1", "0", "1", "0 1 2"]', '0 1', 'medium'),
('What is the output? x=0; while False: x+=1; print(x)', '["0", "1", "Nothing", "Error"]', '0', 'medium');

-- List Comprehension with Control Flow
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? print([x for x in range(3)])', '["[0, 1, 2]", "[1, 2, 3]", "Error", "0 1 2"]', '[0, 1, 2]', 'medium'),
('What is the output? print([x for x in range(5) if x%2==0])', '["[0, 2, 4]", "[1, 3]", "[2, 4]", "[0, 1, 2, 3, 4]"]', '[0, 2, 4]', 'medium'),
('What does this return? [x*2 for x in [1,2,3]]', '["[1, 2, 3]", "[2, 4, 6]", "[3, 6, 9]", "Error"]', '[2, 4, 6]', 'medium'),
('What is the output? print([x if x>1 else 0 for x in [0,1,2,3]])', '["[0, 0, 2, 3]", "[0, 1, 2, 3]", "[2, 3]", "Error"]', '[0, 0, 2, 3]', 'medium'),
('Which is faster for creating lists?', '["for loop", "list comprehension", "Same speed", "while loop"]', 'list comprehension', 'medium');

-- Exception Handling
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('Which keyword starts exception handling?', '["catch", "try", "handle", "except"]', 'try', 'medium'),
('What is the output? try: print(1/0) except: print("Error")', '["0", "Error", "1/0", "Crash"]', 'Error', 'medium'),
('Which block always executes after try-except?', '["finally", "always", "end", "close"]', 'finally', 'medium'),
('What is the output? try: x=1 except: x=2 finally: x=3; print(x)', '["1", "2", "3", "Error"]', '3', 'medium'),
('What happens if exception not caught?', '["Program continues", "Program crashes", "Returns None", "Ignores error"]', 'Program crashes', 'medium');

-- Logical Operators
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? print(5 < 10 < 15)', '["True", "False", "Error", "None"]', 'True', 'medium'),
('What is the output? print(not (5 > 3))', '["True", "False", "5", "3"]', 'False', 'medium'),
('What is the output? print(True and not False)', '["True", "False", "None", "Error"]', 'True', 'medium'),
('What is evaluated first? x or y and z', '["or", "and", "Left to right", "Right to left"]', 'and', 'medium'),
('What is the output? print(0 or 5)', '["0", "5", "True", "False"]', '5', 'medium');

-- ============================================
-- HARD QUESTIONS (20 questions)
-- ============================================

-- Advanced Loop Control
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? for i in range(3): for j in range(2): if i==j: break; print(i*j, end="")', '["0000", "000", "00", "0"]', '00', 'hard'),
('What is the output? for i in range(3): if i==1: continue; else: print(i, end="")', '["02", "012", "01", "0"]', '02', 'hard'),
('What is the output? x=0; [x:=x+1 for i in range(3)]; print(x)', '["0", "1", "2", "3"]', '3', 'hard'),
('What is the output? for i in range(2): pass; else: print("Done")', '["Nothing", "Done", "Error", "pass"]', 'Done', 'hard'),
('What is the output? while (x:=5) > 3: print(x); break', '["5", "Infinite 5", "Error", "3"]', '5', 'hard');

-- Complex Conditionals
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? x=5; print("A" if x>3 else "B" if x>1 else "C")', '["A", "B", "C", "Error"]', 'A', 'hard'),
('What is the output? x=y=5; print(x==y==5)', '["True", "False", "Error", "None"]', 'True', 'hard'),
('What is evaluated? (x:=5) > 3 and print("OK")', '["OK then True", "True", "OK then None", "Error"]', 'OK then None', 'hard'),
('What is the output? x=1; print(x if x else 2 if False else 3)', '["1", "2", "3", "Error"]', '1', 'hard'),
('What is the result? all([True, True, False])', '["True", "False", "None", "Error"]', 'False', 'hard');

-- Advanced Functions
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? def f(x): return x if x>0 else 0; print(f(-5))', '["0", "-5", "5", "None"]', '0', 'hard'),
('What is the output? def f(x=[],y=1): x.append(y); return x; print(f())', '["[]", "[1]", "Error", "None"]', '[1]', 'hard'),
('What is a closure in Python?', '["Nested function", "Function with free variables", "Lambda function", "Recursive function"]', 'Function with free variables', 'hard'),
('What is the output? f=lambda x:x*2; print(f(5))', '["5", "10", "25", "Error"]', '10', 'hard'),
('What does yield do in a function?', '["Returns value", "Creates generator", "Pauses execution", "Both B and C"]', 'Both B and C', 'hard');

-- Generator Expressions
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the type? g=(x for x in range(3))', '["list", "tuple", "generator", "set"]', 'generator', 'hard'),
('What is the output? g=(x*2 for x in [1,2]); print(list(g))', '["[1, 2]", "[2, 4]", "generator", "Error"]', '[2, 4]', 'hard'),
('How many times can you iterate a generator?', '["Once", "Twice", "Unlimited", "Depends"]', 'Once', 'hard'),
('What is the output? g=(x for x in range(2)); next(g); print(next(g))', '["0", "1", "Error", "None"]', '1', 'hard'),
('What happens? g=(x for x in range(2)); list(g); list(g)', '["[0,1] twice", "[0,1] then []", "Error", "None"]', '[0,1] then []', 'hard');

-- Short Circuit Evaluation
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('What is the output? False and print("A") or print("B")', '["A", "B", "AB", "Nothing"]', 'B', 'hard'),
('What is the output? True or print("A") and print("B")', '["AB", "A", "B", "True"]', 'True', 'hard'),
('What is evaluated in: x=5 and 10', '["5", "10", "True", "False"]', '10', 'hard'),
('What is evaluated in: x=0 or 5', '["0", "5", "True", "False"]', '5', 'hard'),
('What is the output? x=[]; y=x or [1]; print(y)', '["[]", "[1]", "None", "Error"]', '[1]', 'hard');

-- Verify the count
SELECT difficulty, COUNT(*) as question_count 
FROM public.question 
GROUP BY difficulty 
ORDER BY 
  CASE difficulty 
    WHEN 'easy' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'hard' THEN 3 
  END;

-- Show sample of questions
SELECT question_id, LEFT(question_text, 50) as question_preview, difficulty 
FROM public.question 
ORDER BY difficulty, RANDOM() 
LIMIT 10;

-- Success message
SELECT 'Questions inserted successfully! Total: ' || COUNT(*) || ' questions' as status
FROM public.question;
