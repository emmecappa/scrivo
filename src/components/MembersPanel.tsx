import { useState } from 'react';
import { useStore, WorkspaceMember } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserPlus,
  Crown,
  Edit2,
  Eye,
  Trash2,
  Mail,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';

export default function MembersPanel() {
  const { 
    members, 
    user, 
    workspace, 
    showMembersPanel, 
    toggleMembersPanel,
    inviteMember,
    updateMemberRole,
    removeMember,
  } = useStore();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isOwner = currentUserMember?.role === 'owner';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await inviteMember(inviteEmail, inviteRole);
      setSuccess(`Invito inviato a ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'invito');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: 'owner' | 'editor' | 'viewer') => {
    try {
      await updateMemberRole(memberId, role);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'aggiornamento del ruolo');
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Sei sicuro di voler rimuovere ${memberEmail} dal workspace?`)) return;
    
    try {
      await removeMember(memberId);
    } catch (err: any) {
      setError(err.message || 'Errore durante la rimozione');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'editor':
        return <Edit2 className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietario';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Visualizzatore';
      default:
        return role;
    }
  };

  if (!showMembersPanel) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">Membri del Workspace</h2>
            <button
              onClick={toggleMembersPanel}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {workspace?.name} • {members.length} {members.length === 1 ? 'membro' : 'membri'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Invite form */}
          {isOwner && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invita un membro
              </h3>
              
              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition text-sm"
                    placeholder="collega@esempio.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ruolo
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition text-sm"
                  >
                    <option value="editor">Editor - Può modificare</option>
                    <option value="viewer">Visualizzatore - Solo lettura</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Invio...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Invia invito
                    </>
                  )}
                </button>
              </form>
              
              {error && (
                <div className="mt-3 bg-red-50 text-red-600 p-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mt-3 bg-green-50 text-green-600 p-2 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {success}
                </div>
              )}
            </div>
          )}

          {/* Members list */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">
              Membri ({members.length})
            </h3>
            
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {member.full_name ? member.full_name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {member.full_name || member.email}
                        </span>
                        {member.status === 'invited' && (
                          <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            In attesa
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 truncate mb-2">
                        {member.email}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <span className="text-xs text-gray-600">
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {isOwner && member.user_id !== user?.id && (
                      <div className="flex items-center gap-1">
                        {member.status === 'active' && (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-black"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}
                        
                        <button
                          onClick={() => handleRemove(member.id, member.email)}
                          className="p-1.5 hover:bg-red-50 rounded transition"
                          title="Rimuovi membro"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          {!isOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 Solo il proprietario del workspace può invitare nuovi membri e gestire i ruoli.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
