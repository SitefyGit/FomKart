'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react'

type Announcement = {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement>>({
    type: 'info',
    is_active: true
  })
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaveLoading(true)
    try {
      if (currentAnnouncement.id) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: currentAnnouncement.title,
            content: currentAnnouncement.content,
            type: currentAnnouncement.type,
            is_active: currentAnnouncement.is_active,
            start_date: currentAnnouncement.start_date,
            end_date: currentAnnouncement.end_date
          })
          .eq('id', currentAnnouncement.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([{
            title: currentAnnouncement.title,
            content: currentAnnouncement.content,
            type: currentAnnouncement.type,
            is_active: currentAnnouncement.is_active,
            start_date: currentAnnouncement.start_date,
            end_date: currentAnnouncement.end_date,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }])
        if (error) throw error
      }
      
      await fetchAnnouncements()
      setIsEditing(false)
      setCurrentAnnouncement({ type: 'info', is_active: true })
    } catch (error) {
      console.error('Failed to save announcement:', error)
      alert('Failed to save announcement')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAnnouncements(announcements.filter(a => a.id !== id))
    } catch (error) {
      console.error('Failed to delete announcement:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system-wide announcements and banners</p>
        </div>
        <button
          onClick={() => {
            setCurrentAnnouncement({ type: 'info', is_active: true })
            setIsEditing(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1
                      ${announcement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    `}>
                      {announcement.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                      ${announcement.type === 'info' ? 'bg-blue-100 text-blue-800' :
                        announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        announcement.type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }
                    `}>
                      {announcement.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {announcement.content}
                  </p>
                  
                  {(announcement.start_date || announcement.end_date) && (
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      {announcement.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Starts: {new Date(announcement.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {announcement.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Ends: {new Date(announcement.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentAnnouncement(announcement)
                      setIsEditing(true)
                    }}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentAnnouncement.id ? 'Edit Announcement' : 'New Announcement'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={currentAnnouncement.title || ''}
                  onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={currentAnnouncement.content || ''}
                  onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={currentAnnouncement.type}
                    onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentAnnouncement.is_active}
                      onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, is_active: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={currentAnnouncement.start_date ? new Date(currentAnnouncement.start_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={currentAnnouncement.end_date ? new Date(currentAnnouncement.end_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
