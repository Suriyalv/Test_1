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



# ─── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    print(f"[INFO] Backend server starting on http://localhost:{port}")
    print(f"[INFO] OpenRouter Gemma AI initialized with primary model: {MODEL_ID}")
    app.run(host="0.0.0.0", port=port, debug=debug)
