import client from './client';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

