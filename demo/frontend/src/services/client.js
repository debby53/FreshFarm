import axios from 'axios';

const client = axios.create({
  baseURL: '/api'
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ff_token');
      localStorage.removeItem('ff_user');
    }
    return Promise.reject(error);
  }
);

export default client;

