import React, { useState } from 'react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    bandName: '',
    contactEmail: '',
    homeTown: '',
    genre: '',
    instagram: '@',
  });
  const [invalidUsername, setInvalidUsername] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission (replace with actual fetch or axios POST request)
    fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (response.status === 409) {
          // Username conflict, show error
          setInvalidUsername(true);
        } else if (response.ok) {
          // Registration successful, redirect or handle accordingly
          console.log('Registration successful');
        }
      })
      .catch((error) => {
        console.error('Error registering user:', error);
      });
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <section>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            autoComplete="username"
            required
          />
        </section>
        <section>
          <label htmlFor="new-password">Password</label>
          <input
            id="new-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            autoComplete="new-password"
            required
          />
        </section>
        <section>
          <label htmlFor="bandName">Band Name</label>
          <input
            id="bandName"
            name="bandName"
            type="text"
            value={formData.bandName}
            onChange={handleInputChange}
            required
          />
        </section>
        <section>
          <label htmlFor="contactEmail">Contact Email</label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleInputChange}
            required
          />
        </section>
        <section>
          <label htmlFor="homeTown">Where is your band based?</label>
          <input
            id="homeTown"
            name="homeTown"
            type="text"
            value={formData.homeTown}
            onChange={handleInputChange}
          />
        </section>
        <section>
          <label htmlFor="genre">What genre do you identify with?</label>
          <input
            id="genre"
            name="genre"
            type="text"
            value={formData.genre}
            onChange={handleInputChange}
          />
        </section>
        <section>
          <label htmlFor="instagram">Instagram</label>
          <input
            id="instagram"
            name="instagram"
            type="text"
            value={formData.instagram}
            onChange={handleInputChange}
          />
        </section>
        <button type="submit">Register</button>
      </form>

      {invalidUsername && (
        <div>
          <p style={{ color: 'red' }}>This Username is Already Taken</p>
        </div>
      )}
    </div>
  );
};

export default Register;
