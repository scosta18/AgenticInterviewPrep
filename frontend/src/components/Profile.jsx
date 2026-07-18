import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getSessions } from '../api/client'

export default function Profile({ user, onSignOut }) {
    console.log('Profile user:', user)  // add this
    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [])

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (!error) setProfile(data)
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const res = await getSessions()
      const sessions = res.data
      const completed = sessions.filter(s => s.completed)
      setStats({
        total: sessions.length,
        completed: completed.length,
        behavioral: sessions.filter(s => s.session_type !== 'coding').length,
        coding: sessions.filter(s => s.session_type === 'coding').length,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    onSignOut()
  }

  const initial = (user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">My Account</h1>

      {/* Profile card */}
      <div className="bg-dark-700 border border-dark-600 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl">
            {initial}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              {user.user_metadata?.full_name || 'No name set'}
            </p>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded mt-1 inline-block ${
              profile?.account_type === 'recruiter'
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-purple-500/10 text-purple-400'
            }`}>
              {profile?.account_type === 'recruiter' ? '🏢 Recruiter' : '🎯 Candidate'}
            </span>
          </div>
        </div>

        {profile?.account_type === 'recruiter' && !profile?.is_approved && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3">
            <p className="text-yellow-400 text-sm">
              ⚠️ Your recruiter account is pending approval. You'll be notified once activated.
            </p>
          </div>
        )}

        <div className="border-t border-dark-600 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Member since</span>
            <span className="text-white text-sm">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Account type</span>
            <span className="text-white text-sm capitalize">{profile?.account_type || 'candidate'}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-dark-700 border border-dark-600 rounded-2xl p-6">
          <h2 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-4">Session Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-900 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold font-mono text-white">{stats.total}</p>
              <p className="text-slate-500 text-xs mt-1">Total Sessions</p>
            </div>
            <div className="bg-dark-900 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold font-mono text-green-400">{stats.completed}</p>
              <p className="text-slate-500 text-xs mt-1">Completed</p>
            </div>
            <div className="bg-dark-900 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold font-mono text-purple-400">{stats.behavioral}</p>
              <p className="text-slate-500 text-xs mt-1">Behavioral</p>
            </div>
            <div className="bg-dark-900 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold font-mono text-blue-400">{stats.coding}</p>
              <p className="text-slate-500 text-xs mt-1">Coding</p>
            </div>
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-dark-700 hover:bg-red-500/10 border border-dark-600 hover:border-red-500/30 text-slate-400 hover:text-red-400 font-medium py-3 rounded-lg transition-colors text-sm"
      >
        Sign Out
      </button>
    </div>
  )
}