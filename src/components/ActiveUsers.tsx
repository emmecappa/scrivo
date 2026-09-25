import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function ActiveUsers() {
  const { activeUsers, user, currentPageId } = useStore();

  // Filter out current user and users not on the same page
  const otherUsersOnPage = activeUsers.filter(
    u => u.userId !== user?.id && u.pageId === currentPageId
  );

  const otherUsersOnOtherPages = activeUsers.filter(
    u => u.userId !== user?.id && u.pageId !== currentPageId
  );

  if (activeUsers.length <= 1) return null; // Only current user

  return (
    <div className="flex items-center gap-2">
      {/* Users on same page */}
      {otherUsersOnPage.length > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {otherUsersOnPage.slice(0, 5).map((activeUser) => (
              <motion.div
                key={activeUser.userId}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                style={{ backgroundColor: activeUser.color }}
                title={`${activeUser.fullName || activeUser.email} - Sta guardando questa pagina`}
              >
                {activeUser.fullName ? activeUser.fullName.charAt(0).toUpperCase() : activeUser.email.charAt(0).toUpperCase()}
              </motion.div>
            ))}
          </div>
          
          {otherUsersOnPage.length > 5 && (
            <span className="text-xs text-gray-500 ml-1">
              +{otherUsersOnPage.length - 5}
            </span>
          )}
          
          <span className="text-xs text-gray-500 ml-1">
            su questa pagina
          </span>
        </div>
      )}

      {/* Users on other pages */}
      {otherUsersOnOtherPages.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Users className="w-3.5 h-3.5" />
          <span>
            {otherUsersOnOtherPages.length} {otherUsersOnOtherPages.length === 1 ? 'persona' : 'persone'} attive
          </span>
        </div>
      )}
    </div>
  );
}
