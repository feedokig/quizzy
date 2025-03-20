// client/src/pages/auth/Login.js
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import Alert from '../../components/ui/Alert';
import './Auth.css';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

const Login = () => {
  const { login, isAuthenticated, error } = useAuth();
  const [loginError, setLoginError] = useState(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await login(values);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h2>Login to Quizzy</h2>
        
        {(loginError || error) && (
          <Alert 
            type="danger" 
            message={loginError || error} 
            onClose={() => setLoginError(null)} 
          />
        )}
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
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
                  placeholder="Enter your password" 
                />
                <ErrorMessage name="password" component="div" className="error" />
              </div>
              
              <button 
                type="submit" 
                className="btn-primary btn-block" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>
        
        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;