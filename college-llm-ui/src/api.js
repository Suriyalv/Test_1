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

export const fetchMascotQuestion = async ({ language = "en", used_questions = [] }) => {
    const response = await fetch(`${API_BASE_URL}/mascot/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, used_questions }),
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
