import React, { useState } from 'react';
import { createDriverAsAdmin } from '../services/api'; // Шлях до функції з Кроку 2

export default function AdminCreateDriverForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    carMake: '',
    carPlate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createDriverAsAdmin({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        carMake: formData.carMake,
        carPlate: formData.carPlate
      });
      
      alert('Водія успішно створено! Він може заходити в додаток.');
      if (onSuccess) onSuccess(); // Наприклад, оновити список користувачів
      
      // Очищення форми
      setFormData({ email: '', password: '', fullName: '', phone: '', carMake: '', carPlate: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Реєстрація нового водія</h2>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <input 
        required name="email" type="email" placeholder="Email водія" 
        value={formData.email} onChange={handleChange} 
        className="border p-2 rounded"
      />
      <input 
        required name="password" type="text" placeholder="Пароль для входу" 
        value={formData.password} onChange={handleChange} 
        className="border p-2 rounded"
      />
      <input 
        required name="fullName" type="text" placeholder="ПІБ водія" 
        value={formData.fullName} onChange={handleChange} 
        className="border p-2 rounded"
      />
      <input 
        name="phone" type="text" placeholder="Телефон" 
        value={formData.phone} onChange={handleChange} 
        className="border p-2 rounded"
      />
      
      <div className="flex gap-2">
        <input 
          name="carMake" type="text" placeholder="Марка авто (напр. Toyota)" 
          value={formData.carMake} onChange={handleChange} 
          className="border p-2 rounded w-1/2"
        />
        <input 
          name="carPlate" type="text" placeholder="Номери (напр. AA1234BB)" 
          value={formData.carPlate} onChange={handleChange} 
          className="border p-2 rounded w-1/2"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Створення...' : 'Зареєструвати водія'}
      </button>
    </form>
  );
}