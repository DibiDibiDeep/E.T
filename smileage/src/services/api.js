import axios from 'axios';

const API_URL = 'http://localhost:8000/infer/';

export const uploadImage = async (imageData) => {
  return axios.post(API_URL, { image: imageData });
};
