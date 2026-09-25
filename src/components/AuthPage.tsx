import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Loader2, Mail, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const { login, signup } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, fullName);
        setVerificationSent(true);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Traduci gli errori Firebase in italiano
      let errorMessage = 'Si è verificato un errore';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Questa email è già registrata. Prova ad accedere.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email non valida';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'La password deve essere di almeno 6 caratteri';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Email o password non corretti';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Credenziali non valide. Controlla email e password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Troppi tentativi. Riprova più tardi.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth?.currentUser) return;
    
    try {
      await sendEmailVerification(auth.currentUser);
      setError('');
      alert('Email di verifica inviata! Controlla la tua casella di posta.');
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('Impossibile inviare l\'email. Riprova tra qualche minuto.');
    }
  };

  // Se l'utente si è appena registrato ma non ha verificato l'email
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Registrazione completata!</h2>
              <p className="text-gray-500 mt-2">
                Ti abbiamo inviato un'email di verifica a:<br />
                <strong className="text-gray-700">{email}</strong>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Cosa fare ora:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Controlla la tua casella email</li>
                    <li>Clicca sul link di verifica</li>
                    <li>Torna qui e accedi</li>
                  </ol>
                  <p className="mt-2 text-xs text-blue-600">
                    💡 Se non trovi l'email, controlla nello spam
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                📧 Invia di nuovo l'email
              </button>
              
              <button
                onClick={() => { setIsLogin(true); setVerificationSent(false); }}
                className="w-full text-sm text-gray-500 hover:text-black transition py-2"
              >
                Ho già verificato → Accedi
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Notion Clone</h1>
          <p className="text-gray-500 mt-2">Spazio di lavoro collaborativo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">
            {isLogin ? 'Accedi al tuo workspace' : 'Crea un nuovo account'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                  placeholder="Mario Rossi"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                placeholder="tu@esempio.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Accedi' : 'Registrati'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-gray-500 hover:text-black transition"
            >
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Firebase + Vercel
        </p>
      </motion.div>
    </div>
  );
}
