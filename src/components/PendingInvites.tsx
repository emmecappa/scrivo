import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function PendingInvites() {
  const { pendingInvites, acceptInvitation, declineInvitation } = useStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (pendingInvites.length === 0) return null;

  const handleAccept = async (inviteId: string) => {
    setLoadingId(inviteId);
    try {
      await acceptInvitation(inviteId);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('Errore durante l\'accettazione dell\'invito');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    if (!confirm('Sei sicuro di voler rifiutare questo invito?')) return;
    
    setLoadingId(inviteId);
    try {
      await declineInvitation(inviteId);
    } catch (err) {
      console.error('Error declining invitation:', err);
      alert('Errore durante il rifiuto dell\'invito');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">
          Inviti in attesa ({pendingInvites.length})
        </h3>
      </div>
      
      <div className="space-y-2">
        {pendingInvites.map((invite) => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-lg p-3 border border-blue-100"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">
                {invite.workspace_icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {invite.workspace_name}
                </p>
                <p className="text-sm text-gray-500">
                  Invitato come{' '}
                  <span className="font-medium text-gray-700">
                    {invite.role === 'editor' ? 'Editor' : 'Visualizzatore'}
                  </span>
                </p>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDecline(invite.id)}
                  disabled={loadingId === invite.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  title="Rifiuta"
                >
                  {loadingId === invite.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
                
                <button
                  onClick={() => handleAccept(invite.id)}
                  disabled={loadingId === invite.id}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1"
                >
                  {loadingId === invite.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Accetto
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Accetto
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
