import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI
from knowledge_base import knowledge_base

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

def build_system_prompt(language: str, subject: str = None, rag_context: str = "") -> str:
    """Build the system instruction based on selected language, optional subject context, and textbook RAG context."""

    if language == "ta":
        lang_instruction = (
            "நீங்கள் மேல்நிலை இரண்டாம் ஆண்டு (Class XII) கணினி அறிவியல் (Computer Science) பாடத்திட்டத்திற்கான "
            "பிரத்யேக AI கல்வி வழிகாட்டி. வழங்கப்பட்டுள்ள பாடத்திட்ட தரவுகள் (Textbook Curriculum Data) "
            "அடிப்படையில் துல்லியமான பதில்களை வழங்கவும். "
            "தெளிவான, எளிதில் புரியக்கூடிய தமிழில் விளக்கங்கள் தரவும். "
            "முக்கிய கலைச்சொற்களை (Keywords) தமிழில் மற்றும் அடைப்புக்குறிக்குள் ஆங்கிலத்திலும் குறிப்பிடவும்."
        )
    else:
        lang_instruction = (
            "You are a dedicated AI educational tutor specialized in the Class XII Computer Science textbook curriculum. "
            "You must communicate using the official syllabus topics and textbook knowledge base provided. "
            "Respond clearly, accurately, and with structured formatting (headings, bullet points, syntax, code examples)."
        )

    if subject:
        subject_instruction = (
            f"\n\nActive Subject Topic: '{subject}'. "
            "Base your answers on this curriculum domain."
        )
    else:
        subject_instruction = "\n\nDomain: Class XII Computer Science (Chapters 1-16: Functions, Abstraction, Scoping, Algorithms, Python Programming, Control Structures, Strings, Collections, Classes, DBMS, SQL, Data Manipulation)."

    if rag_context:
        grounding_instruction = (
            "\n\nCRITICAL PEDAGOGICAL GROUNDING RULE: "
            "Use the official textbook reference provided below as the primary ground truth. "
            "Adopt the exact definitions, keywords, syntax rules, and conceptual explanations from this material:\n"
            f"{rag_context}"
        )
    else:
        grounding_instruction = ""

    return lang_instruction + subject_instruction + grounding_instruction


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
        # Retrieve relevant curriculum textbook chunks
        search_query = f"{subject} {message}" if subject else message
        retrieved_chunks = knowledge_base.search(search_query, top_k=3, min_score=0.8)
        rag_context = knowledge_base.format_rag_context(retrieved_chunks)
        
        system_prompt = build_system_prompt(language, subject, rag_context)

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

        # Clean reference citations for UI
        references = [
            {
                "chunk_id": c.get("chunk_id"),
                "chapter_no": c.get("chapter_no"),
                "topic": c.get("topic"),
                "subtopic": c.get("subtopic"),
                "concept_type": c.get("concept_type")
            }
            for c in retrieved_chunks
        ]

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
                print(f"[INFO] Response generated using model: {model_name} (RAG Chunks: {len(retrieved_chunks)})")

                return jsonify({
                    "response": reply,
                    "language": language,
                    "model_used": model_name,
                    "references": references,
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


# ─── Route: Mascot Hint Assistant (Kalvi Mithran) ─────────────────────────────

@app.route("/api/hint", methods=["POST"])
def mascot_hint():
    """
    Socratic Hint AI: Provides hints, clues, concepts, and portal guidance
    WITHOUT ever revealing direct test answers.
    """
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    context_question = data.get("context_question", "").strip()
    history = data.get("history", [])
    language = data.get("language", "en")

    if not message and not context_question:
        return jsonify({"error": "No question or query provided"}), 400

    if language == "ta":
        system_instruction = (
            "நீங்கள் 'கல்வி மித்ரன்' (Kalvi Mithran) - பள்ளி மாணவர்களுக்கான அன்பான, உற்சாகமூட்டும் கார்ட்டூன் கற்றல் நண்பன்!\n"
            "மிக முக்கியமான விதி (STRICT PEDAGOGICAL RULE):\n"
            "1. மாணவர்களின் தேர்வு வினாக்களுக்கோ அல்லது பயிற்சிகளுக்கோ நேரடி இறுதி விடையை (DIRECT FINAL ANSWER) ஒருபோதும் கூறக்கூடாது.\n"
            "2. அதற்குப் பதிலாக: குறிப்புகள் (hints), சிந்திக்கத் தூண்டும் கேள்விகள் (guiding questions), தொடர்புடைய சூத்திரங்கள் (formulas), முக்கிய கருத்துக்கள் (concept clues) மட்டுமே வழங்க வேண்டும்.\n"
            "3. மாணவரை சுயமாக விடையைக் கண்டுபிடிக்க ஊக்கப்படுத்தவும்.\n"
            "4. இந்த இணையதளம்/போர்ட்டல் பற்றி கேட்டால் அன்புடன் வழிகாட்டவும்.\n"
            "5. மகிழ்ச்சியான, எளிய, எமோஜிகளுடன் கூடிய தமிழில் பேசவும்."
        )
    else:
        system_instruction = (
            "You are 'Kalvi Mithran' (EduBuddy), a cheerful, cute cartoon mascot tutor and friendly study buddy for students!\n"
            "CRITICAL PEDAGOGICAL RULE:\n"
            "1. NEVER GIVE DIRECT FINAL ANSWERS to test questions, quizzes, or exam problems.\n"
            "2. Instead, provide smart hints, concept clues, formulas, step-by-step thinking strategies, and guiding Socratic questions to help the student solve it themselves.\n"
            "3. If the user asks about using this portal/project (tests, voice input, language toggle), explain warmly and clearly.\n"
            "4. Use a cheerful, positive tone with helpful emojis.\n"
            "5. Keep hints compact, encouraging, and easy to understand."
        )

    if context_question:
        system_instruction += f"\n\nCURRENT QUESTION STUDENT IS WORKING ON:\n\"{context_question}\"\nGive a helpful hint or concept explanation for this question WITHOUT giving the answer."

    # RAG: Ground hint in curriculum concept definitions
    hint_query = context_question if context_question else message
    retrieved_hint_chunks = knowledge_base.search(hint_query, top_k=2, min_score=0.8)
    if retrieved_hint_chunks:
        rag_hint = knowledge_base.format_rag_context(retrieved_hint_chunks, max_chars=1200)
        system_instruction += f"\n\nCURRICULUM CONCEPT REFERENCE (Use this concept to give clues without giving the direct answer):\n{rag_hint}"

    messages_payload = [{"role": "system", "content": system_instruction}]

    for msg in history[-6:]:  # Keep recent history concise
        role = "user" if msg.get("role") == "user" else "assistant"
        messages_payload.append({"role": role, "content": msg.get("content", "")})

    prompt_msg = message if message else f"Please give me a friendly hint for this question: {context_question}"
    messages_payload.append({"role": "user", "content": prompt_msg})

    models_to_try = [MODEL_ID] + FALLBACK_MODELS
    last_error = None

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages_payload,
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Kalvi Mithran Mascot Hint",
                }
            )
            reply = response.choices[0].message.content
            return jsonify({
                "response": reply,
                "language": language,
                "model_used": model_name
            })
        except Exception as model_error:
            last_error = model_error
            continue

    return jsonify({"error": f"Mascot service temporarily busy: {str(last_error)}"}), 500


# ─── Route: Mascot Question Generator ─────────────────────────────────────────

@app.route("/api/mascot/question", methods=["POST"])
def mascot_generate_question():
    """
    Generates a fresh, curriculum-aligned brain teaser / quiz question for the mascot.
    Returns: { question, topic, difficulty }
    """
    data = request.get_json() or {}
    language = data.get("language", "en")
    used_questions = data.get("used_questions", [])  # avoid repeating same questions

    used_str = ""
    if used_questions:
        used_str = "\n\nAVOID these questions (already asked):\n- " + "\n- ".join(used_questions[-10:])

    # Select a real curriculum topic/concept to ground the question
    concept_sample = knowledge_base.get_random_concept()
    topic_hint = ""
    if concept_sample:
        topic_hint = f"\n\nBase your question on this syllabus topic:\nChapter {concept_sample.get('chapter_no')}: {concept_sample.get('topic')} - {concept_sample.get('subtopic')}\nConcept summary: {concept_sample.get('content')[:300]}"

    if language == "ta":
        system_instruction = (
            "நீங்கள் 'கல்வி மித்ரன்' — பள்ளி மாணவர்களுக்கான அன்பான கல்வி உதவியாளர்.\n"
            "ஒரு சுவாரஸ்யமான, குறுகிய அறிவியல்/கணினி/கணிதம்/பொது அறிவு "
            "சம்பந்தமான கேள்வியை தமிழில் உருவாக்கவும்.\n"
            "கேள்வி: 1-2 வரிகளில் மட்டும் இருக்க வேண்டும். சுவாரஸ்யமாக இருக்க வேண்டும்.\n"
            "பதில்: தெளிவான, குறுகிய விடை மட்டும்.\n"
            "கண்டிப்பாக இந்த JSON மட்டும் திருப்பவும் (வேறு எதுவும் வேண்டாம்):\n"
            "{\"question\": \"...\", \"answer\": \"...\", \"topic\": \"...\"}"
            + used_str
            + topic_hint
        )
    else:
        system_instruction = (
            "You are 'Kalvi Mithran' — an educational mascot and study assistant for school students.\n"
            "Generate ONE interesting, short computer science / science / general knowledge quiz question "
            "appropriate for school students (Class 6-12 level).\n"
            "Question: max 1-2 lines, engaging and clear.\n"
            "Answer: short and factual.\n"
            "Respond ONLY with this JSON (no extra text):\n"
            "{\"question\": \"...\", \"answer\": \"...\", \"topic\": \"...\"}"
            + used_str
            + topic_hint
        )

    messages_payload = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": "Generate a fresh quiz question now."}
    ]

    models_to_try = [MODEL_ID] + FALLBACK_MODELS
    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages_payload,
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Kalvi Mithran Question Generator",
                }
            )
            raw = response.choices[0].message.content.strip()
            # Try to parse JSON from the response
            import re
            json_match = re.search(r'\{.*?\}', raw, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                return jsonify({
                    "question": parsed.get("question", raw),
                    "answer": parsed.get("answer", ""),
                    "topic": parsed.get("topic", "General"),
                    "language": language,
                    "model_used": model_name
                })
            else:
                return jsonify({"question": raw, "answer": "", "topic": "General", "language": language})
        except Exception as model_error:
            print(f"[WARN] mascot/question model {model_name} error: {model_error}")
            continue

    return jsonify({"error": "Could not generate question"}), 500


# ─── Route: Mascot Answer Checker ──────────────────────────────────────────────

@app.route("/api/mascot/check", methods=["POST"])
def mascot_check_answer():
    """
    Checks student's answer against the quiz question.
    Returns one of:
      - { status: "correct", message: "..." }
      - { status: "hint", message: "..." }      (wrong, give a Socratic hint)
      - { status: "reveal", message: "..." }    (after multiple attempts, reveal answer)
    """
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    correct_answer = data.get("correct_answer", "").strip()
    student_answer = data.get("student_answer", "").strip()
    attempt = data.get("attempt", 1)   # 1 = first try, 2 = second try, 3+ = reveal
    language = data.get("language", "en")

    if not question or not student_answer:
        return jsonify({"error": "Question and student answer are required"}), 400

    if language == "ta":
        system_instruction = (
            "நீங்கள் 'கல்வி மித்ரன்' — மாணவர்களின் விடைகளை மதிப்பிடும் அன்பான ஆசிரியர்.\n"
            "மாணவர் அளித்த விடை சரியானதா எனப் பரிசீலனை செய்யவும்.\n"
            "முடிவை இந்த JSON வடிவில் மட்டும் தரவும் (வேறு எதுவும் வேண்டாம்):\n"
            "{\"status\": \"correct\" அல்லது \"wrong\", \"feedback\": \"...\"}"
        )
        user_msg = (
            f"கேள்வி: {question}\n"
            f"சரியான விடை: {correct_answer}\n"
            f"மாணவர் விடை: {student_answer}\n"
            f"முயற்சி எண்: {attempt}\n"
            "மாணவரின் விடை சரியானதா? JSON மட்டும் பதில் அளிக்கவும்."
        )
    else:
        system_instruction = (
            "You are 'Kalvi Mithran' — a kind evaluator checking student quiz answers.\n"
            "Check if the student's answer is correct (exact match not required — accept reasonable paraphrases).\n"
            "Respond ONLY with this JSON (no extra text):\n"
            "{\"status\": \"correct\" or \"wrong\", \"feedback\": \"...\"}"
        )
        user_msg = (
            f"Question: {question}\n"
            f"Correct Answer: {correct_answer}\n"
            f"Student's Answer: {student_answer}\n"
            f"Attempt number: {attempt}\n"
            "Is the student correct? Respond in JSON only."
        )

    messages_payload = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": user_msg}
    ]

    models_to_try = [MODEL_ID] + FALLBACK_MODELS
    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages_payload,
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Kalvi Mithran Answer Check",
                }
            )
            raw = response.choices[0].message.content.strip()
            import re
            json_match = re.search(r'\{.*?\}', raw, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                is_correct = parsed.get("status", "wrong").lower() == "correct"
            else:
                # Fallback: check if common "correct" phrases appear
                is_correct = any(w in raw.lower() for w in ["correct", "right", "சரி", "சரியான"])

            if is_correct:
                if language == "ta":
                    msg = f"🎉 அருமை! நீங்கள் சரியாக சொன்னீர்கள்! சரியான விடை: {correct_answer}"
                else:
                    msg = f"🎉 Excellent! That's correct! Answer: {correct_answer}"
                return jsonify({"status": "correct", "message": msg})
            else:
                # Wrong — give a hint or reveal based on attempt
                if attempt >= 3:
                    if language == "ta":
                        msg = f"🔑 இந்த வினாவின் விடை: {correct_answer}. கவலைப்படாதீர்கள் — தொடர்ந்து முயற்சி செய்யுங்கள்! 💪"
                    else:
                        msg = f"🔑 The answer is: {correct_answer}. Don't worry — keep practising! 💪"
                    return jsonify({"status": "reveal", "message": msg})
                else:
                    # Ask AI for a Socratic hint
                    hint_system = (
                        "Give a short, helpful hint (1-2 sentences) for this question WITHOUT revealing the answer. "
                        "Be encouraging and simple. Respond in " + ("Tamil" if language == "ta" else "English") + "."
                    )
                    hint_payload = [
                        {"role": "system", "content": hint_system},
                        {"role": "user", "content": f"Question: {question}. Student said: '{student_answer}'. Give a gentle hint."}
                    ]
                    hint_resp = client.chat.completions.create(
                        model=model_name,
                        messages=hint_payload,
                        extra_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "Kalvi Mithran Hint"}
                    )
                    hint_text = hint_resp.choices[0].message.content.strip()
                    prefix = "💡 " + ("கொஞ்சம் யோசியுங்கள்: " if language == "ta" else "Think again: ")
                    return jsonify({"status": "hint", "message": prefix + hint_text})

        except Exception as model_error:
            print(f"[WARN] mascot/check model {model_name} error: {model_error}")
            continue

    return jsonify({"error": "Could not check answer"}), 500


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
    
    # RAG: Retrieve textbook definition for accurate academic benchmarking
    eval_query = f"{question_text} {sample_answer}"
    eval_chunks = knowledge_base.search(eval_query, top_k=2, min_score=0.8)
    tb_ref = knowledge_base.format_rag_context(eval_chunks, max_chars=1000) if eval_chunks else ""

    eval_prompt = f"""You are an expert academic examiner evaluating a student's answer for a {category} question.

Question: "{question_text}"
Reference Sample Answer: "{sample_answer}"
Required Keywords: {json.dumps(target_keywords, ensure_ascii=False)}
Student's Answer: "{user_answer}"
{tb_ref}

Evaluate the accuracy of the student's answer based on correctness, keyword usage, and content alignment with the sample answer and textbook syllabus.

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



# ─── Video Lesson Module (watch → pause → MCQ → resume → final review) ─────────

VIDEO_LESSONS_FILE = os.path.join(DATA_DIR, "video_lessons.json")

# Server-side store for generated MCQs. The correct option index and explanation
# never travel to the browser with the question — the client posts back the chosen
# index and the server decides. Keeps students from reading answers off devtools.
VIDEO_QUESTION_STORE = {}


def load_video_lessons():
    if not os.path.exists(VIDEO_LESSONS_FILE):
        return []
    try:
        with open(VIDEO_LESSONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f).get("lessons", [])
    except Exception as e:
        print(f"[ERROR] Failed to read video_lessons.json: {e}")
        return []


def get_lesson(lesson_id):
    for lesson in load_video_lessons():
        if lesson.get("id") == lesson_id:
            return lesson
    return None


def get_concept(lesson, concept_id):
    for concept in lesson.get("concepts", []):
        if concept.get("id") == concept_id:
            return concept
    return None


def localized(value, language):
    """Data file stores {'en': ..., 'ta': ...} for user-facing strings."""
    if isinstance(value, dict):
        return value.get(language) or value.get("en") or ""
    return value


def store_video_question(lesson_id, concept_id, question, options, answer_index, explanation, source, stage):
    qid = f"{lesson_id}:{concept_id}:{stage}:{int(time.time() * 1000)}:{len(VIDEO_QUESTION_STORE)}"
    VIDEO_QUESTION_STORE[qid] = {
        "lesson_id": lesson_id,
        "concept_id": concept_id,
        "question": question,
        "options": options,
        "answer": answer_index,
        "explanation": explanation,
        "source": source,
        "stage": stage,
    }
    # Keep the store from growing without bound across a long-running server.
    if len(VIDEO_QUESTION_STORE) > 500:
        for old_key in list(VIDEO_QUESTION_STORE.keys())[:100]:
            VIDEO_QUESTION_STORE.pop(old_key, None)
    return qid


def build_video_mcq_prompt(lesson, concept, language, stage, avoid_questions):
    """Prompt the LLM to write one MCQ strictly from this concept's transcript."""
    lang_name = "Tamil" if language == "ta" else "English"
    key_points = "\n".join(f"- {p}" for p in concept.get("key_points", {}).get(language, [])
                           or concept.get("key_points", {}).get("en", []))

    avoid_block = ""
    if avoid_questions:
        avoid_block = (
            "\n\nDo NOT repeat or lightly reword any of these questions that were already asked:\n"
            + "\n".join(f"- {q}" for q in avoid_questions[-12:])
        )

    if stage == "final":
        stage_note = (
            "This is the FINAL REVIEW at the end of the video, so the question may combine or "
            "apply the idea rather than just restate it. Keep it answerable purely from the transcript below."
        )
    else:
        stage_note = (
            "The video has just been paused right after this concept was explained, so the question "
            "must check whether the student understood exactly what was just said."
        )

    return f"""You are setting a comprehension check for a school student who is watching a physics video lesson.

LESSON: {localized(lesson.get('title'), 'en')}
CONCEPT JUST EXPLAINED: {localized(concept.get('title'), 'en')}

{stage_note}

TRANSCRIPT OF THIS SECTION OF THE VIDEO (this is your ONLY source of truth):
\"\"\"
{concept.get('transcript', '')}
\"\"\"

KEY POINTS THE STUDENT SHOULD HAVE PICKED UP:
{key_points}

Write exactly ONE multiple-choice question:
- It must be answerable from the transcript above and nothing else. Do not use outside facts.
- Exactly 4 options. Exactly one is correct.
- The three wrong options must be plausible misconceptions a student could actually hold, not silly filler.
- Question and options must be written in {lang_name}.
- Keep technical symbols (E, dS, Q, epsilon-naught, 4 pi R squared) recognisable.
- The explanation should say why the right answer is right in one or two sentences, in {lang_name}.{avoid_block}

Respond with ONLY this JSON object and nothing else:
{{"question": "...", "options": ["...", "...", "...", "..."], "answer": <0-based index of the correct option>, "explanation": "..."}}"""


def generate_video_mcq(lesson, concept, language, stage, avoid_questions):
    """Ask the LLM for one MCQ. Returns a validated dict, or None so the caller can fall back."""
    prompt = build_video_mcq_prompt(lesson, concept, language, stage, avoid_questions)
    lang_name = "Tamil" if language == "ta" else "English"

    for model_name in [MODEL_ID] + FALLBACK_MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": f"You write precise, curriculum-grounded MCQs. Output strictly one JSON object in {lang_name}."},
                    {"role": "user", "content": prompt},
                ],
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Video Lesson Comprehension",
                },
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                lines = [ln for ln in raw.splitlines() if not ln.strip().startswith("```")]
                raw = "\n".join(lines).strip()

            import re
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if not match:
                raise ValueError("no JSON object in model output")
            parsed = json.loads(match.group())

            options = parsed.get("options") or []
            answer = parsed.get("answer")
            if isinstance(answer, str) and answer.strip().isdigit():
                answer = int(answer.strip())
            if not parsed.get("question") or len(options) != 4 or not isinstance(answer, int) or not 0 <= answer <= 3:
                raise ValueError(f"malformed MCQ from model: {parsed}")

            print(f"[INFO] Generated video MCQ ({concept.get('id')}/{stage}) with model: {model_name}")
            return {
                "question": str(parsed["question"]).strip(),
                "options": [str(o).strip() for o in options],
                "answer": answer,
                "explanation": str(parsed.get("explanation", "")).strip(),
                "source": "llm",
            }
        except Exception as model_error:
            print(f"[WARN] video MCQ model {model_name} error: {model_error}. Trying next...")
            continue

    return None


def pick_fallback_mcq(concept, language, stage, avoid_questions):
    """Pre-written question bank, used when the LLM is unreachable or returns junk."""
    bank = concept.get("fallback_questions", {})
    pool = bank.get(language) or bank.get("en") or []
    if not pool:
        return None

    avoid = set(avoid_questions or [])
    unused = [q for q in pool if q.get("question") not in avoid]
    candidates = unused or pool
    # Checkpoint takes the first question, the final review takes the next one,
    # so a student normally never sees the same fallback twice in one session.
    chosen = candidates[-1] if (stage == "final" and len(candidates) > 1) else candidates[0]

    return {
        "question": chosen["question"],
        "options": list(chosen["options"]),
        "answer": chosen["answer"],
        "explanation": chosen.get("explanation", ""),
        "source": "fallback",
    }


def build_video_question(lesson, concept, language, stage, avoid_questions):
    mcq = generate_video_mcq(lesson, concept, language, stage, avoid_questions)
    if not mcq:
        mcq = pick_fallback_mcq(concept, language, stage, avoid_questions)
    if not mcq:
        return None

    qid = store_video_question(
        lesson["id"], concept["id"], mcq["question"], mcq["options"],
        mcq["answer"], mcq["explanation"], mcq["source"], stage,
    )
    return {
        "questionId": qid,
        "question": mcq["question"],
        "options": mcq["options"],
        "source": mcq["source"],
        "conceptId": concept["id"],
        "conceptTitle": localized(concept.get("title"), language),
        "conceptIndex": concept.get("index", 0),
        "pauseAt": concept.get("pause_at"),
    }


@app.route("/api/video/lessons", methods=["GET"])
def video_lessons():
    """Lesson catalogue for the video comprehension module (no answers included)."""
    language = request.args.get("language", "en")
    lessons = []
    for lesson in load_video_lessons():
        lessons.append({
            "id": lesson.get("id"),
            "youtubeId": lesson.get("youtube_id"),
            "sourceUrl": lesson.get("source_url"),
            "title": localized(lesson.get("title"), language),
            "subject": localized(lesson.get("subject"), language),
            "description": localized(lesson.get("description"), language),
            "duration": lesson.get("duration"),
            "contentEnd": lesson.get("content_end", lesson.get("duration")),
            "concepts": [{
                "id": c.get("id"),
                "index": c.get("index"),
                "title": localized(c.get("title"), language),
                "start": c.get("start"),
                "end": c.get("end"),
                "pauseAt": c.get("pause_at"),
                "keyPoints": localized(c.get("key_points"), language),
            } for c in lesson.get("concepts", [])],
        })
    return jsonify({"lessons": lessons})


@app.route("/api/video/question", methods=["POST"])
def video_checkpoint_question():
    """One MCQ for the concept that just finished playing."""
    data = request.get_json() or {}
    lesson_id = data.get("lessonId")
    concept_id = data.get("conceptId")
    language = data.get("language", "en")
    avoid = data.get("askedQuestions", [])

    lesson = get_lesson(lesson_id)
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404

    concept = get_concept(lesson, concept_id)
    if not concept:
        return jsonify({"error": "Concept not found"}), 404

    question = build_video_question(lesson, concept, language, "checkpoint", avoid)
    if not question:
        return jsonify({"error": "Could not prepare a question for this concept"}), 500

    return jsonify(question)


@app.route("/api/video/final-quiz", methods=["POST"])
def video_final_quiz():
    """One MCQ per concept, asked after the whole video has played."""
    data = request.get_json() or {}
    lesson_id = data.get("lessonId")
    language = data.get("language", "en")
    avoid = data.get("askedQuestions", [])

    lesson = get_lesson(lesson_id)
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404

    asked = list(avoid)
    questions = []
    for concept in lesson.get("concepts", []):
        question = build_video_question(lesson, concept, language, "final", asked)
        if question:
            asked.append(question["question"])
            questions.append(question)

    if not questions:
        return jsonify({"error": "Could not prepare the final review"}), 500

    return jsonify({"questions": questions, "total": len(questions)})


@app.route("/api/video/answer", methods=["POST"])
def video_check_answer():
    """Grade one MCQ answer and hand back the explanation."""
    data = request.get_json() or {}
    qid = data.get("questionId")
    language = data.get("language", "en")
    selected = data.get("selectedIndex")

    record = VIDEO_QUESTION_STORE.get(qid)
    if not record:
        return jsonify({"error": "This question has expired. Please replay this section."}), 404

    if not isinstance(selected, int) or not 0 <= selected < len(record["options"]):
        return jsonify({"error": "Please select an option"}), 400

    is_correct = selected == record["answer"]
    explanation = record.get("explanation", "")

    if not explanation:
        explanation = (
            f"சரியான விடை: {record['options'][record['answer']]}"
            if language == "ta"
            else f"The correct answer is: {record['options'][record['answer']]}"
        )

    return jsonify({
        "correct": is_correct,
        "correctIndex": record["answer"],
        "explanation": explanation,
        "conceptId": record["concept_id"],
    })


# ─── Routes: Flashcard Module (Flip Cards) ─────────────────────────────────────

FLASHCARDS_FILE = os.path.join(DATA_DIR, "flashcards.json")

# Accent names the frontend knows how to paint. Anything else falls back to blue.
FLASHCARD_ACCENTS = ["blue", "violet", "emerald", "amber", "rose", "cyan", "indigo", "teal"]


def load_flashcards():
    if not os.path.exists(FLASHCARDS_FILE):
        return []
    try:
        with open(FLASHCARDS_FILE, "r", encoding="utf-8") as f:
            return json.load(f).get("cards", [])
    except Exception as e:
        print(f"[ERROR] Failed to read flashcards.json: {e}")
        return []


def save_flashcards(cards):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(FLASHCARDS_FILE, "w", encoding="utf-8") as f:
        json.dump({"cards": cards}, f, ensure_ascii=False, indent=2)


def bilingual(primary: str, secondary: str) -> dict:
    """Store user-facing card text as {'en': ..., 'ta': ...} so localized() can read it.

    The admin form only requires English; when the Tamil field is left blank the
    English text is reused so a card never renders empty in Tamil mode.
    """
    primary = (primary or "").strip()
    secondary = (secondary or "").strip()
    return {"en": primary, "ta": secondary or primary}


def as_points(value) -> list:
    """Normalise a description into a clean list of bullet points.

    Accepts a list (the stored form) or a newline-separated string (what the admin
    form posts, one point per line). Any leading bullet character a teacher typed
    is trimmed, and blank lines are dropped.
    """
    if isinstance(value, list):
        items = value
    elif isinstance(value, str):
        items = value.splitlines()
    else:
        items = []

    points = []
    for item in items:
        text = str(item).strip().lstrip("-•*–—").strip()
        if text:
            points.append(text)
    return points


def bilingual_points(primary, secondary) -> dict:
    """Same as bilingual(), but each language holds a list of bullet points."""
    primary_points = as_points(primary)
    secondary_points = as_points(secondary)
    return {"en": primary_points, "ta": secondary_points or primary_points}


def present_flashcard(card, language):
    """Shape one stored card for the browser, resolved to the requested language."""
    return {
        "id": card.get("id"),
        "deck": card.get("deck", "General"),
        "accent": card.get("accent", "blue"),
        "image": card.get("image", ""),
        "title": localized(card.get("title"), language),
        "description": as_points(localized(card.get("description"), language)),
        "createdAt": card.get("createdAt"),
    }


@app.route("/api/flashcards", methods=["GET"])
def get_flashcards():
    """Card catalogue for the student flip-card view."""
    language = request.args.get("language", "en")
    deck = request.args.get("deck")

    cards = load_flashcards()
    if deck and deck != "All":
        cards = [c for c in cards if c.get("deck") == deck]

    return jsonify({
        "cards": [present_flashcard(c, language) for c in cards],
        "decks": sorted({c.get("deck", "General") for c in load_flashcards()}),
    })


@app.route("/api/flashcards", methods=["POST"])
def add_flashcard():
    data = request.get_json() or {}

    title_en = (data.get("title") or "").strip()
    description_points = as_points(data.get("description"))

    if not title_en:
        return jsonify({"error": "Card title is required"}), 400
    if not description_points:
        return jsonify({"error": "At least one description point is required"}), 400

    accent = data.get("accent", "blue")
    if accent not in FLASHCARD_ACCENTS:
        accent = "blue"

    new_card = {
        "id": f"fc_{int(time.time() * 1000)}",
        "deck": (data.get("deck") or "General").strip() or "General",
        "accent": accent,
        "image": (data.get("image") or "").strip(),
        "title": bilingual(title_en, data.get("titleTa")),
        "description": bilingual_points(description_points, data.get("descriptionTa")),
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    cards = load_flashcards()
    cards.append(new_card)
    save_flashcards(cards)
    return jsonify({"status": "ok", "card": present_flashcard(new_card, "en")}), 201


@app.route("/api/flashcards/<card_id>", methods=["PUT"])
def update_flashcard(card_id):
    data = request.get_json() or {}
    cards = load_flashcards()

    for card in cards:
        if card.get("id") != card_id:
            continue

        if "title" in data:
            card["title"] = bilingual(data.get("title"), data.get("titleTa"))
        if "description" in data:
            card["description"] = bilingual_points(data.get("description"), data.get("descriptionTa"))
        if "deck" in data:
            card["deck"] = (data.get("deck") or "General").strip() or "General"
        if "image" in data:
            card["image"] = (data.get("image") or "").strip()
        if data.get("accent") in FLASHCARD_ACCENTS:
            card["accent"] = data["accent"]

        save_flashcards(cards)
        return jsonify({"status": "ok", "card": present_flashcard(card, "en")})

    return jsonify({"error": "Flashcard not found"}), 404


@app.route("/api/flashcards/<card_id>", methods=["DELETE"])
def delete_flashcard(card_id):
    cards = load_flashcards()
    remaining = [c for c in cards if c.get("id") != card_id]
    if len(remaining) == len(cards):
        return jsonify({"error": "Flashcard not found"}), 404
    save_flashcards(remaining)
    return jsonify({"status": "ok", "message": "Flashcard deleted successfully"})


# ─── Routes: Mind Map Module (Concept Trees) ───────────────────────────────────

MINDMAPS_FILE = os.path.join(DATA_DIR, "mindmaps.json")

# The branch colours are the same palette the flashcards paint with, so a topic
# keeps one identity across both modules.
MINDMAP_ACCENTS = FLASHCARD_ACCENTS


def load_mindmaps():
    if not os.path.exists(MINDMAPS_FILE):
        return []
    try:
        with open(MINDMAPS_FILE, "r", encoding="utf-8") as f:
            return json.load(f).get("maps", [])
    except Exception as e:
        print(f"[ERROR] Failed to read mindmaps.json: {e}")
        return []


def save_mindmaps(maps):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(MINDMAPS_FILE, "w", encoding="utf-8") as f:
        json.dump({"maps": maps}, f, ensure_ascii=False, indent=2)


def find_mindmap(map_id):
    for mind_map in load_mindmaps():
        if mind_map.get("id") == map_id:
            return mind_map
    return None


def walk_nodes(node, parent=None, depth=0):
    """Yield (node, parent, depth) for the node and everything beneath it."""
    yield node, parent, depth
    for child in node.get("children", []):
        yield from walk_nodes(child, node, depth + 1)


def find_node(root, node_id):
    """Return (node, parent) for node_id, or (None, None) when it is not in the tree."""
    for node, parent, _ in walk_nodes(root):
        if node.get("id") == node_id:
            return node, parent
    return None, None


def count_nodes(root):
    return sum(1 for _ in walk_nodes(root))


def present_node(node, language, accent="blue", depth=0):
    """Shape one stored node (and its subtree) for the browser.

    Children inherit their branch's accent, so a teacher only picks a colour on
    the top-level branch and the whole limb stays that colour.
    """
    resolved_accent = node.get("accent") if node.get("accent") in MINDMAP_ACCENTS else accent
    return {
        "id": node.get("id"),
        "label": localized(node.get("label"), language),
        "summary": localized(node.get("summary"), language) or "",
        "formula": node.get("formula", ""),
        "points": as_points(localized(node.get("points"), language)),
        "icon": node.get("icon", ""),
        "accent": resolved_accent,
        "side": node.get("side", ""),
        "depth": depth,
        "children": [
            present_node(child, language, resolved_accent, depth + 1)
            for child in node.get("children", [])
        ],
    }


def present_mindmap(mind_map, language):
    root = mind_map.get("root", {})
    return {
        "id": mind_map.get("id"),
        "subject": mind_map.get("subject", "General"),
        "icon": mind_map.get("icon", "🧠"),
        "title": localized(mind_map.get("title"), language),
        "blurb": localized(mind_map.get("blurb"), language) or "",
        "nodeCount": count_nodes(root),
        "branchCount": len(root.get("children", [])),
        "createdAt": mind_map.get("createdAt"),
        "root": present_node(root, language),
    }


def node_from_payload(data, node_id):
    """Build a stored node out of what the admin form posted."""
    accent = data.get("accent")
    node = {
        "id": node_id,
        "label": bilingual(data.get("label"), data.get("labelTa")),
        "icon": (data.get("icon") or "").strip(),
        "children": [],
    }
    summary = (data.get("summary") or "").strip()
    if summary:
        node["summary"] = bilingual(summary, data.get("summaryTa"))
    formula = (data.get("formula") or "").strip()
    if formula:
        node["formula"] = formula
    points = bilingual_points(data.get("points"), data.get("pointsTa"))
    if points.get("en"):
        node["points"] = points
    if accent in MINDMAP_ACCENTS:
        node["accent"] = accent
    return node


@app.route("/api/mindmaps", methods=["GET"])
def get_mindmaps():
    """Catalogue of available concept maps, without the full node trees."""
    language = request.args.get("language", "en")
    maps = []
    for mind_map in load_mindmaps():
        presented = present_mindmap(mind_map, language)
        presented.pop("root", None)
        maps.append(presented)
    return jsonify({"maps": maps})


@app.route("/api/mindmaps/<map_id>", methods=["GET"])
def get_mindmap(map_id):
    """One concept map with its whole node tree, resolved to a language."""
    language = request.args.get("language", "en")
    mind_map = find_mindmap(map_id)
    if not mind_map:
        return jsonify({"error": "Mind map not found"}), 404
    return jsonify({"map": present_mindmap(mind_map, language)})


@app.route("/api/mindmaps/<map_id>/nodes", methods=["POST"])
def add_mindmap_node(map_id):
    """Attach a new node under an existing one."""
    data = request.get_json() or {}
    label = (data.get("label") or "").strip()
    parent_id = (data.get("parentId") or "root").strip()

    if not label:
        return jsonify({"error": "Node label is required"}), 400

    maps = load_mindmaps()
    for mind_map in maps:
        if mind_map.get("id") != map_id:
            continue

        root = mind_map.get("root", {})
        parent, _ = find_node(root, parent_id)
        if not parent:
            return jsonify({"error": "Parent node not found"}), 404

        new_node = node_from_payload(data, f"n_{int(time.time() * 1000)}")
        parent.setdefault("children", []).append(new_node)
        save_mindmaps(maps)
        return jsonify({"status": "ok", "node": present_node(new_node, "en")}), 201

    return jsonify({"error": "Mind map not found"}), 404


@app.route("/api/mindmaps/<map_id>/nodes/<node_id>", methods=["PUT"])
def update_mindmap_node(map_id, node_id):
    data = request.get_json() or {}
    maps = load_mindmaps()

    for mind_map in maps:
        if mind_map.get("id") != map_id:
            continue

        node, _ = find_node(mind_map.get("root", {}), node_id)
        if not node:
            return jsonify({"error": "Node not found"}), 404

        if "label" in data:
            if not (data.get("label") or "").strip():
                return jsonify({"error": "Node label is required"}), 400
            node["label"] = bilingual(data.get("label"), data.get("labelTa"))
        if "summary" in data:
            node["summary"] = bilingual(data.get("summary"), data.get("summaryTa"))
        if "formula" in data:
            node["formula"] = (data.get("formula") or "").strip()
        if "points" in data:
            node["points"] = bilingual_points(data.get("points"), data.get("pointsTa"))
        if "icon" in data:
            node["icon"] = (data.get("icon") or "").strip()
        if data.get("accent") in MINDMAP_ACCENTS:
            node["accent"] = data["accent"]

        save_mindmaps(maps)
        return jsonify({"status": "ok", "node": present_node(node, "en")})

    return jsonify({"error": "Mind map not found"}), 404


@app.route("/api/mindmaps/<map_id>/nodes/<node_id>", methods=["DELETE"])
def delete_mindmap_node(map_id, node_id):
    """Remove a node and everything hanging beneath it. The root cannot go."""
    maps = load_mindmaps()

    for mind_map in maps:
        if mind_map.get("id") != map_id:
            continue

        root = mind_map.get("root", {})
        if node_id == root.get("id"):
            return jsonify({"error": "The central topic cannot be deleted"}), 400

        node, parent = find_node(root, node_id)
        if not node or not parent:
            return jsonify({"error": "Node not found"}), 404

        removed = count_nodes(node)
        parent["children"] = [c for c in parent.get("children", []) if c.get("id") != node_id]
        save_mindmaps(maps)
        return jsonify({
            "status": "ok",
            "message": "Node deleted successfully",
            "removed": removed,
        })

    return jsonify({"error": "Mind map not found"}), 404


@app.route("/api/mindmaps/<map_id>/nodes/<node_id>/explain", methods=["POST"])
def explain_mindmap_node(map_id, node_id):
    """Expand one node into a short student-friendly explanation.

    The node's own stored text is the outline the model must stay inside, so the
    explanation never drifts away from what the map already teaches.
    """
    data = request.get_json() or {}
    language = data.get("language", "en")

    mind_map = find_mindmap(map_id)
    if not mind_map:
        return jsonify({"error": "Mind map not found"}), 404

    node, parent = find_node(mind_map.get("root", {}), node_id)
    if not node:
        return jsonify({"error": "Node not found"}), 404

    label = localized(node.get("label"), "en")
    topic = localized(mind_map.get("title"), "en")
    parent_label = localized(parent.get("label"), "en") if parent else ""

    outline_parts = []
    summary = localized(node.get("summary"), "en")
    if summary:
        outline_parts.append(summary)
    if node.get("formula"):
        outline_parts.append(f"Formula: {node['formula']}")
    for point in as_points(localized(node.get("points"), "en")):
        outline_parts.append(f"- {point}")
    for child in node.get("children", []):
        outline_parts.append(f"- Sub-topic: {localized(child.get('label'), 'en')}")
    outline = "\n".join(outline_parts) or "(no notes stored for this node yet)"

    if language == "ta":
        system_instruction = (
            "நீங்கள் பள்ளி மாணவர்களுக்கான அறிவியல் ஆசிரியர். ஒரு கருத்து வரைபடத்தின் ஒரு முனையை விளக்குகிறீர்கள்.\n"
            "விதிகள்:\n"
            "1. கீழே தரப்பட்ட குறிப்புகளுக்குள் மட்டுமே இருக்கவும்; புதிய கருத்துக்களை உருவாக்க வேண்டாம்.\n"
            "2. 4 முதல் 6 சிறு வாக்கியங்கள் மட்டும்.\n"
            "3. ஒரு எளிய அன்றாட எடுத்துக்காட்டு சேர்க்கவும்.\n"
            "4. சூத்திரம் இருந்தால் ஒவ்வொரு எழுத்தும் எதைக் குறிக்கிறது என்று கூறவும்.\n"
            "5. எளிய தமிழில், மாணவர்களுக்குப் புரியும் வகையில் எழுதவும்."
        )
    else:
        system_instruction = (
            "You are a school science teacher explaining one node of a concept mind map.\n"
            "Rules:\n"
            "1. Stay strictly inside the notes given below — do not invent new concepts.\n"
            "2. Write 4 to 6 short sentences, no headings.\n"
            "3. Include one simple everyday example.\n"
            "4. If a formula is given, say what each symbol stands for.\n"
            "5. Use plain language a school student can follow."
        )

    # RAG: ground the explanation in the curriculum text where it exists.
    retrieved = knowledge_base.search(f"{topic} {label}", top_k=2, min_score=0.8)
    if retrieved:
        system_instruction += (
            "\n\nCURRICULUM REFERENCE (prefer this wording where it fits):\n"
            + knowledge_base.format_rag_context(retrieved, max_chars=1200)
        )

    user_prompt = (
        f"Mind map: {topic}\n"
        f"Branch: {parent_label or 'central topic'}\n"
        f"Node to explain: {label}\n\n"
        f"Notes stored on this node:\n{outline}"
    )

    models_to_try = [MODEL_ID] + FALLBACK_MODELS
    last_error = None

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt},
                ],
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Mind Map Node Explainer",
                },
            )
            return jsonify({
                "explanation": response.choices[0].message.content,
                "nodeId": node_id,
                "language": language,
                "model_used": model_name,
            })
        except Exception as e:
            last_error = e
            print(f"[WARN] Mind map explain failed on {model_name}: {e}")

    print(f"[ERROR] Mind map explain failed on every model: {last_error}")
    return jsonify({"error": "Could not generate an explanation right now."}), 503


# ─── Routes: Kahoot-Style Live Quiz Module (image question + timed answers) ────

KAHOOT_FILE = os.path.join(DATA_DIR, "kahoot_quizzes.json")

# The frontend paints exactly 4 answer tiles per question, colour+shape coded
# the way Kahoot does, so every question is stored with exactly 4 options.
KAHOOT_OPTION_COUNT = 4
KAHOOT_DEFAULT_TIME_LIMIT = 20


def load_kahoot_quizzes():
    if not os.path.exists(KAHOOT_FILE):
        return []
    try:
        with open(KAHOOT_FILE, "r", encoding="utf-8") as f:
            return json.load(f).get("quizzes", [])
    except Exception as e:
        print(f"[ERROR] Failed to read kahoot_quizzes.json: {e}")
        return []


def save_kahoot_quizzes(quizzes):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(KAHOOT_FILE, "w", encoding="utf-8") as f:
        json.dump({"quizzes": quizzes}, f, ensure_ascii=False, indent=2)


def find_kahoot_quiz(quizzes, quiz_id):
    for quiz in quizzes:
        if quiz.get("id") == quiz_id:
            return quiz
    return None


def present_kahoot_question(question, language):
    return {
        "id": question.get("id"),
        "question": localized(question.get("question"), language),
        "image": question.get("image", ""),
        "options": question.get("options", []),
        "correctIndex": question.get("correctIndex", 0),
        "timeLimit": question.get("timeLimit", KAHOOT_DEFAULT_TIME_LIMIT),
    }


def present_kahoot_quiz(quiz, language, include_questions=True):
    presented = {
        "id": quiz.get("id"),
        "title": localized(quiz.get("title"), language),
        "description": localized(quiz.get("description"), language) or "",
        "questionCount": len(quiz.get("questions", [])),
        "createdAt": quiz.get("createdAt"),
    }
    if include_questions:
        presented["questions"] = [
            present_kahoot_question(q, language) for q in quiz.get("questions", [])
        ]
    return presented


@app.route("/api/kahoot/quizzes", methods=["GET"])
def get_kahoot_quizzes():
    """Catalogue of quizzes for the quiz picker (no questions included)."""
    language = request.args.get("language", "en")
    quizzes = load_kahoot_quizzes()
    return jsonify({
        "quizzes": [present_kahoot_quiz(q, language, include_questions=False) for q in quizzes]
    })


@app.route("/api/kahoot/quizzes/<quiz_id>", methods=["GET"])
def get_kahoot_quiz(quiz_id):
    """One quiz with its full question set, used to host/play or edit it."""
    language = request.args.get("language", "en")
    quiz = find_kahoot_quiz(load_kahoot_quizzes(), quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    return jsonify({"quiz": present_kahoot_quiz(quiz, language)})


@app.route("/api/kahoot/quizzes", methods=["POST"])
def add_kahoot_quiz():
    data = request.get_json() or {}
    title_en = (data.get("title") or "").strip()
    if not title_en:
        return jsonify({"error": "Quiz title is required"}), 400

    new_quiz = {
        "id": f"kq_{int(time.time() * 1000)}",
        "title": bilingual(title_en, data.get("titleTa")),
        "description": bilingual(data.get("description") or "", data.get("descriptionTa")),
        "questions": [],
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    quizzes = load_kahoot_quizzes()
    quizzes.append(new_quiz)
    save_kahoot_quizzes(quizzes)
    return jsonify({"status": "ok", "quiz": present_kahoot_quiz(new_quiz, "en", include_questions=False)}), 201


@app.route("/api/kahoot/quizzes/<quiz_id>", methods=["PUT"])
def update_kahoot_quiz(quiz_id):
    data = request.get_json() or {}
    quizzes = load_kahoot_quizzes()
    quiz = find_kahoot_quiz(quizzes, quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    if "title" in data:
        if not (data.get("title") or "").strip():
            return jsonify({"error": "Quiz title is required"}), 400
        quiz["title"] = bilingual(data.get("title"), data.get("titleTa"))
    if "description" in data:
        quiz["description"] = bilingual(data.get("description") or "", data.get("descriptionTa"))

    save_kahoot_quizzes(quizzes)
    return jsonify({"status": "ok", "quiz": present_kahoot_quiz(quiz, "en", include_questions=False)})


@app.route("/api/kahoot/quizzes/<quiz_id>", methods=["DELETE"])
def delete_kahoot_quiz(quiz_id):
    quizzes = load_kahoot_quizzes()
    remaining = [q for q in quizzes if q.get("id") != quiz_id]
    if len(remaining) == len(quizzes):
        return jsonify({"error": "Quiz not found"}), 404
    save_kahoot_quizzes(remaining)
    return jsonify({"status": "ok", "message": "Quiz deleted successfully"})


@app.route("/api/kahoot/quizzes/<quiz_id>/questions", methods=["POST"])
def add_kahoot_question(quiz_id):
    data = request.get_json() or {}
    quizzes = load_kahoot_quizzes()
    quiz = find_kahoot_quiz(quizzes, quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    question_en = (data.get("question") or "").strip()
    options = [str(o).strip() for o in (data.get("options") or []) if str(o).strip()]
    correct_index = data.get("correctIndex")

    if not question_en:
        return jsonify({"error": "Question text is required"}), 400
    if len(options) != KAHOOT_OPTION_COUNT:
        return jsonify({"error": f"Exactly {KAHOOT_OPTION_COUNT} answer options are required"}), 400
    if not isinstance(correct_index, int) or not 0 <= correct_index < KAHOOT_OPTION_COUNT:
        return jsonify({"error": "A valid correct answer must be selected"}), 400

    new_question = {
        "id": f"kqq_{int(time.time() * 1000)}",
        "question": bilingual(question_en, data.get("questionTa")),
        "image": (data.get("image") or "").strip(),
        "options": options,
        "correctIndex": correct_index,
        "timeLimit": int(data.get("timeLimit") or KAHOOT_DEFAULT_TIME_LIMIT),
    }

    quiz.setdefault("questions", []).append(new_question)
    save_kahoot_quizzes(quizzes)
    return jsonify({"status": "ok", "question": present_kahoot_question(new_question, "en")}), 201


@app.route("/api/kahoot/quizzes/<quiz_id>/questions/<question_id>", methods=["PUT"])
def update_kahoot_question(quiz_id, question_id):
    data = request.get_json() or {}
    quizzes = load_kahoot_quizzes()
    quiz = find_kahoot_quiz(quizzes, quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    for question in quiz.get("questions", []):
        if question.get("id") != question_id:
            continue

        if "question" in data:
            if not (data.get("question") or "").strip():
                return jsonify({"error": "Question text is required"}), 400
            question["question"] = bilingual(data.get("question"), data.get("questionTa"))
        if "image" in data:
            question["image"] = (data.get("image") or "").strip()
        if "options" in data:
            options = [str(o).strip() for o in (data.get("options") or []) if str(o).strip()]
            if len(options) != KAHOOT_OPTION_COUNT:
                return jsonify({"error": f"Exactly {KAHOOT_OPTION_COUNT} answer options are required"}), 400
            question["options"] = options
        if "correctIndex" in data:
            correct_index = data.get("correctIndex")
            if not isinstance(correct_index, int) or not 0 <= correct_index < KAHOOT_OPTION_COUNT:
                return jsonify({"error": "A valid correct answer must be selected"}), 400
            question["correctIndex"] = correct_index
        if "timeLimit" in data:
            question["timeLimit"] = int(data.get("timeLimit") or KAHOOT_DEFAULT_TIME_LIMIT)

        save_kahoot_quizzes(quizzes)
        return jsonify({"status": "ok", "question": present_kahoot_question(question, "en")})

    return jsonify({"error": "Question not found"}), 404


@app.route("/api/kahoot/quizzes/<quiz_id>/questions/<question_id>", methods=["DELETE"])
def delete_kahoot_question(quiz_id, question_id):
    quizzes = load_kahoot_quizzes()
    quiz = find_kahoot_quiz(quizzes, quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    before = len(quiz.get("questions", []))
    quiz["questions"] = [q for q in quiz.get("questions", []) if q.get("id") != question_id]
    if len(quiz["questions"]) == before:
        return jsonify({"error": "Question not found"}), 404

    save_kahoot_quizzes(quizzes)
    return jsonify({"status": "ok", "message": "Question deleted successfully"})


# ─── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    print(f"[INFO] Backend server starting on http://localhost:{port}")
    print(f"[INFO] OpenRouter Gemma AI initialized with primary model: {MODEL_ID}")
    app.run(host="0.0.0.0", port=port, debug=debug)
