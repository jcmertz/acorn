
import React from 'react';
import { AuthProvider } from '../src/AuthContext';  // Import the AuthProvider

const MyApp = ({ Component, pageProps }) => {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
};

export default MyApp;
