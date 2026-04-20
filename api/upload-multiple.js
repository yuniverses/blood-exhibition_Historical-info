import formidable from 'formidable';
import { readFile } from 'fs/promises';
import { supabase } from './_lib/supabase.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ multiples: true });
  let files;
  try {
    [, files] = await form.parse(req);
  } catch {
    return res.status(400).json({ error: '解析上傳失敗' });
  }

  const fileList = files.images || [];
  if (!fileList.length) return res.status(400).json({ error: '沒有上傳檔案' });

  const results = await Promise.all(
    fileList.map(async (file) => {
      const ext = file.originalFilename?.match(/\.[^.]+$/)?.[0] || '';
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const buffer = await readFile(file.filepath);

      await supabase.storage
        .from('images')
        .upload(filename, buffer, { contentType: file.mimetype });

      const { data } = supabase.storage.from('images').getPublicUrl(filename);
      return { url: data.publicUrl, filename };
    })
  );

  return res.json({ images: results });
}
