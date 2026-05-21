import React, { useEffect, useState } from 'react';
import { Plus, Loader, Lock, X } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { Mascot } from './Mascot';

interface User {
  id: number;
  name: string;
  avatar: string;
  has_pin: boolean;
  last_active: string | null;
}

interface ProfilePickerProps {
  onSelect: (userId: number) => void;
}

export const ProfilePicker: React.FC<ProfilePickerProps> = ({ onSelect }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stavy pro "Přidat profil" modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('👨');
  const [newPin, setNewPin] = useState('');
  const [adding, setAdding] = useState(false);

  // Stavy pro "Odemknout profil" modal
  const [unlockUser, setUnlockUser] = useState<User | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const avatars = ['👨', '👩', '👦', '👧', '👨‍🦱', '👩‍🦱', '👱‍♂️', '👱‍♀️', '👨‍🦰', '👩‍🦰', '🧔', '👵', '👴', '🐶', '🐱'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/api/users');
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    if (user.has_pin) {
      setUnlockUser(user);
      setEnteredPin('');
      setPinError(false);
    } else {
      onSelect(user.id);
    }
  };

  const handleUnlock = async () => {
    if (!unlockUser || enteredPin.length !== 4) return;
    
    setUnlocking(true);
    setPinError(false);
    
    try {
      await apiFetch(`/api/users/${unlockUser.id}/verify-pin`, {
        method: 'POST',
        body: JSON.stringify({ pin: enteredPin })
      });
      // Sukces
      onSelect(unlockUser.id);
    } catch (e) {
      setPinError(true);
      setEnteredPin('');
    } finally {
      setUnlocking(false);
    }
  };

  const handleAddProfile = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const user = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ 
          name: newName, 
          avatar: newAvatar,
          pin: newPin.length === 4 ? newPin : null
        })
      });
      setUsers(prev => [...prev, user]);
      setShowAdd(false);
      setNewName('');
      setNewPin('');
    } catch (e) {
      alert('Chyba při vytváření profilu');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <Loader className="spin" size={32} color="var(--green-500)" />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      backgroundColor: 'var(--bg)', alignItems: 'center',
      padding: 'max(40px, env(safe-area-inset-top)) 20px 40px',
      overflowY: 'auto'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <Mascot state="happy" size={50} />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Italo</h1>
      </div>
      
      <p style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 40, fontWeight: 500 }}>
        Kdo se jde učit?
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 500
      }}>
        
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user)}
            className="animate-pop"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '24px 12px',
              backgroundColor: 'var(--surface)',
              borderRadius: 20,
              border: '2px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{
              width: 70, height: 70, borderRadius: '50%',
              backgroundColor: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, marginBottom: 12
            }}>
              {user.avatar}
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {user.name}
            </span>
            {user.has_pin && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                color: 'var(--text-3)'
              }}>
                <Lock size={14} />
              </div>
            )}
          </button>
        ))}

        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px 12px',
            backgroundColor: 'transparent',
            borderRadius: 20,
            border: '2px dashed var(--border-2)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: 148
          }}
        >
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', marginBottom: 12
          }}>
            <Plus size={24} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>
            Nový profil
          </span>
        </button>

      </div>

      {/* MODAL: Zadat PIN */}
      {unlockUser && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="animate-pop" style={{
            backgroundColor: 'var(--surface)', borderRadius: 24, padding: 30,
            width: '100%', maxWidth: 320, position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <button
              onClick={() => setUnlockUser(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{unlockUser.avatar}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Zadej PIN</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>{unlockUser.name}</p>
            
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              value={enteredPin}
              onChange={e => setEnteredPin(e.target.value)}
              placeholder="••••"
              disabled={unlocking}
              style={{
                width: 120, textAlign: 'center', letterSpacing: 8,
                fontSize: 24, padding: '12px', borderRadius: 12,
                border: `2px solid ${pinError ? 'var(--wrong-border)' : 'var(--border)'}`,
                backgroundColor: pinError ? 'var(--wrong-bg)' : 'var(--bg)',
                color: 'var(--text)', outline: 'none', marginBottom: 20
              }}
            />

            <button
              className="btn btn-primary"
              disabled={enteredPin.length !== 4 || unlocking}
              onClick={handleUnlock}
              style={{ width: '100%' }}
            >
              {unlocking ? 'Ověřuji...' : 'Odemknout'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Přidat profil */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="animate-pop" style={{
            backgroundColor: 'var(--surface)', borderRadius: 24, padding: 24,
            width: '100%', maxWidth: 360, position: 'relative'
          }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Nový profil</h2>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Avatar</label>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                {avatars.map(a => (
                  <button
                    key={a}
                    onClick={() => setNewAvatar(a)}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      border: newAvatar === a ? '2px solid var(--green-500)' : '2px solid transparent',
                      backgroundColor: 'var(--surface-2)', fontSize: 20,
                      cursor: 'pointer', transition: 'all 0.1s'
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Jméno</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Např. Leonardo"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: '2px solid var(--border)', backgroundColor: 'var(--bg)',
                  color: 'var(--text)', fontSize: 15, outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>PIN (volitelné)</label>
              <input
                type="number"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value.slice(0,4))}
                placeholder="4 číslice"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: '2px solid var(--border)', backgroundColor: 'var(--bg)',
                  color: 'var(--text)', fontSize: 15, outline: 'none'
                }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Pokud nevyplníš, profil nebude chráněn heslem.</p>
            </div>

            <button
              className="btn btn-primary"
              disabled={!newName.trim() || adding}
              onClick={handleAddProfile}
              style={{ width: '100%' }}
            >
              {adding ? 'Vytvářím...' : 'Vytvořit profil'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
