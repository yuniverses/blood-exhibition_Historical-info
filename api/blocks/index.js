import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: '讀取資料失敗', detail: error.message, code: error.code });

    return res.json(data.map(b => ({
      id: b.id,
      title: b.title,
      cards: b.cards,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    })));
  }

  if (req.method === 'POST') {
    const id = Date.now().toString();
    const { title } = req.body;

    const { data, error } = await supabase
      .from('blocks')
      .insert({ id, title, cards: [] })
      .select()
      .single();

    if (error) return res.status(500).json({ error: '建立區塊失敗' });

    return res.status(201).json({
      id: data.id,
      title: data.title,
      cards: data.cards,
      createdAt: data.created_at,
    });
  }

  res.status(405).end();
}
