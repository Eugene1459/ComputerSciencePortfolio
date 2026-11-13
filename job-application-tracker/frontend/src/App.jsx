import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  // Reference to the application form for automatic scrolling
  const formRef = useRef(null);

  // Controls whether the application form is visible
  const [showForm, setShowForm] = useState(false);

  // Stores errors when loading, saving, updating or deleting
  const [error, setError] = useState('');

  // Stores the ID of the application currently being edited
  const [editingId, setEditingId] = useState(null);

  // Stores the information entered into the form
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

  // Resets the form to its initial state
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

  // Fetch applications from the Django backend
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/applications/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }

        return response.json();
      })
      .then(data => {
        setApplications(data);
      })
      .catch(error => {
        console.error('Error fetching applications:', error);
        setError('Could not load applications. Please try again.');
      });
  }, []);

  // Automatically scroll to the form when it opens
  // or when an application is selected for editing
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [showForm, editingId]);

  // Opens the form with the selected application's information
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

  // Adds a new application or updates an existing one
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEditing = editingId !== null;

    const url = isEditing
      ? `http://127.0.0.1:8000/api/applications/${editingId}/`
      : 'http://127.0.0.1:8000/api/applications/';

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          follow_up_date: formData.follow_up_date || null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          isEditing
            ? 'Failed to update application'
            : 'Failed to save application'
        );
      }

      const savedApplication = await response.json();

      if (isEditing) {
        // Replace the old application with the updated one
        setApplications(previous =>
          previous.map(app =>
            app.id === editingId ? savedApplication : app
          )
        );
      } else {
        // Add the new application to the beginning of the list
        setApplications(previous => [
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

  // Deletes an application after user confirmation
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this application?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/applications/${id}/`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      // Remove the deleted application from the list
      setApplications(previous =>
        previous.filter(app => app.id !== id)
      );

      // Close the form if the deleted application was being edited
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

  // Closes the form and clears any existing form data
  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Search and filter applications
  const filteredApplications = applications.filter(app => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      app.company_name.toLowerCase().includes(search) ||
      app.job_title.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === 'All' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort applications by application date
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const dateA = new Date(a.application_date);
    const dateB = new Date(b.application_date);

    if (sortOrder === 'newest') {
      return dateB - dateA;
    }

    return dateA - dateB;
  });
    // Get today's date using the user's local calendar date
  const today = (() => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  })();

  // Find applications that need follow-up
  const reminderApplications = applications
    .filter(app =>
      ['Applied', 'Interview'].includes(app.status) &&
      app.follow_up_date
    )
    .map(app => {
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

  // Calculate application statistics for the analytics section
  const statusSummary = ['Applied', 'Interview', 'Offer', 'Rejected'].map(status => {
    const count = applications.filter(
      app => app.status === status
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
                app => app.status === 'Interview'
              ).length}
            </p>
          </div>

          <div className="stat-card">
            <h3>Offers</h3>
            <p>
              {applications.filter(
                app => app.status === 'Offer'
              ).length}
            </p>
          </div>

          <div className="stat-card">
            <h3>Rejected</h3>
            <p>
              {applications.filter(
                app => app.status === 'Rejected'
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
              {reminderApplications.map(app => (
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
            {statusSummary.map(item => (
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

              {sortedApplications.map(app => (

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
