import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => (await client.get('/users/me/profile')).data,
    enabled: !!user
  });

  const [profileForm, setProfileForm] = useState({
    username: '',
    phone: '',
    address: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        username: profile.username || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data) => client.put('/users/me', data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Refresh user data in auth context
      try {
        const { data: userData } = await client.get('/users/me');
        const storedUser = JSON.parse(localStorage.getItem('ff_user') || '{}');
        const updatedUser = { ...storedUser, ...userData };
        localStorage.setItem('ff_user', JSON.stringify(updatedUser));
        window.location.reload(); // Reload to update auth context
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
      alert('Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.error || 'Failed to update profile. Please try again.');
    }
  });

  const changePassword = useMutation({
    mutationFn: (data) => client.put('/users/me/password', data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    },
    onError: (error) => {
      console.error('Error changing password:', error);
      alert(error.response?.data?.error || 'Failed to change password. Please check your current password.');
    }
  });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateProfile.mutate(profileForm);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const deleteAccount = useMutation({
    mutationFn: () => client.delete('/users/me'),
    onSuccess: () => {
      alert('Your account has been deleted');
      logout();
      navigate('/');
    },
    onError: (error) => {
      console.error('Error deleting account:', error);
      alert(error.response?.data?.error || 'Failed to delete account. Please try again.');
    }
  });

  const handleDeleteAccount = () => {
    const confirm1 = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirm1) return;
    const confirm2 = window.prompt('Type "DELETE" to confirm account deletion:');
    if (confirm2 === 'DELETE') {
      deleteAccount.mutate();
    } else {
      alert('Account deletion cancelled');
    }
  };

  if (!user) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Please login to access settings</h3>
          <button onClick={() => navigate('/login')} style={{ marginTop: '1rem' }}>
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="content">
      <h2>Settings</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'profile' ? '#16a34a' : '#e2e8f0',
            color: activeTab === 'profile' ? 'white' : '#0f172a',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: activeTab === 'profile' ? 'bold' : 'normal'
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'password' ? '#16a34a' : '#e2e8f0',
            color: activeTab === 'password' ? 'white' : '#0f172a',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: activeTab === 'password' ? 'bold' : 'normal'
          }}
        >
          Change Password
        </button>
        <button
          onClick={() => setActiveTab('danger')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'danger' ? '#fee2e2' : '#e2e8f0',
            color: activeTab === 'danger' ? '#b91c1c' : '#0f172a',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: activeTab === 'danger' ? 'bold' : 'normal'
          }}
        >
          Danger Zone
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Edit Profile</h3>
          <form onSubmit={handleProfileUpdate}>
            <label>
              <strong>Username *</strong>
              <input
                type="text"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                placeholder="Enter username"
                required
                minLength={3}
                maxLength={50}
              />
            </label>

            <label>
              <strong>Email</strong>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <small style={{ color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                Email cannot be changed
              </small>
            </label>

            <label>
              <strong>Phone</strong>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </label>

            <label>
              <strong>Address</strong>
              <textarea
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="Enter your address"
                rows={3}
              />
            </label>

            <label>
              <strong>User Type</strong>
              <input
                type="text"
                value={profile?.userType || ''}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed', textTransform: 'capitalize' }}
              />
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setProfileForm({
                  username: profile?.username || '',
                  phone: profile?.phone || '',
                  address: profile?.address || ''
                })}
                style={{ background: '#e2e8f0', color: '#0f172a' }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <label>
              <strong>Current Password *</strong>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
                required
              />
            </label>

            <label>
              <strong>New Password *</strong>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password (min. 6 characters)"
                required
                minLength={6}
              />
            </label>

            <label>
              <strong>Confirm New Password *</strong>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </label>

            {passwordForm.newPassword && passwordForm.confirmPassword && 
             passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p style={{ color: '#b91c1c', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
                Passwords do not match
              </p>
            )}

            <button type="submit" disabled={changePassword.isPending || passwordForm.newPassword !== passwordForm.confirmPassword}>
              {changePassword.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'danger' && (
        <div className="card" style={{ border: '2px solid #fee2e2' }}>
          <h3 style={{ marginTop: 0, color: '#b91c1c' }}>Danger Zone</h3>
          <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: 8, marginBottom: '1rem' }}>
            <h4 style={{ color: '#b91c1c', marginTop: 0 }}>Delete Account</h4>
            <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteAccount.isPending}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: 8,
                cursor: deleteAccount.isPending ? 'not-allowed' : 'pointer',
                opacity: deleteAccount.isPending ? 0.6 : 1
              }}
            >
              {deleteAccount.isPending ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default SettingsPage;

