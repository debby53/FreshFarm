import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const MessagesPage = () => {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', farmerId],
    queryFn: async () => {
      if (farmerId) {
        return (await client.get(`/messages/farmer/${farmerId}`)).data;
      }
      return (await client.get('/messages')).data;
    },
    enabled: !!user,
    refetchInterval: 5000 // Poll every 5 seconds for new messages
  });

  const sendMessage = useMutation({
    mutationFn: (content) => {
      if (farmerId) {
        return client.post('/messages', { receiverId: farmerId, content });
      }
      throw new Error('Farmer ID required');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', farmerId] });
      setMessageText('');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessage.mutate(messageText.trim());
  };

  if (!user) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Please login to view messages</h3>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading messages...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Messages</h2>
        <button onClick={() => navigate(-1)} style={{ background: '#e2e8f0' }}>
          Back
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isSender = message.senderId === user.id;
              return (
                <div
                  key={message.messageId}
                  style={{
                    display: 'flex',
                    justifyContent: isSender ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      background: isSender ? '#2563eb' : '#e2e8f0',
                      color: isSender ? 'white' : '#0f172a'
                    }}
                  >
                    <p style={{ margin: 0, wordBreak: 'break-word' }}>{message.content}</p>
                    <small style={{ display: 'block', marginTop: '0.25rem', opacity: 0.7, fontSize: '0.75rem' }}>
                      {new Date(message.sentDate).toLocaleString()}
                    </small>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {farmerId && (
          <form onSubmit={handleSend} style={{ borderTop: '1px solid #e2e8f0', padding: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sendMessage.isPending}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {sendMessage.isPending ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default MessagesPage;

