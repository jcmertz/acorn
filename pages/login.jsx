
import React, { useState } from 'react';
import { useAuth } from '../src/AuthContext';  // Import the AuthContext

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { isAuthenticated } = useAuth();  // Access isAuthenticated from the context

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      fetch('/login/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
        .then((response) => {
          if (response.ok) {
            window.location = '/index';
          } else {
            alert('Login failed');
          }
        })
        .catch((error) => {
          console.error('Error during login:', error);
        });
    }
  };

  return (
    <div>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit}>
        <label>Username: <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default SignIn;
