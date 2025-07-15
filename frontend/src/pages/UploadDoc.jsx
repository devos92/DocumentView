import React , { useState } from 'react';
import axios from 'axios';
import { json } from 'react-router-dom';




const UploadDocument = () => {

    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const user = JSON.parse(localStorage.getItem('user')); 
    const isAdmin = user && user.role === 'admin'; // Check if the user is an admin
    if (!isAdmin) {
    return <p className="text-center mt-8 text-red-600">You must be an admin to upload documents.</p>;
}

   const handleSubmit = async (e) => {
  e.preventDefault();

  if (!file || !title || !description) {
    alert('Please fill in all fields and select a file.');
    return;
  }

  try {
    // 1️⃣ Create the document entry first (MongoDB)
    const createDocRes = await axios.post(
      '/api/documents',
      { title, description },
      { withCredentials: true }
    );
    const documentId = createDocRes.data._id; // Grab the ID of the new document

    
    const formData = new FormData();
    formData.append('file', file); // key must match multer array('file', 5)

    const uploadRes = await axios.post(
      `/api/documents/${documentId}`, // Use that document ID here
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      }
    );

    alert('Upload successful!');
    console.log(uploadRes.data);
  } catch (err) {
    console.error(err);
    alert('Upload failed');
  }
};

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Upload Document</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full mb-4"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Upload
        </button>
      </form>
    </div>
  );
};

export default UploadDocument;
    