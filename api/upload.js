import formidable from 'formidable';
import { readFile } from 'fs/promises';
import { supabase } from './_lib/supabase.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable();
  let files;
  try {
    [, files] = await form.parse(req);
  } catch {
    return res.status(400).json({ error: '解析上傳失敗' });
  }

  const file = files.image?.[0];
  if (!file) return res.status(400).json({ error: '沒有上傳檔案' });

  const ext = file.originalFilename?.match(/\.[^.]+$/)?.[0] || '';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const buffer = await readFile(file.filepath);

  const { error } = await supabase.storage
    .from('images')
    .upload(filename, buffer, { contentType: file.mimetype });

  if (error) return res.status(500).json({ error: '上傳失敗' });

  const { data } = supabase.storage.from('images').getPublicUrl(filename);
  return res.json({ url: data.publicUrl, filename });
}
