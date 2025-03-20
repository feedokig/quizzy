// client/src/pages/auth/Register.js
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import Alert from '../../components/ui/Alert';
import './Auth.css';

const registerSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

const Register = () => {
  const { register, isAuthenticated, error } = useAuth();
  const [registerError, setRegisterError] = useState(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { confirmPassword, ...userData } = values;
      await register(userData);
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h2>Create an Account</h2>
        
        {(registerError || error) && (
          <Alert 
            type="danger" 
            message={registerError || error} 
            onClose={() => setRegisterError(null)} 
          />
        )}
        
        <Formik
          initialValues={{ username: '', email: '', password: '', confirmPassword: '' }}
          validationSchema={registerSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <Field 
                  type="text" 
                  name="username" 
                  id="username" 
                  placeholder="Choose a username" 
                />
                <ErrorMessage name="username" component="div" className="error" />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <Field 
                  type="email" 
                  name="email" 
                  id="email" 
                  placeholder="Enter your email" 
                />
                <ErrorMessage name="email" component="div" className="error" />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <Field 
                  type="password" 
                  name="password" 
                  id="password" 
                  placeholder="Create a password" 
                />
                <ErrorMessage name="password" component="div" className="error" />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Field 
                  type="password" 
                  name="confirmPassword" 
                  id="confirmPassword" 
                  placeholder="Confirm your password" 
                />
                <ErrorMessage name="confirmPassword" component="div" className="error" />
              </div>
              
              <button 
                type="submit" 
                className="btn-primary btn-block" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Register'}
              </button>
            </Form>
          )}
        </Formik>
        
        <div className="auth-links">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;