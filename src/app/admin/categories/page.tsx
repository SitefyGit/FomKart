'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Save,
  X,
  Loader2,
  Eye,
  EyeOff,
  Star,
  Search,
  FolderTree
} from 'lucide-react'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  icon: string | null
  parent_id: string | null
  is_active: boolean
  is_featured: boolean
  sort_order: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  children?: Category[]
}

type CategoryForm = {
  name: string
  slug: string
  description: string
  image_url: string
  icon: string
  parent_id: string
  is_active: boolean
  is_featured: boolean
  meta_title: string
  meta_description: string
}

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  icon: '',
  parent_id: '',
  is_active: true,
  is_featured: false,
  meta_title: '',
  meta_description: ''
}

// Lucide icons that can be used for categories
const availableIcons = [
  'Briefcase', 'Code', 'Palette', 'PenTool', 'Video', 'Music', 
  'Camera', 'Mic', 'FileText', 'BarChart', 'TrendingUp', 'ShoppingBag',
  'Gift', 'Heart', 'Star', 'Zap', 'Globe', 'Smartphone', 'Monitor',
  'BookOpen', 'GraduationCap', 'Lightbulb', 'Target', 'Users'
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      // Organize into tree structure
      const categoryMap = new Map<string, Category>()
      const rootCategories: Category[] = []

      data?.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] })
      })

      data?.forEach(cat => {
        const category = categoryMap.get(cat.id)!
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          categoryMap.get(cat.parent_id)!.children!.push(category)
        } else {
          rootCategories.push(category)
        }
      })

      setCategories(rootCategories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const categoryData = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        image_url: form.image_url || null,
        icon: form.icon || null,
        parent_id: form.parent_id || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null
      }

      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData)

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchCategories()
    } catch (error: any) {
      console.error('Failed to save category:', error)
      alert(error.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      icon: category.icon || '',
      parent_id: category.parent_id || '',
      is_active: category.is_active,
      is_featured: category.is_featured || false,
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || ''
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setDeleteConfirm(null)
      fetchCategories()
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      alert(error.message || 'Failed to delete category')
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const toggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) throw error
      fetchCategories()
    } catch (error) {
      console.error('Failed to toggle category:', error)
    }
  }

  const toggleFeatured = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_featured: !category.is_featured })
        .eq('id', category.id)

      if (error) throw error
      fetchCategories()
    } catch (error) {
      console.error('Failed to toggle featured:', error)
    }
  }

  // Flatten categories for parent selection (excluding current and descendants)
  const getParentOptions = (excludeId?: string): Category[] => {
    const flatten = (cats: Category[], depth = 0): Category[] => {
      return cats.flatMap(cat => {
        if (cat.id === excludeId) return []
        return [{ ...cat, name: '—'.repeat(depth) + ' ' + cat.name }, ...flatten(cat.children || [], depth + 1)]
      })
    }
    return flatten(categories)
  }

  const filterCategories = (cats: Category[]): Category[] => {
    if (!searchQuery) return cats
    return cats.filter(cat => {
      const matches = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
      const childMatches = cat.children && filterCategories(cat.children).length > 0
      return matches || childMatches
    }).map(cat => ({
      ...cat,
      children: cat.children ? filterCategories(cat.children) : []
    }))
  }

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedIds.has(category.id)

    return (
      <div key={category.id}>
        <div 
          className={`
            flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
            ${depth > 0 ? 'ml-6' : ''}
            ${!category.is_active ? 'opacity-60' : ''}
          `}
        >
          {/* Drag handle */}
          <button className="p-1 cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Expand/collapse */}
          {hasChildren ? (
            <button 
              onClick={() => toggleExpanded(category.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Image */}
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {category.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={category.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <FolderTree className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
              {category.is_featured && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">/{category.slug}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleActive(category)}
              className={`p-2 rounded-lg transition-colors ${
                category.is_active 
                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={category.is_active ? 'Active' : 'Inactive'}
            >
              {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => toggleFeatured(category)}
              className={`p-2 rounded-lg transition-colors ${
                category.is_featured 
                  ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={category.is_featured ? 'Featured' : 'Not featured'}
            >
              <Star className={`w-4 h-4 ${category.is_featured ? 'fill-yellow-500' : ''}`} />
            </button>
            <button
              onClick={() => handleEdit(category)}
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {deleteConfirm === category.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(category.id)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your marketplace categories</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {filterCategories(categories).length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <FolderTree className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No categories yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first category to organize products</p>
            <button
              onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        ) : (
          filterCategories(categories).map(cat => renderCategory(cat))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Digital Marketing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="digital-marketing"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description of this category..."
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Category
                </label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">None (Root category)</option>
                  {getParentOptions(editingId || undefined).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {form.image_url && (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon Name (Lucide)
                </label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">None</option>
                  {availableIcons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              {/* SEO Fields */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">SEO Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={form.meta_title}
                      onChange={(e) => setForm(prev => ({ ...prev, meta_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="SEO title for this category"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      value={form.meta_description}
                      onChange={(e) => setForm(prev => ({ ...prev, meta_description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="SEO description for search engines..."
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Featured on homepage</span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {editingId ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
