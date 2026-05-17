import re
from agents.question_generator import generate_questions
from agents.feedback_engine import get_feedback
from agents.voice import speak, listen

def clean_text(text):
    """Remove markdown formatting so it reads naturally out loud"""
    text = re.sub(r'\*+', '', text)
    text = re.sub(r'#+', '', text)
    text = re.sub(r'^\d+\.\s*', '', text.strip())
    return text.strip()

def parse_questions(raw_text):
    """Extract individual questions from generated text"""
    questions = []
    lines = raw_text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Look for numbered lines
        if re.match(r'^\d+[\.\)]\s+', line):
            clean = re.sub(r'^\d+[\.\)]\s+', '', line)
            clean = clean_text(clean)
            if '?' in clean and len(clean) > 20:
                questions.append(clean)
    return questions

print("=" * 50)
print("  INTERVIEW PREP AI")
print("=" * 50)

print("\nPreparing your interview questions...\n")
questions_text = generate_questions()
questions = parse_questions(questions_text)

if not questions:
    print("Could not parse questions. Raw output:")
    print(questions_text)
    exit()

print(f"✅ Generated {len(questions)} questions\n")

speak("Welcome to your interview prep session. I will ask you questions and give feedback after each answer. Let's begin.")

for i, question in enumerate(questions[:3]):
    print(f"\n--- Question {i+1} of 3 ---")
    print(f"📋 {question}\n")

    speak(f"Question {i + 1}.")
    speak(question)
    speak("You have 20 seconds to answer. Go ahead.")

    answer = listen(duration=20)

    if not answer or len(answer.split()) < 3:
        speak("I could not hear a clear answer. Please speak louder and closer to your microphone.")
        speak("Try again. You have 20 seconds.")
        answer = listen(duration=20)

    if not answer or len(answer.split()) < 3:
        speak("Let us move to the next question.")
        continue

    speak("Thank you. Analyzing your answer now, please wait.")
    print("🧠 Getting AI feedback...\n")

    feedback = get_feedback(question, answer)
    print(feedback)

    # Read score out loud
    for line in feedback.split('\n'):
        if '/10' in line:
            clean_line = clean_text(line)
            speak(clean_line)
            break

    # Read one improvement tip out loud
    lines = feedback.split('\n')
    for j, line in enumerate(lines):
        if 'improve' in line.lower():
            for tip in lines[j+1:j+2]:
                if tip.strip():
                    speak("One thing to improve: " + clean_text(tip))
            break

    if i < len(questions[:3]) - 1:
        print("\nPress Enter when ready for the next question...")
        input()

speak("Session complete. You are making real progress. Review the written feedback on screen. Good luck with Tommy.")
print("\n✅ Session complete. Review your feedback above.")