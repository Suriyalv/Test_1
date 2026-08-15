import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
QUESTIONS_FILE = os.path.join(DATA_DIR, "questions.json")

def load_questions():
    if not os.path.exists(QUESTIONS_FILE):
        return []
    try:
        with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to read questions.json: {e}")
        return []

def save_questions(questions):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(QUESTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

app = Flask(__name__)

# CORS - allow requests from the React frontend
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS(app, origins=allowed_origins)

# Initialize OpenRouter Client (using OpenAI SDK)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip().strip('"').strip("'")

if not OPENROUTER_API_KEY:
    raise ValueError("[ERROR] OPENROUTER_API_KEY is not set. Please update your .env file with a valid OpenRouter API key.")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# Gemma & Llama models available on OpenRouter
MODEL_ID = "google/gemma-2-27b-it"
FALLBACK_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it",
    "mistralai/mistral-7b-instruct:free"
]


# ─── Helper: Build System Prompt ───────────────────────────────────────────────

def build_system_prompt(language: str, subject: str = None) -> str:
    """Build the system instruction based on selected language and optional subject context."""

    if language == "ta":
        lang_instruction = (
            "நீங்கள் ஒரு உதவிகரமான கல்வி உதவியாளர். "
            "தயவுசெய்து எல்லா பதில்களையும் தமிழில் மட்டுமே வழங்கவும். "
            "தெளிவான மற்றும் எளிதில் புரிந்துகொள்ளக்கூடிய தமிழில் விளக்கங்கள் தரவும்."
        )
    else:
        lang_instruction = (
            "You are a helpful educational assistant. "
            "Respond clearly and concisely in English. "
            "Use structured formatting (headings, bullet points) when helpful."
        )

    if subject:
        subject_instruction = (
            f"\n\nContext: The user is asking about the subject: '{subject}'. "
            "Use your knowledge to answer questions relevant to this subject."
        )
    else:
        subject_instruction = "\n\nContext: This is a general educational chat. Answer any educational queries."

    return lang_instruction + subject_instruction


# ─── Route: Health Check ────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running ✅"})


# ─── Route: Chat with AI ────────────────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    message = data.get("message", "").strip()
    history = data.get("history", [])
    subject = data.get("subject", "")
    language = data.get("language", "en")  # "en" for English, "ta" for Tamil

    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    try:
        system_prompt = build_system_prompt(language, subject)

        # Build message array for OpenRouter (OpenAI format)
        messages_payload = [
            {"role": "system", "content": system_prompt}
        ]

        for msg in history:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages_payload.append({
                "role": role,
                "content": msg.get("content", "")
            })

        messages_payload.append({
            "role": "user",
            "content": message
        })

        models_to_try = [MODEL_ID] + FALLBACK_MODELS
        last_error = None

        for model_name in models_to_try:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages_payload,
                    extra_headers={
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "College LLM Chatbot",
                    }
                )
                reply = response.choices[0].message.content
                print(f"[INFO] Response generated using model: {model_name}")

                return jsonify({
                    "response": reply,
                    "language": language,
                    "model_used": model_name,
                    "files": [],
                    "images": []
                })

            except Exception as model_error:
                err_str = str(model_error)
                print(f"[WARN] Model {model_name} error: {err_str}. Trying next...")
                last_error = model_error
                continue

        print(f"[ERROR] All models failed: {last_error}")
        return jsonify({
            "error": f"Failed to get response from OpenRouter Gemma models: {str(last_error)}"
        }), 500

    except Exception as e:
        print(f"[ERROR] Unexpected error in chat route: {e}")
        return jsonify({"error": f"AI service error: {str(e)}"}), 500


# In-memory store for feedback stats and history
feedback_data = {
    "likes": 0,
    "dislikes": 0,
    "feedback_history": []
}

# ─── Route: Feedback - Like ─────────────────────────────────────────────────────

@app.route("/api/feedback/like", methods=["POST"])
def feedback_like():
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    feedback_data["likes"] += 1
    if prompt:
        feedback_data["feedback_history"].append({"type": "good", "prompt": prompt})
    print(f"[INFO] Like received for prompt: {prompt[:80]}...")
    return jsonify({"status": "ok", "message": "Thank you for your feedback!"})


# ─── Route: Feedback - Dislike ──────────────────────────────────────────────────

@app.route("/api/feedback/dislike", methods=["POST"])
def feedback_dislike():
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    feedback_data["dislikes"] += 1
    if prompt:
        feedback_data["feedback_history"].append({"type": "bad", "prompt": prompt})
    print(f"[INFO] Dislike received for prompt: {prompt[:80]}...")
    return jsonify({"status": "ok", "message": "Thank you for your feedback!"})


# ─── Route: Feedback Stats ──────────────────────────────────────────────────────

@app.route("/api/feedback/stats", methods=["GET"])
def feedback_stats():
    return jsonify(feedback_data)


# ─── Route: Catch-all Fallbacks for Optional UI Requests ────────────────────────

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"status": "pong"})

@app.route("/api/auth/<path:subpath>", methods=["GET", "POST", "OPTIONS"])
def auth_fallback(subpath):
    return jsonify({"message": "Auth endpoint placeholder", "status": "ok"}), 200

@app.route("/api/regulations", methods=["GET"])
def regulations_fallback():
    return jsonify([])


# ─── Routes: Test Taking & Evaluation Module ───────────────────────────────────

@app.route("/api/test/questions", methods=["GET"])
def get_questions():
    questions = load_questions()
    category = request.args.get("category")
    language = request.args.get("language")
    
    if category and category != "All":
        questions = [q for q in questions if q.get("category") == category]
    if language and language != "all":
        questions = [q for q in questions if q.get("language") in [language, "both"]]
        
    return jsonify(questions)

@app.route("/api/test/questions", methods=["POST"])
def add_question():
    data = request.get_json() or {}
    category = data.get("category", "2 Marks")
    question_text = data.get("question", "").strip()
    sample_answer = data.get("sampleAnswer", "").strip()
    keywords = data.get("keywords", [])
    language = data.get("language", "en")
    options = data.get("options", [])
    correct_option = data.get("correctOption", "")
    marks = int(data.get("marks", 1 if category == "MCQ" else (2 if category == "2 Marks" else 5)))

    if not question_text:
        return jsonify({"error": "Question text is required"}), 400

    new_q = {
        "id": f"q_{int(time.time() * 1000)}",
        "category": category,
        "language": language,
        "question": question_text,
        "options": options if category == "MCQ" else [],
        "correctOption": correct_option if category == "MCQ" else "",
        "sampleAnswer": sample_answer,
        "keywords": [k.strip() for k in keywords if k.strip()],
        "marks": marks,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    questions = load_questions()
    questions.append(new_q)
    save_questions(questions)
    return jsonify({"status": "ok", "question": new_q}), 201

@app.route("/api/test/questions/<q_id>", methods=["PUT"])
def update_question(q_id):
    data = request.get_json() or {}
    questions = load_questions()
    for q in questions:
        if q.get("id") == q_id:
            q["category"] = data.get("category", q.get("category"))
            q["language"] = data.get("language", q.get("language"))
            q["question"] = data.get("question", q.get("question"))
            q["options"] = data.get("options", q.get("options"))
            q["correctOption"] = data.get("correctOption", q.get("correctOption"))
            q["sampleAnswer"] = data.get("sampleAnswer", q.get("sampleAnswer"))
            q["keywords"] = [k.strip() for k in data.get("keywords", q.get("keywords")) if k.strip()]
            q["marks"] = int(data.get("marks", q.get("marks")))
            save_questions(questions)
            return jsonify({"status": "ok", "question": q})
            
    return jsonify({"error": "Question not found"}), 404

@app.route("/api/test/questions/<q_id>", methods=["DELETE"])
def delete_question(q_id):
    questions = load_questions()
    updated = [q for q in questions if q.get("id") != q_id]
    if len(updated) == len(questions):
        return jsonify({"error": "Question not found"}), 404
    save_questions(updated)
    return jsonify({"status": "ok", "message": "Question deleted successfully"})

@app.route("/api/test/evaluate", methods=["POST"])
def evaluate_test_answer():
    data = request.get_json() or {}
    category = data.get("category", "2 Marks")
    question_text = data.get("question", "")
    sample_answer = data.get("sampleAnswer", "")
    target_keywords = data.get("keywords", [])
    user_answer = data.get("userAnswer", "").strip()
    language = data.get("language", "en")
    correct_option = data.get("correctOption", "")

    if not user_answer:
        return jsonify({
            "accuracy": 0,
            "matchedKeywords": [],
            "missedKeywords": target_keywords,
            "keyPointsCovered": [],
            "missedPoints": ["No answer provided."] if language == "en" else ["பதில் எதுவும் தரப்படவில்லை."],
            "overallFeedback": "Please enter or speak an answer before submitting." if language == "en" else "சமர்ப்பிப்பதற்கு முன் உங்கள் பதிலை பதிவு செய்யவும்."
        })

    # Keyword Matching Logic (case-insensitive substring presence)
    matched_keywords = []
    missed_keywords = []
    user_ans_lower = user_answer.lower()

    for kw in target_keywords:
        kw_clean = kw.strip().lower()
        if kw_clean in user_ans_lower:
            matched_keywords.append(kw)
        else:
            missed_keywords.append(kw)

    # MCQ Evaluation
    if category == "MCQ":
        is_correct = user_answer.strip().lower() == correct_option.strip().lower()
        accuracy = 100 if is_correct else 0
        if language == "ta":
            feedback = "அருமை! சரியான பதில் தேர்ந்தெடுக்கப்பட்டுள்ளது." if is_correct else f"தவறான பதில். சரியான பதில்: '{correct_option}'."
            points_covered = ["சரியான விடையைத் தேர்ந்தெடுத்துள்ளீர்கள்."] if is_correct else []
            missed_p = [] if is_correct else [f"சரியான தெரிவு: {correct_option}"]
        else:
            feedback = "Excellent! You selected the correct option." if is_correct else f"Incorrect selection. The correct option is '{correct_option}'."
            points_covered = ["Selected the correct option."] if is_correct else []
            missed_p = [] if is_correct else [f"Correct answer is {correct_option}"]

        return jsonify({
            "accuracy": accuracy,
            "matchedKeywords": target_keywords if is_correct else [],
            "missedKeywords": [] if is_correct else target_keywords,
            "keyPointsCovered": points_covered,
            "missedPoints": missed_p,
            "overallFeedback": feedback
        })

    # 2 Marks & 5 Marks LLM Evaluation
    prompt_lang_str = "Tamil (தமிழ்)" if language == "ta" else "English"
    eval_prompt = f"""You are an expert academic examiner evaluating a student's answer for a {category} question.

Question: "{question_text}"
Reference Sample Answer: "{sample_answer}"
Required Keywords: {json.dumps(target_keywords, ensure_ascii=False)}
Student's Answer: "{user_answer}"

Evaluate the accuracy of the student's answer based on correctness, keyword usage, and content alignment with the sample answer.

IMPORTANT: Return ONLY a valid JSON object without any markdown code fences (no ```json ... ```).
The JSON MUST have the following structure:
{{
  "accuracy": <integer between 0 and 100 representing percentage accuracy>,
  "keyPointsCovered": [<list of strings highlighting what the student got right in {prompt_lang_str}>],
  "missedPoints": [<list of strings detailing crucial concepts, keywords, or points missed in {prompt_lang_str}>],
  "overallFeedback": "<a supportive and instructive feedback paragraph in {prompt_lang_str}>"
}}
"""

    models_to_try = [MODEL_ID] + FALLBACK_MODELS
    eval_result = None

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": f"You are a strict academic evaluator. Output strictly JSON in {prompt_lang_str}."},
                    {"role": "user", "content": eval_prompt}
                ],
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "College LLM Test Evaluator",
                }
            )
            raw_content = response.choices[0].message.content.strip()
            # Clean possible markdown block syntax
            if raw_content.startswith("```"):
                lines = raw_content.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_content = "\n".join(lines).strip()

            eval_result = json.loads(raw_content)
            print(f"[INFO] Evaluated test answer with model: {model_name}")
            break
        except Exception as err:
            print(f"[WARN] Evaluator model {model_name} error: {err}. Trying next...")
            continue

    # Fallback if LLM parsing failed or call failed
    if not eval_result or not isinstance(eval_result, dict):
        kw_score = (len(matched_keywords) / len(target_keywords) * 100) if target_keywords else 80
        content_len_ratio = min(len(user_answer) / max(len(sample_answer), 1), 1.0)
        accuracy = int(round(kw_score * 0.6 + content_len_ratio * 40))

        if language == "ta":
            key_points = [f"பயன்படுத்தப்பட்ட முக்கிய சொற்கள்: {', '.join(matched_keywords)}"] if matched_keywords else ["அடிப்படை வாக்கிய அமைப்பு கொண்டுள்ளது."]
            missed_p = [f"விடுபட்ட முக்கிய கருத்துகள்: {', '.join(missed_keywords)}"] if missed_keywords else ["மாதிரி பதிலில் உள்ள மேலும் சில விவரங்களை சேர்க்கலாம்."]
            fb = f"உங்கள் பதில் {accuracy}% துல்லியமாக உள்ளது. மேலும் விவரங்களை சேர்க்கவும்."
        else:
            key_points = [f"Matched key terms: {', '.join(matched_keywords)}"] if matched_keywords else ["Submitted answer addresses the prompt."]
            missed_p = [f"Missing required keywords/points: {', '.join(missed_keywords)}"] if missed_keywords else ["Could elaborate further based on the sample answer."]
            fb = f"Your answer is evaluated at {accuracy}% accuracy. Consider reviewing the missed keywords and points for full marks."

        eval_result = {
            "accuracy": min(max(accuracy, 10), 100),
            "keyPointsCovered": key_points,
            "missedPoints": missed_p,
            "overallFeedback": fb
        }

    # Ensure output structure is consistent
    return jsonify({
        "accuracy": int(eval_result.get("accuracy", 50)),
        "matchedKeywords": matched_keywords,
        "missedKeywords": missed_keywords,
        "keyPointsCovered": eval_result.get("keyPointsCovered", []),
        "missedPoints": eval_result.get("missedPoints", []),
        "overallFeedback": eval_result.get("overallFeedback", "")
    })



# ─── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    print(f"[INFO] Backend server starting on http://localhost:{port}")
    print(f"[INFO] OpenRouter Gemma AI initialized with primary model: {MODEL_ID}")
    app.run(host="0.0.0.0", port=port, debug=debug)
