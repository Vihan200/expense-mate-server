let currentToken = null;

const setToken = (token) => {
  if (!token) return false;
  currentToken = token;
  return true;
};

const getToken = () => {
  return currentToken;
};

const clearToken = () => {
  currentToken = null;
};

module.exports = {
  setToken,
  getToken,
  clearToken
};