import './App.css'

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <h2 className="logo">Eugene<span>.</span></h2>

        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <main>
        <section className="hero" id="home">
          <p className="intro">HELLO, I'M</p>
          <h1>Eugene, a Software Developer in Progress.</h1>
          <p className="hero-description">
            I build practical web applications and enjoy solving
            problems through code.
          </p>

          <a href="#projects" className="primary-button">
            Explore My Work
          </a>
        </section>

        <section className="section" id="about">
          <h2>About Me</h2>
          <p>
            I am a Computer Science student passionate about
            software development, problem-solving and building
            useful digital solutions.
          </p>
        </section>

        <section className="section" id="skills">
          <h2>Technical Skills</h2>
          <div className="skills-list">
            <span>Python</span>
            <span>Java</span>
            <span>JavaScript</span>
            <span>HTML</span>
            <span>CSS</span>
            <span>React</span>
          </div>
        </section>

        <section className="section" id="projects">
  <h2>My Projects</h2>

  <p className="projects-intro">
    Here are the projects I'm developing as I grow
    my software engineering skills.
  </p>

  <div className="projects-grid">

    <div className="project-card">
      <p className="project-status">In progress</p>
      <h3>Developer Portfolio</h3>
      <p>
        A personal website showcasing my technical
        skills, background and software projects.
      </p>
      <div className="project-tech">
        <span>React</span>
        <span>JavaScript</span>
        <span>CSS</span>
      </div>
    </div>

    <div className="project-card">
      <p className="project-status">Planned</p>
      <h3>Job Application Tracker</h3>
      <p>
        A web application for organising job
        applications and tracking application progress.
      </p>
      <div className="project-tech">
        <span>React</span>
        <span>Python</span>
        <span>PostgreSQL</span>
      </div>
    </div>

    <div className="project-card">
      <p className="project-status">Planned</p>
      <h3>Student Management System</h3>
      <p>
        An application designed to manage student
        records and academic information.
      </p>
      <div className="project-tech">
        <span>React</span>
        <span>Django</span>
        <span>PostgreSQL</span>
      </div>
    </div>

  </div>
</section>

        <section className="section" id="contact">
          <h2>Contact Me</h2>
          <p>Interested in working together? Get in touch.</p>
          <a href="mailto:your-email@example.com">
            Send me an email
          </a>
        </section>
      </main>

      <footer>
        <p>© 2026 Eugene. Built with React.</p>
      </footer>
    </div>
  )
}

export default App