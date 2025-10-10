# 📚 Sample Questions Reference Guide

## Overview
- **Total Questions**: 80
- **Easy**: 30 questions
- **Medium**: 30 questions  
- **Hard**: 20 questions

## Categories

### Easy (30 questions)
- **Mathematics**: 5 questions (basic arithmetic)
- **Science**: 5 questions (general knowledge)
- **Geography**: 5 questions (countries, capitals)
- **General Knowledge**: 5 questions (everyday facts)
- **Technology**: 5 questions (basic tech)
- **History**: 5 questions (famous events/people)
- **Language**: 5 questions (basic vocabulary)

### Medium (30 questions)
- **Mathematics**: 5 questions (percentages, square roots)
- **Science**: 5 questions (chemistry, biology)
- **Geography**: 5 questions (capitals, rivers, deserts)
- **Technology**: 5 questions (programming, tech history)
- **History**: 5 questions (world history)
- **General Knowledge**: 5 questions (human body, culture)
- **Sports**: 5 questions (rules, scoring)

### Hard (20 questions)
- **Mathematics**: 5 questions (calculus, formulas)
- **Science**: 5 questions (chemistry, physics)
- **Geography**: 5 questions (specific facts)
- **Technology**: 5 questions (computer science)
- **History**: 5 questions (detailed history)

## How to Use

### 1. Add Questions to Database
```bash
# In Supabase SQL Editor, run:
sample_questions.sql
```

### 2. Verify Questions Added
```sql
SELECT COUNT(*) FROM public.question;
-- Should return: 80
```

### 3. Check Distribution
```sql
SELECT difficulty, COUNT(*) 
FROM public.question 
GROUP BY difficulty;
```

### 4. Random Question Selection
The game automatically selects random questions using:
```sql
SELECT * FROM question 
WHERE difficulty = $1 
ORDER BY RANDOM() 
LIMIT 1;
```

## Question Format

Each question has:
- `question_text`: The question
- `options`: JSON array of 4 choices
- `correct_answer`: The right answer
- `difficulty`: 'easy', 'medium', or 'hard'

Example:
```json
{
  "question_text": "What is 5 + 3?",
  "options": ["6", "7", "8", "9"],
  "correct_answer": "8",
  "difficulty": "easy"
}
```

## Adding More Questions

To add more questions, use this template:
```sql
INSERT INTO public.question (question_text, options, correct_answer, difficulty) VALUES
('Your question here?', '["Option A", "Option B", "Option C", "Option D"]', 'Correct Answer', 'easy');
```

## Tips
- Always provide exactly 4 options
- Make sure correct_answer matches one option exactly
- Balance question difficulty
- Test questions before adding to production
- Keep questions concise and clear
