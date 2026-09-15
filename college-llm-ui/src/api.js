const API_BASE_URL = "http://localhost:5000/api";

export const chatWithAI = async (message, history, subjectChoice, language = "en") => {
    const payload = { message, history, language };
    if (subjectChoice) {
        payload.subject = subjectChoice;
    }
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return response.json();
};

export const fetchRegulations = async () => {
    const response = await fetch(`${API_BASE_URL}/regulations`);
    return response.json();
};

export const fetchSemesters = async (regulation) => {
    const response = await fetch(`${API_BASE_URL}/semesters/${regulation}`);
    return response.json();
};

export const fetchCourses = async (regulation, semester) => {
    const response = await fetch(`${API_BASE_URL}/courses/${regulation}/${semester}`);
    return response.json();
};

export const fetchPaperTypes = async (regulation, semester, course) => {
    const response = await fetch(`${API_BASE_URL}/types/${regulation}/${semester}/${course}`);
    return response.json();
};

export const fetchCourseContents = async (regulation, semester, course) => {
    const response = await fetch(`${API_BASE_URL}/course_contents/${regulation}/${semester}/${course}`);
    return response.json();
};

export const fetchPapers = async (regulation, semester, course, type) => {
    const response = await fetch(`${API_BASE_URL}/papers/${regulation}/${semester}/${course}/${type}`);
    return response.json();
};

export const getDownloadUrl = (filename) => {
    return `${API_BASE_URL}/download/${filename}`;
};

export const fetchBookSubjects = async () => {
    const response = await fetch(`${API_BASE_URL}/books/subjects`);
    return response.json();
};

export const fetchBookFiles = async (subject) => {
    const response = await fetch(`${API_BASE_URL}/books/files/${subject}`);
    return response.json();
};

export const getBookDownloadUrl = (filename) => {
    return `${API_BASE_URL}/download_book/${filename}`;
};

export const sendLike = async (prompt) => {
    const response = await fetch(`${API_BASE_URL}/feedback/like`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
    });
    return response.json();
};

export const sendDislike = async (prompt) => {
    const response = await fetch(`${API_BASE_URL}/feedback/dislike`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
    });
    return response.json();
};

export const fetchFeedbackStats = async () => {
    const response = await fetch(`${API_BASE_URL}/feedback/stats`);
    return response.json();
};

// ─── Test Module API Helpers ───────────────────────────────────────────────────

export const fetchTestQuestions = async (category = "All", language = "all") => {
    const params = new URLSearchParams({ category, language });
    const response = await fetch(`${API_BASE_URL}/test/questions?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Failed to fetch test questions");
    }
    return response.json();
};

export const addTestQuestion = async (questionData) => {
    const response = await fetch(`${API_BASE_URL}/test/questions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
    });
    if (!response.ok) {
        throw new Error("Failed to add test question");
    }
    return response.json();
};

export const deleteTestQuestion = async (qId) => {
    const response = await fetch(`${API_BASE_URL}/test/questions/${qId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete question");
    }
    return response.json();
};

export const evaluateTestAnswer = async (payload) => {
    const response = await fetch(`${API_BASE_URL}/test/evaluate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error("Failed to evaluate test answer");
    }
    return response.json();
};

export const fetchMascotHint = async ({ message, context_question, history, language = "en" }) => {
    const response = await fetch(`${API_BASE_URL}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context_question, history, language }),
    });
    if (!response.ok) throw new Error("Failed to fetch mascot hint");
    return response.json();
};

export const fetchMascotQuestion = async ({ language = "en", subject = "", used_questions = [] }) => {
    const response = await fetch(`${API_BASE_URL}/mascot/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, subject, used_questions }),
    });
    if (!response.ok) throw new Error("Failed to generate mascot question");
    return response.json();
};

export const checkMascotAnswer = async ({ question, correct_answer, student_answer, attempt = 1, language = "en" }) => {
    const response = await fetch(`${API_BASE_URL}/mascot/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, correct_answer, student_answer, attempt, language }),
    });
    if (!response.ok) throw new Error("Failed to check mascot answer");
    return response.json();
};

// ─── Video Lesson (Watch → Pause → Answer) API Helpers ────────────────────────

export const fetchVideoLessons = async (language = "en") => {
    const response = await fetch(`${API_BASE_URL}/video/lessons?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch video lessons");
    return response.json();
};

export const fetchVideoCheckpointQuestion = async ({ lessonId, conceptId, language = "en", askedQuestions = [] }) => {
    const response = await fetch(`${API_BASE_URL}/video/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, conceptId, language, askedQuestions }),
    });
    if (!response.ok) throw new Error("Failed to generate checkpoint question");
    return response.json();
};

export const fetchVideoFinalQuiz = async ({ lessonId, language = "en", askedQuestions = [] }) => {
    const response = await fetch(`${API_BASE_URL}/video/final-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, language, askedQuestions }),
    });
    if (!response.ok) throw new Error("Failed to generate the final review");
    return response.json();
};

export const submitVideoAnswer = async ({ questionId, selectedIndex, language = "en" }) => {
    const response = await fetch(`${API_BASE_URL}/video/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedIndex, language }),
    });
    if (!response.ok) throw new Error("Failed to check answer");
    return response.json();
};

// ─── Flashcard Module API Helpers ─────────────────────────────────────────────

export const fetchFlashcards = async (language = "en", deck = "All") => {
    const params = new URLSearchParams({ language, deck });
    const response = await fetch(`${API_BASE_URL}/flashcards?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch flashcards");
    return response.json();
};

export const addFlashcard = async (cardData) => {
    const response = await fetch(`${API_BASE_URL}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardData),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add flashcard");
    }
    return response.json();
};

export const deleteFlashcard = async (cardId) => {
    const response = await fetch(`${API_BASE_URL}/flashcards/${cardId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete flashcard");
    return response.json();
};

// ─── Mind Map Module API Helpers ──────────────────────────────────────────────

export const fetchMindMaps = async (language = "en") => {
    const response = await fetch(`${API_BASE_URL}/mindmaps?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch mind maps");
    return response.json();
};

export const fetchMindMap = async (mapId, language = "en") => {
    const response = await fetch(`${API_BASE_URL}/mindmaps/${mapId}?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch the mind map");
    return response.json();
};

export const addMindMapNode = async (mapId, nodeData) => {
    const response = await fetch(`${API_BASE_URL}/mindmaps/${mapId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nodeData),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add the node");
    }
    return response.json();
};

export const updateMindMapNode = async (mapId, nodeId, nodeData) => {
    const response = await fetch(`${API_BASE_URL}/mindmaps/${mapId}/nodes/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nodeData),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update the node");
    }
    return response.json();
};

export const deleteMindMapNode = async (mapId, nodeId) => {
    const response = await fetch(`${API_BASE_URL}/mindmaps/${mapId}/nodes/${nodeId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete the node");
    }
    return response.json();
};

export const explainMindMapNode = async (mapId, nodeId, language = "en") => {
    const response = await fetch(`${API_BASE_URL}/mindmaps/${mapId}/nodes/${nodeId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
    });
    if (!response.ok) throw new Error("Failed to generate an explanation");
    return response.json();
};

// ─── Kahoot-Style Live Quiz Module API Helpers ────────────────────────────────

export const fetchKahootQuizzes = async (language = "en") => {
    const response = await fetch(`${API_BASE_URL}/kahoot/quizzes?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch quizzes");
    return response.json();
};

export const fetchKahootQuiz = async (quizId, language = "en") => {
    const response = await fetch(`${API_BASE_URL}/kahoot/quizzes/${quizId}?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch the quiz");
    return response.json();
};

export const addKahootQuiz = async (quizData) => {
    const response = await fetch(`${API_BASE_URL}/kahoot/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create quiz");
    }
    return response.json();
};

export const deleteKahootQuiz = async (quizId) => {
    const response = await fetch(`${API_BASE_URL}/kahoot/quizzes/${quizId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete quiz");
    return response.json();
};

export const addKahootQuestion = async (quizId, questionData) => {
    const response = await fetch(`${API_BASE_URL}/kahoot/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add question");
    }
    return response.json();
};

export const deleteKahootQuestion = async (quizId, questionId) => {
    const response = await fetch(`${API_BASE_URL}/kahoot/quizzes/${quizId}/questions/${questionId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete question");
    return response.json();
};
