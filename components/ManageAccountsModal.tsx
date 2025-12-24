
import React, { useState, useEffect } from 'react';
import { StoredUser, ChatMessage } from '../types';
import { getUserHistory } from '../services/memoryService';

interface ManageAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BlockIcon = () => (
    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);


const ManageAccountsModal: React.FC<ManageAccountsModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<StoredUser | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const fetchUsers = () => {
      const allUsersRaw = localStorage.getItem('nexa_all_users');
      const allUsers = allUsersRaw ? JSON.parse(allUsersRaw) : [];
      setUsers(allUsers);
  }

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Reset selection when modal opens
      setSelectedUser(null);
      setChatHistory([]);
    }
  }, [isOpen]);

  const handleUserSelect = (user: StoredUser) => {
    setSelectedUser(user);
    const history = getUserHistory(user.mobile);
    setChatHistory(history);
  };

  const handleToggleBlock = (mobile: string) => {
    const allUsersRaw = localStorage.getItem('nexa_all_users');
    let allUsers: StoredUser[] = allUsersRaw ? JSON.parse(allUsersRaw) : [];
    
    allUsers = allUsers.map(u => {
      if (u.mobile === mobile) {
        return { ...u, blocked: !u.blocked };
      }
      return u;
    });

    localStorage.setItem('nexa_all_users', JSON.stringify(allUsers));
    fetchUsers(); // Refresh user list from storage
    
    // Also update the selected user if it's the one being modified
    if (selectedUser && selectedUser.mobile === mobile) {
      setSelectedUser(prev => prev ? { ...prev, blocked: !prev.blocked } : null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] animate-fade-in p-4 sm:p-8">
      <div className="w-full max-w-5xl h-[90vh] bg-black/80 border-2 border-nexa-cyan/50 rounded-lg shadow-[0_0_30px_rgba(41,223,255,0.3)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-nexa-cyan/20 shrink-0">
          <h2 className="text-nexa-cyan text-base sm:text-lg font-mono tracking-wider">MANAGE USER ACCOUNTS</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-3xl">&times;</button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* User List */}
          <div className="w-1/3 border-r border-nexa-cyan/20 overflow-y-auto no-scrollbar">
            <div className="p-2 space-y-1">
              {users.length > 0 ? (
                users.map(user => (
                  <button
                    key={user.mobile}
                    onClick={() => handleUserSelect(user)}
                    className={`w-full text-left p-3 rounded transition-colors text-sm font-mono flex justify-between items-center ${selectedUser?.mobile === user.mobile ? 'bg-nexa-cyan/20' : 'hover:bg-zinc-800'}`}
                  >
                    <div>
                        <p className={`font-bold truncate ${user.blocked ? 'text-red-500' : 'text-zinc-300'}`}>{user.name}</p>
                        <p className="text-xs opacity-60">{user.mobile}</p>
                    </div>
                    {user.blocked && <BlockIcon />}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500 text-sm font-mono">NO USER LOGS FOUND</div>
              )}
            </div>
          </div>

          {/* Chat History */}
          <div className="w-2/3 flex flex-col">
            <div className="p-4 border-b border-nexa-cyan/20 shrink-0 flex justify-between items-center">
              {selectedUser ? (
                <>
                    <h3 className="text-white font-mono text-sm sm:text-base">Conversation Log: <span className={selectedUser.blocked ? 'text-red-500' : 'text-nexa-yellow'}>{selectedUser.name}</span></h3>
                    <button
                        onClick={() => handleToggleBlock(selectedUser.mobile)}
                        className={`px-3 py-1 text-xs font-mono border rounded ${selectedUser.blocked ? 'bg-green-500/10 border-green-500 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20'}`}
                    >
                        {selectedUser.blocked ? 'UNBLOCK' : 'BLOCK'} USER
                    </button>
                </>
              ) : (
                <h3 className="text-zinc-500 font-mono text-sm sm:text-base">Select a user to view their history...</h3>
              )}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              {selectedUser && chatHistory.length > 0 ? (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg font-mono text-sm ${msg.role === 'user' ? 'bg-nexa-blue/10 text-zinc-300' : 'bg-nexa-cyan/10 text-zinc-300'}`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-xs mt-2 opacity-50 text-right ${msg.role === 'user' ? 'text-nexa-blue' : 'text-nexa-cyan'}`}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                 selectedUser && <div className="p-4 text-center text-zinc-500 text-sm font-mono">NO CHAT HISTORY FOR THIS USER</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAccountsModal;