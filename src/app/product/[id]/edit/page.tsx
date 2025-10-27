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
    setSaving(true);
    try {
      const addUrls = await uploadImages(product.slug, product.creator_id, newFiles);
      const finalImages = [...images, ...addUrls];
      const payload: Partial<DBProduct> = {
        title,
        description,
        base_price: price ? Number(price) : 0,
        tags: tags.split(',').map(t=>t.trim()).filter(Boolean) as any,
        images: finalImages as any,
        auto_message_enabled: autoMessageEnabled,
        auto_message: autoMessageEnabled ? autoMessage : null
      };
      const { error } = await supabase.from('products').update(payload).eq('id', product.id);
      if (error) throw error;
      router.push(`/product/${product.id}`);
    } catch (e) {
      console.error('Save product failed', e);
      alert('Failed to save changes');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <button onClick={()=>router.push(`/product/${product.id}`)} className="text-sm text-gray-600 hover:underline">Back</button>
        </div>
        <div className="space-y-4 bg-white p-6 rounded-xl border">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm h-28" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Base Price</label>
              <input value={price} onChange={e=>setPrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma)</label>
              <input value={tags} onChange={e=>setTags(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Images</label>
            {images.length === 0 ? (
              <div className="text-xs text-gray-500">No images yet.</div>
            ) : (
              <ul className="space-y-2">
                {images.map((url, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2 border rounded-md px-2 py-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={url} alt="img" className="w-14 h-10 object-cover rounded" />
                      <span className="text-xs truncate">{url}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={idx===0} onClick={()=>moveImage(idx, -1)} className="text-[11px] px-2 py-0.5 border rounded disabled:opacity-50">Up</button>
                      <button type="button" disabled={idx===images.length-1} onClick={()=>moveImage(idx, 1)} className="text-[11px] px-2 py-0.5 border rounded disabled:opacity-50">Down</button>
                      <button type="button" onClick={()=>removeImage(idx)} className="text-[11px] px-2 py-0.5 border rounded text-red-600">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Add Images</label>
            <input type="file" accept="image/*" multiple onChange={e=>{
              const files = Array.from(e.target.files||[]);
              setNewFiles(prev=>[...prev, ...files]);
            }} />
            {newFiles.length>0 && (
              <div className="text-xs text-gray-600 mt-1">New files selected: {newFiles.length}</div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoMessageEnabled}
                onChange={(e)=>setAutoMessageEnabled(e.target.checked)}
                className="mt-1 h-4 w-4 text-emerald-600 border-gray-300 rounded"
              />
              <span>
                Enable automated welcome message after purchase
                <span className="block text-xs text-gray-500">If enabled, buyers receive this message immediately after placing an order.</span>
              </span>
            </label>
            {autoMessageEnabled && (
              <textarea
                value={autoMessage}
                onChange={(e)=>setAutoMessage(e.target.value)}
                rows={4}
                className="mt-3 w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Thanks so much for your order! Here's everything you need to know to get started..."
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={()=>router.push(`/product/${product.id}`)} className="px-4 py-2 text-sm rounded border">Cancel</button>
            <button onClick={onSave} disabled={saving} className="px-5 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50">{saving? 'Saving…':'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
