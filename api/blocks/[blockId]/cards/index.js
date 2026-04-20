import { supabase } from '../../../../api/_lib/supabase.js';

export default async function handler(req, res) {
  const { blockId } = req.query;

  if (req.method !== 'POST') return res.status(405).end();

  const { data: block, error: fetchErr } = await supabase
    .from('blocks')
    .select('cards')
    .eq('id', blockId)
    .single();

  if (fetchErr) return res.status(404).json({ error: '找不到區塊' });

  const newCard = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };

  const updatedCards = [...(block.cards || []), newCard];

  const { error } = await supabase
    .from('blocks')
    .update({ cards: updatedCards, updated_at: new Date().toISOString() })
    .eq('id', blockId);

  if (error) return res.status(500).json({ error: '建立卡片失敗' });

  return res.status(201).json(newCard);
}
