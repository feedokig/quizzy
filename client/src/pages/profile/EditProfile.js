import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './EditProfile.css';

const EditProfile = () => {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
      .min(6, 'New password must be at least 6 characters')
      .required('New password is required'),
    confirmNewPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
      .required('Confirm new password is required'),
  });

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      await updatePassword(values.currentPassword, values.newPassword);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ currentPassword: error.message || 'Failed to update password' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-card">
        <h2>Edit Profile</h2>
        <Formik
          initialValues={{
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <Field
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  placeholder="Enter current password"
                />
                <ErrorMessage name="currentPassword" component="div" className="error" />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <Field
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  placeholder="Enter new password"
                />
                <ErrorMessage name="newPassword" component="div" className="error" />
              </div>

              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <Field
                  type="password"
                  name="confirmNewPassword"
                  id="confirmNewPassword"
                  placeholder="Confirm new password"
                />
                <ErrorMessage name="confirmNewPassword" component="div" className="error" />
              </div>

              <button type="submit" className="btn-primary btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EditProfile;