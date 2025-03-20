// client/src/components/quiz/QuestionForm.js
import React from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import './QuestionForm.css';

// Validation schema
const questionSchema = Yup.object({
  text: Yup.string().required('Question text is required'),
  options: Yup.array()
    .of(Yup.string().required('Option is required'))
    .min(2, 'At least 2 options are required')
    .max(4, 'Maximum 4 options allowed'),
  correctAnswer: Yup.number().required('Correct answer is required'),
  points: Yup.number()
    .min(100, 'Minimum points is 100')
    .max(2000, 'Maximum points is 2000')
    .required('Points are required')
});

const QuestionForm = ({ question, index, onSave, onDelete }) => {
  const initialValues = {
    text: question?.text || '',
    image: question?.image || '',
    options: question?.options || ['', ''],
    correctAnswer: question?.correctAnswer !== undefined ? question.correctAnswer : 0,
    points: question?.points || 1000
  };

  const handleSubmit = (values) => {
    onSave(values, index);
  };

  return (
    <div className="question-form card">
      <div className="question-header">
        <h3>Question {index + 1}</h3>
        {onDelete && (
          <button 
            type="button" 
            className="btn-danger btn-delete-question" 
            onClick={() => onDelete(index)}
          >
            Delete
          </button>
        )}
      </div>
      
      <Formik
        initialValues={initialValues}
        validationSchema={questionSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form>
            <div className="form-group">
              <label htmlFor={`text-${index}`}>Question Text</label>
              <Field
                as="textarea"
                name="text"
                id={`text-${index}`}
                placeholder="Enter your question..."
              />
              <ErrorMessage name="text" component="div" className="error" />
            </div>
            
            <div className="form-group">
              <label htmlFor={`image-${index}`}>Image URL (optional)</label>
              <Field
                type="text"
                name="image"
                id={`image-${index}`}
                placeholder="Enter image URL..."
              />
            </div>
            
            <div className="form-group">
              <label>Options</label>
              <FieldArray name="options">
                {({ push, remove }) => (
                  <div>
                    {values.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="option-container">
                        <div className="option-input">
                          <Field
                            type="text"
                            name={`options.${optionIndex}`}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <label className="correct-option">
                            <Field
                              type="radio"
                              name="correctAnswer"
                              value={optionIndex}
                              checked={values.correctAnswer === optionIndex}
                            />
                            Correct
                          </label>
                        </div>
                        
                        {values.options.length > 2 && (
                          <button
                            type="button"
                            className="btn-remove-option"
                            onClick={() => remove(optionIndex)}
                          >
                            &times;
                          </button>
                        )}
                        <ErrorMessage
                          name={`options.${optionIndex}`}
                          component="div"
                          className="error"
                        />
                      </div>
                    ))}
                    
                    {values.options.length < 4 && (
                      <button
                        type="button"
                        className="btn-add-option"
                        onClick={() => push('')}
                      >
                        Add Option
                      </button>
                    )}
                  </div>
                )}
              </FieldArray>
              <ErrorMessage name="options" component="div" className="error" />
              <ErrorMessage name="correctAnswer" component="div" className="error" />
            </div>
            
            <div className="form-group">
              <label htmlFor={`points-${index}`}>Points</label>
              <Field
                type="number"
                name="points"
                id={`points-${index}`}
                min="100"
                max="2000"
                step="100"
              />
              <ErrorMessage name="points" component="div" className="error" />
            </div>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Question'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default QuestionForm;