-- Add explanations to existing questions in FlowQuest
-- This script adds helpful explanations for the hint powerup system

-- Update Easy Questions with explanations
UPDATE public.question SET explanation = 'The condition 5 > 3 is True, so the print statement executes.' 
WHERE question_text = 'What is the output? if 5 > 3: print("Hello")' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "if" keyword is used for conditional statements in Python.' 
WHERE question_text = 'What keyword is used for conditional statements in Python?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'Since the condition is False, the else block executes and prints "B".' 
WHERE question_text = 'What is the output? if False: print("A") else: print("B")' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The == operator checks for equality, while = is for assignment.' 
WHERE question_text = 'Which operator checks if two values are equal?' AND difficulty = 'easy';

UPDATE public.question SET explanation = '10 == 10 evaluates to True, so "Yes" is printed.' 
WHERE question_text = 'What is the output? if 10 == 10: print("Yes")' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "for" loop is used when you know how many times to iterate.' 
WHERE question_text = 'Which loop is used to iterate a specific number of times?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'range(3) generates 0, 1, 2 - the loop prints each value.' 
WHERE question_text = 'What is the output? for i in range(3): print(i)' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "break" keyword immediately exits the current loop.' 
WHERE question_text = 'Which keyword exits a loop early?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "continue" keyword skips the rest of the current iteration.' 
WHERE question_text = 'Which keyword skips to the next iteration of a loop?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The loop prints "Hi" once, then break exits the loop.' 
WHERE question_text = 'What is the output? while True: print("Hi"); break' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'AND returns True only if both operands are True. True and False = False.' 
WHERE question_text = 'What is the result of: True and False?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'OR returns True if at least one operand is True. True or False = True.' 
WHERE question_text = 'What is the result of: True or False?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'NOT inverts the boolean value. not True = False.' 
WHERE question_text = 'What is the result of: not True?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'Both conditions are True (5<10 and 3>1), so "OK" is printed.' 
WHERE question_text = 'What is the output? if 5 < 10 and 3 > 1: print("OK")' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The OR condition is True because 3>1 is True, so "Yes" is printed.' 
WHERE question_text = 'What is the output? if 5 > 10 or 3 > 1: print("Yes")' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "def" keyword is used to define functions in Python.' 
WHERE question_text = 'Which keyword is used to define a function?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "return" keyword sends a value back from the function.' 
WHERE question_text = 'Which keyword returns a value from a function?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The function f() returns 5, which is then printed.' 
WHERE question_text = 'What is the output? def f(): return 5; print(f())' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "pass" statement does nothing - it''s a placeholder.' 
WHERE question_text = 'What does pass do in Python?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'Functions without a return statement implicitly return None.' 
WHERE question_text = 'What is the output? def f(): pass; print(f())' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'range(5) generates numbers from 0 to 4 (5 numbers total).' 
WHERE question_text = 'What does range(5) generate?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'range(5) has 5 elements: 0, 1, 2, 3, 4.' 
WHERE question_text = 'What is the output? print(len(range(5)))' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The end="" parameter prevents newlines, so numbers print together.' 
WHERE question_text = 'What is the output? for i in [1,2,3]: print(i, end="")' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "for" loop is the standard way to iterate over lists.' 
WHERE question_text = 'Which function is used to iterate over a list?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'range(1, 4) generates 1, 2, 3 (start inclusive, stop exclusive).' 
WHERE question_text = 'What is the output? print(list(range(1, 4)))' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The != operator means "not equal to" - it returns True if values differ.' 
WHERE question_text = 'What does != mean?' AND difficulty = 'easy';

UPDATE public.question SET explanation = '5 != 3 is True because 5 is not equal to 3.' 
WHERE question_text = 'What is the output? print(5 != 3)' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The >= operator means "greater than or equal to". 10 >= 10 is True.' 
WHERE question_text = 'What is the output? print(10 >= 10)' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "in" operator checks if a value exists in a list or other container.' 
WHERE question_text = 'What operator checks if value is in a list?' AND difficulty = 'easy';

UPDATE public.question SET explanation = 'The "in" operator returns True because 2 is in the list [1,2,3].' 
WHERE question_text = 'What is the output? print(2 in [1,2,3])' AND difficulty = 'easy';

-- Update Medium Questions with explanations
UPDATE public.question SET explanation = 'Both conditions are True (x>3 and x<10), so "OK" is printed.' 
WHERE question_text = 'What is the output? x=5; if x>3: if x<10: print("OK")' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'elif is short for "else if" - it allows multiple conditions.' 
WHERE question_text = 'What is elif short for?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'x=7 is not <5, but it is <10, so the elif condition triggers and prints "B".' 
WHERE question_text = 'What is the output? x=7; if x<5: print("A") elif x<10: print("B") else: print("C")' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'You can have as many elif statements as needed in a chain.' 
WHERE question_text = 'How many elif statements can you have?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The first True condition (x==15) executes, printing "B".' 
WHERE question_text = 'What is the output? x=15; if x<10: print("A") elif x==15: print("B") elif x>10: print("C")' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The loop breaks when i==3, so only 0, 1, 2 are printed.' 
WHERE question_text = 'What is the output? for i in range(5): if i==3: break; print(i, end="")' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'continue skips i==1, so only 0 and 2 are printed.' 
WHERE question_text = 'What is the output? for i in range(3): if i==1: continue; print(i, end="")' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'break only exits the innermost loop, not all nested loops.' 
WHERE question_text = 'What happens if break is in nested loop?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'After the loop, i retains its last value (2) from the range.' 
WHERE question_text = 'What is the output? for i in range(3): pass; print(i)' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The else block after a for loop runs only if no break occurred.' 
WHERE question_text = 'What does else do after a for loop?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The loop runs while x<3, printing 0, 1, 2, then x becomes 3 and stops.' 
WHERE question_text = 'What is the output? x=0; while x<3: print(x, end=""); x+=1' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'x decreases from 5 to 0, printing 4, 3, 2, 1, 0.' 
WHERE question_text = 'What is the output? x=5; while x>0: x-=1; print(x, end="")' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'while True creates an infinite loop unless broken with break.' 
WHERE question_text = 'What causes an infinite loop?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The loop prints 0, increments to 1, prints 1, then breaks.' 
WHERE question_text = 'What is the output? x=0; while x<2: print(x); if x==1: break; x+=1' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'Since the condition is False, the loop body never executes.' 
WHERE question_text = 'What is the output? x=0; while False: x+=1; print(x)' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'List comprehension [x for x in range(3)] creates [0, 1, 2].' 
WHERE question_text = 'What is the output? print([x for x in range(3)])' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The condition x%2==0 filters for even numbers: 0, 2, 4.' 
WHERE question_text = 'What is the output? print([x for x in range(5) if x%2==0])' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'Each element is multiplied by 2: [1*2, 2*2, 3*2] = [2, 4, 6].' 
WHERE question_text = 'What does this return? [x*2 for x in [1,2,3]]' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The ternary operator x if x>1 else 0 replaces values ≤1 with 0.' 
WHERE question_text = 'What is the output? print([x if x>1 else 0 for x in [0,1,2,3]])' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'List comprehensions are generally faster than equivalent for loops.' 
WHERE question_text = 'Which is faster for creating lists?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The "try" keyword starts a block that might raise exceptions.' 
WHERE question_text = 'Which keyword starts exception handling?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'Division by zero raises an exception, which is caught and "Error" is printed.' 
WHERE question_text = 'What is the output? try: print(1/0) except: print("Error")' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The "finally" block always executes, regardless of exceptions.' 
WHERE question_text = 'Which block always executes after try-except?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'The finally block always runs last, setting x=3.' 
WHERE question_text = 'What is the output? try: x=1 except: x=2 finally: x=3; print(x)' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'Uncaught exceptions cause the program to crash with an error message.' 
WHERE question_text = 'What happens if exception not caught?' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'Chained comparisons are evaluated as: 5 < 10 and 10 < 15, which is True.' 
WHERE question_text = 'What is the output? print(5 < 10 < 15)' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'not (5 > 3) = not True = False.' 
WHERE question_text = 'What is the output? print(not (5 > 3))' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'True and not False = True and True = True.' 
WHERE question_text = 'What is the output? print(True and not False)' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'AND has higher precedence than OR, so "and" is evaluated first.' 
WHERE question_text = 'What is evaluated first? x or y and z' AND difficulty = 'medium';

UPDATE public.question SET explanation = 'OR returns the first truthy value. 0 is falsy, so it returns 5.' 
WHERE question_text = 'What is the output? print(0 or 5)' AND difficulty = 'medium';

-- Update Hard Questions with explanations
UPDATE public.question SET explanation = 'The inner break only exits the j loop, so i*j is printed for (0,0) and (2,0).' 
WHERE question_text = 'What is the output? for i in range(3): for j in range(2): if i==j: break; print(i*j, end="")' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'continue skips i==1, but the else clause only runs when the loop completes normally.' 
WHERE question_text = 'What is the output? for i in range(3): if i==1: continue; else: print(i, end="")' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'The walrus operator := assigns and returns the value, incrementing x 3 times.' 
WHERE question_text = 'What is the output? x=0; [x:=x+1 for i in range(3)]; print(x)' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'The else clause after a for loop runs when no break occurs.' 
WHERE question_text = 'What is the output? for i in range(2): pass; else: print("Done")' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'The walrus operator assigns 5 to x, then checks if 5 > 3, prints 5, then breaks.' 
WHERE question_text = 'What is the output? while (x:=5) > 3: print(x); break' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'Nested ternary: x>3 is True, so "A" is returned.' 
WHERE question_text = 'What is the output? x=5; print("A" if x>3 else "B" if x>1 else "C")' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'Chained equality: x==y==5 means x==y and y==5, both True.' 
WHERE question_text = 'What is the output? x=y=5; print(x==y==5)' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'The walrus operator assigns 5, then and evaluates print("OK") (returns None), so result is None.' 
WHERE question_text = 'What is evaluated? (x:=5) > 3 and print("OK")' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'Nested ternary: x is truthy (1), so it returns 1.' 
WHERE question_text = 'What is the output? x=1; print(x if x else 2 if False else 3)' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'all() returns True only if all elements are truthy. False makes it False.' 
WHERE question_text = 'What is the result? all([True, True, False])' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'The function returns x if x>0, otherwise 0. -5 is not >0, so returns 0.' 
WHERE question_text = 'What is the output? def f(x): return x if x>0 else 0; print(f(-5))' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'Default mutable arguments are shared across function calls. x starts as [] and becomes [1].' 
WHERE question_text = 'What is the output? def f(x=[],y=1): x.append(y); return x; print(f())' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'A closure is a function that captures variables from its enclosing scope.' 
WHERE question_text = 'What is a closure in Python?' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'Lambda functions are anonymous functions. f(5) = 5*2 = 10.' 
WHERE question_text = 'What is the output? f=lambda x:x*2; print(f(5))' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'yield both returns a value and creates a generator that can pause and resume.' 
WHERE question_text = 'What does yield do in a function?' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'Generator expressions create generator objects, not lists.' 
WHERE question_text = 'What is the type? g=(x for x in range(3))' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'The generator produces 1*2=2 and 2*2=4, converted to list [2, 4].' 
WHERE question_text = 'What is the output? g=(x*2 for x in [1,2]); print(list(g))' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'Generators are consumed once - after iteration, they''re exhausted.' 
WHERE question_text = 'How many times can you iterate a generator?' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'next(g) advances to the second value (1) and returns it.' 
WHERE question_text = 'What is the output? g=(x for x in range(2)); next(g); print(next(g))' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'After first list(g) consumes the generator, second list(g) gets an empty generator.' 
WHERE question_text = 'What happens? g=(x for x in range(2)); list(g); list(g)' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'False and ... short-circuits (doesn''t evaluate print("A")), then OR evaluates print("B").' 
WHERE question_text = 'What is the output? False and print("A") or print("B")' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'True or ... short-circuits immediately, returning True without evaluating the rest.' 
WHERE question_text = 'What is the output? True or print("A") and print("B")' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'AND returns the last evaluated value. 5 and 10 evaluates to 10.' 
WHERE question_text = 'What is evaluated in: x=5 and 10' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'OR returns the first truthy value. 0 is falsy, so it returns 5.' 
WHERE question_text = 'What is evaluated in: x=0 or 5' AND difficulty = 'hard';

UPDATE public.question SET explanation = 'OR returns the first truthy value. [] is falsy, so it returns [1].' 
WHERE question_text = 'What is the output? x=[]; y=x or [1]; print(y)' AND difficulty = 'hard';

-- Verify the updates
SELECT 'Explanations added successfully!' as status;

-- Show count of questions with explanations
SELECT difficulty, COUNT(*) as total_questions, 
       COUNT(explanation) as questions_with_explanations
FROM public.question 
GROUP BY difficulty 
ORDER BY 
  CASE difficulty 
    WHEN 'easy' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'hard' THEN 3 
  END;
