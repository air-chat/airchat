import { supabase } from '../utils/supabaseClient'; // ваш шлях до конфігу supabase

export const createDriverAsAdmin = async (driverData) => {
  // Викликаємо нашу Edge Function
  const { data, error } = await supabase.functions.invoke('admin-create-driver', {
    body: driverData,
  });

  if (error) {
    console.error("Помилка при створенні водія:", error);
    throw new Error(error.message || "Не вдалося створити водія");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
};