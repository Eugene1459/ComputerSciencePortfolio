
import { useEffect, useRef, useState } from 'react';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api/';

function App() {
  // =========================
  // AUTHENTICATION STATE
  // =========================

  const [token, setToken] = useState(
    () => sessionStorage.getItem('authToken')
  );

  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [authData, setAuthData] = useState({
    username: '',
    email: '',
    password: '',
  });

  // Handles login and registration
  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    setAuthLoading(true);
    setAuthError('');

    const isRegistering = authMode === 'register';

    const endpoint = isRegistering
      ? 'register/'
      : 'token-auth/';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isRegistering
            ? authData
            : {
                username: authData.username,
                password: authData.password,
              }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Object.values(data)
          .flat()
          .join(' ');

        throw new Error(message || 'Authentication failed.');
      }

      if (isRegistering) {
        setAuthMode('login');

        setAuthData({
          username: authData.username,
          email: '',
          password: '',
        });

        setAuthError(
          'Account created successfully. Please log in.'
        );
      } else {
        sessionStorage.setItem('authToken', data.token);
        setToken(data.token);

        setAuthData({
          username: '',
          email: '',
          password: '',
        });
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Clears an invalid or expired session
  const handleUnauthorized = () => {
    sessionStorage.removeItem('authToken');
    setToken(null);
    setApplications([]);
    setError('Your session has expired. Please log in again.');
  };

  // Handles logout
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}logout/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      sessionStorage.removeItem('authToken');
      setToken(null);
      setApplications([]);
      setShowForm(false);
      resetForm();

      setAuthMode('login');
      setAuthError('');
    }
  };

  // =========================
  // APPLICATION STATE
  // =========================

  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const formRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    location: '',
    application_date: '',
    follow_up_date: '',
    status: 'Applied',
    job_description: '',
    notes: '',
  });

  // Resets the application form
  const resetForm = () => {
    setFormData({
      company_name: '',
      job_title: '',
      location: '',
      application_date: '',
      follow_up_date: '',
      status: 'Applied',
      job_description: '',
      notes: '',
    });

    setEditingId(null);
    setError('');
  };

  // =========================
  // FETCH APPLICATIONS
  // =========================

  useEffect(() => {
    if (!token) {
      setApplications([]);
      return;
    }

    const fetchApplications = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}applications/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch applications.');
        }

        const data = await response.json();
        setApplications(data);
        setError('');
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Could not load applications. Please try again.');
      }
    };

    fetchApplications();
  }, [token]);

  // Scroll to the application form when it opens
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [showForm, editingId]);

  // =========================
  // EDIT APPLICATION
  // =========================

  const handleEdit = (app) => {
    setEditingId(app.id);

    setFormData({
      company_name: app.company_name,
      job_title: app.job_title,
      location: app.location || '',
      application_date: app.application_date,
      follow_up_date: app.follow_up_date || '',
      status: app.status,
      job_description: app.job_description || '',
      notes: app.notes || '',
    });

    setError('');
    setShowForm(true);
  };

  // =========================
  // ADD OR UPDATE APPLICATION
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEditing = editingId !== null;

    const url = isEditing
      ? `${API_BASE_URL}applications/${editingId}/`
      : `${API_BASE_URL}applications/`;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          follow_up_date: formData.follow_up_date || null,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          isEditing
            ? 'Failed to update application.'
            : 'Failed to save application.'
        );
      }

      const savedApplication = await response.json();

      if (isEditing) {
        setApplications((previous) =>
          previous.map((app) =>
            app.id === editingId ? savedApplication : app
          )
        );
      } else {
        setApplications((previous) => [
          savedApplication,
          ...previous,
        ]);
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error(err);

      setError(
        isEditing
          ? 'Could not update application. Please try again.'
          : 'Could not save application. Please try again.'
      );
    }
  };

  // =========================
  // DELETE APPLICATION
  // =========================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this application?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}applications/${id}/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete application.');
      }

      setApplications((previous) =>
        previous.filter((app) => app.id !== id)
      );

      if (editingId === id) {
        resetForm();
        setShowForm(false);
      } else {
        setError('');
      }
    } catch (err) {
      console.error(err);
      setError('Could not delete application. Please try again.');
    }
  };

  // Close the form
  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // =========================
  // SEARCH, FILTER AND SORT
  // =========================

  const filteredApplications = applications.filter((app) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      app.company_name.toLowerCase().includes(search) ||
      app.job_title.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === 'All' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const dateA = new Date(a.application_date);
    const dateB = new Date(b.application_date);

    if (sortOrder === 'newest') {
      return dateB - dateA;
    }

    return dateA - dateB;
  });

  // =========================
  // FOLLOW-UP REMINDERS
  // =========================

  const today = (() => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  })();

  const reminderApplications = applications
    .filter((app) =>
      ['Applied', 'Interview'].includes(app.status) &&
      app.follow_up_date
    )
    .map((app) => {
      let reminderStatus = 'upcoming';

      if (app.follow_up_date < today) {
        reminderStatus = 'overdue';
      } else if (app.follow_up_date === today) {
        reminderStatus = 'today';
      }

      return {
        ...app,
        reminderStatus,
      };
    })
    .sort((a, b) =>
      a.follow_up_date.localeCompare(b.follow_up_date)
    );

  // =========================
  // APPLICATION ANALYTICS
  // =========================

  const statusSummary = [
    'Applied',
    'Interview',
    'Offer',
    'Rejected',
  ].map((status) => {
    const count = applications.filter(
      (app) => app.status === status
    ).length;

    const percentage = applications.length > 0
      ? Math.round((count / applications.length) * 100)
      : 0;

    return {
      status,
      count,
      percentage,
    };
  });

  // =========================
  // LOGIN AND REGISTRATION SCREEN
  // =========================

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>JobTracker</h1>

          <p>
            {authMode === 'login'
              ? 'Welcome back! Log in to continue.'
              : 'Create an account to get started.'}
          </p>

          {authError && (
            <p className="auth-error">{authError}</p>
          )}

          <form onSubmit={handleAuthSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={authData.username}
              onChange={(e) =>
                setAuthData({
                  ...authData,
                  username: e.target.value,
                })
              }
              required
            />

            {authMode === 'register' && (
              <input
                type="email"
                placeholder="Email address"
                value={authData.email}
                onChange={(e) =>
                  setAuthData({
                    ...authData,
                    email: e.target.value,
                  })
                }
                required
              />
            )}

            <input
              type="password"
              placeholder="Password"
              value={authData.password}
              onChange={(e) =>
                setAuthData({
                  ...authData,
                  password: e.target.value,
                })
              }
              minLength={8}
              required
            />

            <button type="submit" disabled={authLoading}>
              {authLoading
                ? 'Please wait...'
                : authMode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}
            {' '}

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === 'login' ? 'register' : 'login'
                );
                setAuthError('');
              }}
            >
              {authMode === 'login' ? 'Register' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN DASHBOARD
  // =========================

  return (
    <div className="app-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2>JobTracker</h2>

        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#applications">Applications</a>
          <a href="#settings">Settings</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content" id="dashboard">

        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your job search overview.</p>
          </div>

          <div>
            <button
              className="add-button"
              onClick={() => {
                if (showForm) {
                  handleCancel();
                } else {
                  resetForm();
                  setShowForm(true);
                }
              }}
            >
              {showForm ? 'Cancel' : '+ Add Application'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Display errors */}
        {error && (
          <p className="error-message">{error}</p>
        )}

        {/* Add/Edit Application Form */}
        {showForm && (
          <form
            ref={formRef}
            className="application-form"
            onSubmit={handleSubmit}
          >
            <h2>
              {editingId !== null
                ? 'Edit Job Application'
                : 'New Job Application'}
            </h2>

            <input
              type="text"
              placeholder="Company Name"
              value={formData.company_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  company_name: e.target.value,
                })
              }
              required
            />

            <input
              type="text"
              placeholder="Job Title"
              value={formData.job_title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  job_title: e.target.value,
                })
              }
              required
            />

            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: e.target.value,
                })
              }
            />

            <input
              type="date"
              value={formData.application_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  application_date: e.target.value,
                })
              }
              required
            />

            {/* Optional Follow-up Date */}
            <div className="form-field">
              <label htmlFor="follow-up-date">
                Follow-up Date (Optional)
              </label>

              <input
                id="follow-up-date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    follow_up_date: e.target.value,
                  })
                }
              />
            </div>

            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value,
                })
              }
            >
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>

            <textarea
              placeholder="Job Description"
              value={formData.job_description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  job_description: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
            />

            <button type="submit">
              {editingId !== null
                ? 'Update Application'
                : 'Save Application'}
            </button>
          </form>
        )}

        {/* Summary Cards */}
        <section className="stats-container">

          <div className="stat-card">
            <h3>Total Applications</h3>
            <p>{applications.length}</p>
          </div>

          <div className="stat-card">
            <h3>Interviews</h3>
            <p>
              {applications.filter(
                (app) => app.status === 'Interview'
              ).length}
            </p>
          </div>

          <div className="stat-card">
            <h3>Offers</h3>
            <p>
              {applications.filter(
                (app) => app.status === 'Offer'
              ).length}
            </p>
          </div>

          <div className="stat-card">
            <h3>Rejected</h3>
            <p>
              {applications.filter(
                (app) => app.status === 'Rejected'
              ).length}
            </p>
          </div>
        </section>

        {/* Follow-up Reminders */}
        <section className="reminders-section">
          <h2>Follow-up Reminders</h2>

          <p className="reminders-description">
            Keep track of applications that need your attention.
          </p>

          {reminderApplications.length === 0 ? (
            <p className="no-reminders">
              No follow-ups scheduled. You're all caught up!
            </p>
          ) : (
            <div className="reminders-list">
              {reminderApplications.map((app) => (
                <div
                  className={`reminder-item reminder-${app.reminderStatus}`}
                  key={app.id}
                >
                  <div className="reminder-details">
                    <h3>{app.job_title}</h3>

                    <p>{app.company_name}</p>

                    <p className="reminder-date">
                      Follow-up date: {app.follow_up_date}
                    </p>
                  </div>

                  <div className="reminder-actions">
                    <span
                      className={`reminder-badge reminder-badge-${app.reminderStatus}`}
                    >
                      {app.reminderStatus === 'overdue'
                        ? 'Overdue'
                        : app.reminderStatus === 'today'
                          ? 'Due Today'
                          : 'Upcoming'}
                    </span>

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEdit(app)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Application Analytics */}
        <section className="analytics-section">
          <h2>Application Analytics</h2>

          <p className="analytics-description">
            Here's a breakdown of your job application progress.
          </p>

          <div className="analytics-list">
            {statusSummary.map((item) => (
              <div className="analytics-item" key={item.status}>
                <div className="analytics-heading">
                  <span>{item.status}</span>
                  <span>
                    {item.count} ({item.percentage}%)
                  </span>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill progress-${item.status.toLowerCase()}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Applications Section */}
        <section
          className="applications-section"
          id="applications"
        >
          <h2>Recent Applications</h2>

          {/* Search, Filter and Sorting Controls */}
          <div className="filter-controls">

            <input
              type="text"
              className="search-input"
              placeholder="Search by company or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Rejected">Rejected</option>
              <option value="Offer">Offer</option>
            </select>

            <select
              className="sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

          </div>

          {/* Application List */}
          {sortedApplications.length === 0 ? (
            <p>
              {searchTerm.trim() || statusFilter !== 'All'
                ? 'No matching applications found.'
                : 'No applications found. Add your first application!'}
            </p>
          ) : (
            <div className="application-list">

              {sortedApplications.map((app) => (

                <div
                  className="application-item"
                  key={app.id}
                >

                  {/* Application details */}
                  <div className="application-details">
                    <h3>{app.job_title}</h3>

                    <p className="company-name">
                      {app.company_name}
                    </p>

                    <p className="application-location">
                      {app.location || 'Location not specified'}
                    </p>

                    <p className="application-date">
                      Applied: {app.application_date}
                    </p>
                  </div>

                  {/* Status and action buttons */}
                  <div className="application-actions">

                    <span
                      className={`status-badge status-${app.status.toLowerCase()}`}
                    >
                      {app.status}
                    </span>

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEdit(app)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(app.id)}
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default App;
