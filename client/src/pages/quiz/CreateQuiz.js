// client/src/pages/quiz/CreateQuiz.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateQuiz.css";

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [quizData, setQuizData] = useState({
    title: "",
    questions: [],
    wheelEnabled: true,
  });

  const [editIndex, setEditIndex] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: null,
  });

  // Function to add a question to the quiz
  const addQuestion = (e) => {
    e.preventDefault();
    if (
      !currentQuestion.question ||
      currentQuestion.correctAnswer === null ||
      currentQuestion.options.some((opt) => !opt)
    ) {
      setAlert({
        show: true,
        message: "Please fill out all the fields and select the correct answer",
        type: "error",
      });
      return;
    }

    // If we're editing an existing question
    if (editIndex !== null) {
      const updatedQuestions = [...quizData.questions];
      updatedQuestions[editIndex] = { ...currentQuestion };

      setQuizData((prev) => ({
        ...prev,
        questions: updatedQuestions,
      }));
      setEditIndex(null);
    } else {
      // Adding a new question
      setQuizData((prev) => ({
        ...prev,
        questions: [...prev.questions, { ...currentQuestion }],
      }));
    }

    // Reset current question form
    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: null,
    });
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quizData.title || quizData.questions.length === 0) {
      setAlert({
        show: true,
        message: "Please add a name and at least one question",
        type: "error",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAlert({
          show: true,
          message: "You must be authorized to create a quiz",
          type: "error",
        });
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/quiz",
        quizData,
        {
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
        }
      );

      if (response.data) {
        setAlert({
          show: true,
          message: "Quiz has been successfully created!",
          type: "success",
        });

        // Clear form data
        setQuizData({
          title: "",
          questions: [],
          wheelEnabled: true,
        });

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      setAlert({
        show: true,
        message:
          error.response?.data?.message ||
          "The error of creating a quiz. Try again.",
        type: "error",
      });
    }
  };

  // Function to edit a question
  const handleEditQuestion = (index) => {
    setCurrentQuestion({ ...quizData.questions[index] });
    setEditIndex(index);
  };

  // Function to delete a question
  const handleDeleteQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    setQuizData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  // Alert component
  const Alert = ({ type, message }) => (
    <div className={`alert alert-${type}`}>{message}</div>
  );

  return (
    <div className="create-quiz-container">
      <div className="create-quiz-form">
        <h1>Create a new quiz</h1>

        {alert.show && <Alert type={alert.type} message={alert.message} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="quiz-title-input"
              placeholder="The name of the quiz"
              value={quizData.title}
              onChange={(e) =>
                setQuizData({ ...quizData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="question-form">
            <h2>
              {editIndex !== null ? "Edit the question" : "Add a new question"}
            </h2>

            <div className="form-group">
              <textarea
                className="question-input"
                placeholder="The text of the question"
                value={currentQuestion.question}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    question: e.target.value,
                  })
                }
              />
            </div>

            <div className="options-container">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="option-row">
                  <input
                    type="text"
                    placeholder={`Variant ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentQuestion.options];
                      newOptions[index] = e.target.value;
                      setCurrentQuestion({
                        ...currentQuestion,
                        options: newOptions,
                      });
                    }}
                  />
                  <label className="correct-answer-label">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={index}
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          correctAnswer: index,
                        })
                      }
                    />
                    <span>Correct</span>
                  </label>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-question-btn"
              onClick={addQuestion}
            >
              {editIndex !== null ? "Save changes" : "Add the question"}
            </button>

            {editIndex !== null && (
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={() => {
                  setEditIndex(null);
                  setCurrentQuestion({
                    question: "",
                    options: ["", "", "", ""],
                    correctAnswer: null,
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>

          <div className="questions-preview">
            <h2>Added questions ({quizData.questions.length})</h2>

            {quizData.questions.length === 0 ? (
              <div className="empty-questions">
                <p>
                  Questions have not yet been added. Create your first question!
                </p>
              </div>
            ) : (
              <div className="questions-list">
                {quizData.questions.map((q, idx) => (
                  <div key={idx} className="question-card">
                    <div className="question-content">
                      <span className="question-number">
                        Question {idx + 1}
                      </span>
                      <p className="question-text">{q.question}</p>

                      <div className="options-preview">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`option-item ${
                              optIdx === q.correctAnswer ? "correct" : ""
                            }`}
                          >
                            {opt}{" "}
                            {optIdx === q.correctAnswer && (
                              <span className="correct-badge">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="question-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleEditQuestion(idx)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDeleteQuestion(idx)}
                      >
                        ❌ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="create-quiz-btn">
            Create a quiz{" "}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;
