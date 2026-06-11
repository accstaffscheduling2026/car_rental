import { createContext, useContext, useState, useEffect } from 'react';
import { userMe, userLogin, userRegister, userLogout } from '../utils/api.js';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userMe()
      .then(r => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const r = await userLogin({ email, password });
    setUser(r.data);
    return r.data;
  }

  async function register(name, email, phone, password) {
    const r = await userRegister({ name, email, phone, password });
    setUser(r.data);
    return r.data;
  }

  async function logout() {
    await userLogout().catch(() => {});
    setUser(null);
  }

  function updateUser(updated) {
    setUser(updated);
  }

  return (
    <UserAuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  return useContext(UserAuthContext);
}
