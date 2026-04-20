import formidable from 'formidable';
import { readFile } from 'fs/promises';
import { supabase } from './_lib/supabase.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ uploadDir: '/tmp', keepExtensions: true });
  let files;
  try {
    [, files] = await form.parse(req);
  } catch (e) {
    return res.status(400).json({ error: '解析上傳失敗', detail: e.message });
  }

  const file = files.image?.[0];
  if (!file) return res.status(400).json({ error: '沒有上傳檔案', keys: Object.keys(files) });

  const ext = file.originalFilename?.match(/\.[^.]+$/)?.[0] || '';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  let buffer;
  try {
    buffer = await readFile(file.filepath);
  } catch (e) {
    return res.status(500).json({ error: '讀取暫存檔失敗', detail: e.message });
  }

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filename, buffer, { contentType: file.mimetype });

  if (uploadError) return res.status(500).json({ error: '上傳至 Storage 失敗', detail: uploadError.message });

  const { data } = supabase.storage.from('images').getPublicUrl(filename);
  return res.json({ url: data.publicUrl, filename });
}
