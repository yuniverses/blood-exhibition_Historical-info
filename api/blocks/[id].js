import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: '找不到區塊' });

    return res.json({
      id: data.id,
      title: data.title,
      cards: data.cards,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  if (req.method === 'PUT') {
    const { data, error } = await supabase
      .from('blocks')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: '更新區塊失敗' });

    return res.json({
      id: data.id,
      title: data.title,
      cards: data.cards,
      updatedAt: data.updated_at,
    });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('blocks').delete().eq('id', id);
    if (error) return res.status(500).json({ error: '刪除區塊失敗' });
    return res.json({ message: '刪除成功' });
  }

  res.status(405).end();
}
