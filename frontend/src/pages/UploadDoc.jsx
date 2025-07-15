import React, { useState } from 'react';
import axios from 'axios';

const UploadDocument = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')); 
  const isAdmin = user && user.role === 'admin';
  if (!isAdmin) {
    return <p>You must be an admin to upload documents.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const createDocRes = await axios.post('/api/documents', { title }, { withCredentials: true });
      const documentId = createDocRes.data._id;

      const formData = new FormData();
      formData.append('file', file); // field must match 'file' below

      const uploadRes = await axios.post(`/api/documents/${documentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      alert('Upload successful!');
      console.log(uploadRes.data);
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      alert(`Upload failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept=".pdf"
      />
      <button type="submit">Upload</button>
    </form>
  );
};

export default UploadDocument;
