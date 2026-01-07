"use client";

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';

interface EditProductProps {
  params: Promise<{ id: string }>
}

interface DBProduct {
  id: string;
  title: string;
  description: string;
  images: string[] | null;
  tags: string[] | null;
  features: string[] | null;
  requirements: string[] | null;
  base_price: number | null;
  creator_id: string;
  slug: string;
  auto_message?: string | null;
  auto_message_enabled?: boolean | null;
}

export default function EditProductPage({ params }: EditProductProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [autoMessageEnabled, setAutoMessageEnabled] = useState(false);
  const [autoMessage, setAutoMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) { router.push('/auth/login'); return; }
        setCurrentUserId(user.id);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        if (error || !data) { router.push(`/product/${id}`); return; }
        if (data.creator_id !== user.id) { router.push(`/product/${id}`); return; }
        setProduct(data as DBProduct);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPrice(data.base_price?.toString() || '');
        setTags((data.tags || []).join(', '));
        setAutoMessageEnabled(Boolean(data.auto_message_enabled));
        setAutoMessage(data.auto_message || '');
        setImages((data.images || []).filter(Boolean));
      } catch (e) {
        console.warn('Load edit product failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const uploadImages = async (slug: string, creatorId: string, files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      try {
        const ext = (file.name.split('.').pop()||'jpg').toLowerCase();
        const stamp = Date.now();
        const rand = Math.random().toString(36).slice(2,8);
        const path = `${creatorId}/${slug}/img-${stamp}-${rand}.${ext}`;
        const bucketsToTry = ['product-images','product-covers','covers'];
        let uploaded: string | undefined;
        for (const b of bucketsToTry) {
          const { error: upErr } = await supabase.storage.from(b).upload(path, file, { upsert: true });
          if (!upErr) { uploaded = b; break; }
        }
        if (uploaded) {
          const { data: pub } = supabase.storage.from(uploaded).getPublicUrl(path);
          urls.push(`${pub.publicUrl}?v=${stamp}`);
        }
      } catch (e) {
        console.warn('Upload image failed', e);
      }
    }
    return urls;
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages(prev => {
      const arr = [...prev];
      const j = index + dir;
      if (j < 0 || j >= arr.length) return arr;
      const t = arr[index];
      arr[index] = arr[j];
      arr[j] = t;
      return arr;
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    if (!product || saving) return;
    const parsedPrice = Number(price.trim() || 0);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      alert('Please enter a valid price.');
      return;
    }
    setSaving(true);
    try {
      const addUrls = await uploadImages(product.slug, product.creator_id, newFiles);
      const finalImages = [...images, ...addUrls].filter(Boolean);
      const parsedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const payload: Partial<DBProduct> = {
        title,
        description,
        base_price: parsedPrice,
        tags: parsedTags,
        images: finalImages,
        auto_message_enabled: autoMessageEnabled,
        auto_message: autoMessageEnabled ? autoMessage : null
      };
      const { error, data } = await supabase
        .from('products')
        .update(payload)
        .eq('id', product.id)
        .eq('creator_id', product.creator_id)
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('No product updated');
      setImages(finalImages);
      setNewFiles([]);
      router.push(`/product/${product.id}`);
    } catch (e) {
      console.error('Save product failed', e);
      const message = e instanceof Error && e.message ? e.message : 'Failed to save changes';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!product || currentUserId !== product.creator_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Not authorized</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
          <button onClick={()=>router.push(`/product/${product.id}`)} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Back</button>
        </div>
        <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea 
              value={description} 
              onChange={e=>setDescription(e.target.value)} 
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm h-28 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-colors" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Base Price</label>
              <input 
                value={price} 
                onChange={e=>setPrice(e.target.value)} 
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tags (comma)</label>
              <input 
                value={tags} 
                onChange={e=>setTags(e.target.value)} 
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-colors" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Images</label>
            {images.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">No images yet.</div>
            ) : (
              <ul className="space-y-2">
                {images.map((url, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 border dark:border-gray-600 rounded-md px-2 py-1 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={url} alt="img" className="w-14 h-10 object-cover rounded bg-gray-200 dark:bg-gray-600" />
                      <span className="text-xs truncate text-gray-600 dark:text-gray-300">{url}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={idx===0} onClick={()=>moveImage(idx, -1)} className="text-[11px] px-2 py-0.5 border dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Up</button>
                      <button type="button" disabled={idx===images.length-1} onClick={()=>moveImage(idx, 1)} className="text-[11px] px-2 py-0.5 border dark:border-gray-600 rounded disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Down</button>
                      <button type="button" onClick={()=>removeImage(idx)} className="text-[11px] px-2 py-0.5 border dark:border-gray-600 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Add Images</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={e=>{
                const files = Array.from(e.target.files||[]);
                setNewFiles(prev=>[...prev, ...files]);
              }} 
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900/30 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
              "
            />
            {newFiles.length>0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">New files selected: {newFiles.length}</div>
            )}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoMessageEnabled}
                onChange={(e)=>setAutoMessageEnabled(e.target.checked)}
                className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <span>
                Enable automated welcome message after purchase
                <span className="block text-xs text-gray-500 dark:text-gray-400">If enabled, buyers receive this message immediately after placing an order.</span>
              </span>
            </label>
            {autoMessageEnabled && (
              <textarea
                value={autoMessage}
                onChange={(e)=>setAutoMessage(e.target.value)}
                rows={4}
                className="mt-3 w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-colors"
                placeholder="Thanks so much for your order! Here's everything you need to know to get started..."
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={()=>router.push(`/product/${product.id}`)} className="px-4 py-2 text-sm rounded border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button onClick={onSave} disabled={saving} className="px-5 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{saving? 'Saving…':'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
