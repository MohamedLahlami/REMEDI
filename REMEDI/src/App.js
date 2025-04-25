import React, { useEffect, useState } from 'react';
import './App.css';
import LoginRegisterTabs from './components/LoginRegisterTabs';
import { auth } from './firebase/firebase';
import UserHome from './components/UserHome';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      {user ? <UserHome /> : <LoginRegisterTabs />}
    </>
  );
}

export default App;