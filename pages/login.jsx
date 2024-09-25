import React, { useState } from 'react';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Handle form submission logic, for example, with fetch or axios
    fetch('/login/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        // Handle response
        if (response.ok) {
          console.log('Login successful');
          window.location = '/index';
        } else {
          console.error('Login failed');
        }
      })
      .catch((error) => {
        console.error('Error during login:', error);
      });
  };

  return (
    <div>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <section>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </section>
        <section>
          <label htmlFor="current-password">Password</label>
          <input
            id="current-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </section>
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
};

export default SignIn;
