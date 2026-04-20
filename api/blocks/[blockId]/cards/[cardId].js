import { supabase } from '../../../../api/_lib/supabase.js';

export default async function handler(req, res) {
  const { blockId, cardId } = req.query;

  const { data: block, error: fetchErr } = await supabase
    .from('blocks')
    .select('cards')
    .eq('id', blockId)
    .single();

  if (fetchErr) return res.status(404).json({ error: '找不到區塊' });

  const cards = block.cards || [];

  if (req.method === 'PUT') {
    const idx = cards.findIndex(c => c.id === cardId);
    if (idx === -1) return res.status(404).json({ error: '找不到卡片' });

    cards[idx] = {
      ...cards[idx],
      ...req.body,
      id: cardId,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('blocks')
      .update({ cards, updated_at: new Date().toISOString() })
      .eq('id', blockId);

    if (error) return res.status(500).json({ error: '更新卡片失敗' });

    return res.json(cards[idx]);
  }

  if (req.method === 'DELETE') {
    const updated = cards.filter(c => c.id !== cardId);

    const { error } = await supabase
      .from('blocks')
      .update({ cards: updated, updated_at: new Date().toISOString() })
      .eq('id', blockId);

    if (error) return res.status(500).json({ error: '刪除卡片失敗' });

    return res.json({ message: '刪除成功' });
  }

  res.status(405).end();
}
