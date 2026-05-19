import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import downIcon from '../../assets/vector/down.svg';
import checkIcon from '../../assets/vector/check.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './UsersSection.module.css';

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [confirm, setConfirm] = useState(null); // { userId, type: 'role'|'block', newValue }

  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  const load = () => {
    adminService.getUsers(100)
      .then((res) => {
        setUsers(res.data.users || []);
        setTotal(res.data.pagination?.total ?? res.data.users?.length ?? 0);
      })
      .catch(() => showError('Не удалось загрузить пользователей'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setEditingId(null);
      setConfirm(null);
    } else {
      setExpandedId(id);
      setEditingId(null);
      setConfirm(null);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditData({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '' });
    setExpandedId(user.id);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (userId) => {
    try {
      await adminService.updateUser(userId, editData);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...editData } : u));
      setEditingId(null);
    } catch {
      showError('Ошибка сохранения данных');
    }
  };

  const handleRoleClick = (user, newRole) => {
    if (user.role === newRole) return;
    setConfirm({ userId: user.id, type: 'role', newValue: newRole, email: user.email });
  };

  const handleBlockClick = (user) => {
    const isBlocked = !user.is_active || user.is_active === 0;
    setConfirm({
      userId: user.id,
      type: isBlocked ? 'unblock' : 'block',
      email: user.email,
    });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'role') {
        await adminService.updateUserRole(confirm.userId, confirm.newValue);
        setUsers((prev) => prev.map((u) => u.id === confirm.userId ? { ...u, role: confirm.newValue } : u));
      } else if (confirm.type === 'block') {
        await adminService.toggleUserStatus(confirm.userId, false);
        setUsers((prev) => prev.map((u) => u.id === confirm.userId ? { ...u, is_active: 0 } : u));
      } else if (confirm.type === 'unblock') {
        await adminService.toggleUserStatus(confirm.userId, true);
        setUsers((prev) => prev.map((u) => u.id === confirm.userId ? { ...u, is_active: 1 } : u));
      }
    } catch {
      showError('Ошибка выполнения операции');
    }
    setConfirm(null);
  };

  if (loading) return <p className={styles.loadingText}>Загрузка...</p>;

  return (
    <div>
      <p className={styles.totalText}>Всего: {total}</p>

      <div className={styles.list}>
        {users.map((user) => {
          const isExpanded = expandedId === user.id;
          const isEditing = editingId === user.id;
          const isConfirming = confirm?.userId === user.id;

          return (
            <div key={user.id} className={styles.userBlock}>
              {/* Header row */}
              <div className={styles.headerRow}>
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => toggleExpand(user.id)}
                >
                  <img
                    src={downIcon}
                    alt=""
                    className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
                  />
                  <span className={styles.email}>{user.email}</span>
                  {(user.is_active === 0 || user.is_active === false) && (
                    <span className={styles.blockedLabel}>заблокирован</span>
                  )}
                </button>

                <div className={styles.actions}>
                  {/* Role toggle */}
                  <div className={styles.roleToggle}>
                    <button
                      type="button"
                      className={`${styles.roleBtn} ${user.role === 'USER' ? styles.roleBtnActive : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleRoleClick(user, 'USER'); }}
                    >
                      User
                    </button>
                    <button
                      type="button"
                      className={`${styles.roleBtn} ${user.role === 'ADMIN' ? styles.roleBtnActive : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleRoleClick(user, 'ADMIN'); }}
                    >
                      Admin
                    </button>
                  </div>

                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); startEdit(user); }}
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleBlockClick(user); }}
                  >
                    {(user.is_active === 0 || user.is_active === false) ? 'Разблокировать' : 'Заблокировать'}
                  </button>
                </div>
              </div>

              {/* Inline confirm */}
              {isConfirming && (
                <div className={styles.confirmRow}>
                  <span className={styles.confirmText}>
                    {confirm.type === 'role'
                      ? `Изменить роль пользователя ${confirm.email} на ${confirm.newValue}?`
                      : confirm.type === 'block'
                      ? `Заблокировать пользователя ${confirm.email}?`
                      : `Разблокировать пользователя ${confirm.email}?`}
                  </span>
                  <button type="button" className={styles.confirmYes} onClick={handleConfirm}>Подтвердить</button>
                  <button type="button" className={styles.confirmNo} onClick={() => setConfirm(null)}>Отмена</button>
                </div>
              )}

              {/* Accordion body */}
              {isExpanded && (
                <div className={styles.details}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailLabels}>
                      <span className={styles.detailLabel}>id:</span>
                      <span className={styles.detailLabel}>фамилия:</span>
                      <span className={styles.detailLabel}>имя:</span>
                      <span className={styles.detailLabel}>телефон:</span>
                      <span className={styles.detailLabel}>создан:</span>
                    </div>

                    <div className={styles.detailValues}>
                      <span className={styles.detailValue}>{user.id}</span>

                      {isEditing ? (
                        <>
                          <input
                            className={styles.editInput}
                            value={editData.last_name}
                            onChange={(e) => setEditData((p) => ({ ...p, last_name: e.target.value }))}
                          />
                          <input
                            className={styles.editInput}
                            value={editData.first_name}
                            onChange={(e) => setEditData((p) => ({ ...p, first_name: e.target.value }))}
                          />
                          <input
                            className={styles.editInput}
                            value={editData.phone}
                            onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))}
                          />
                        </>
                      ) : (
                        <>
                          <span className={styles.detailValue}>{user.last_name || '—'}</span>
                          <span className={styles.detailValue}>{user.first_name || '—'}</span>
                          <span className={styles.detailValue}>{user.phone || '—'}</span>
                        </>
                      )}

                      <span className={styles.detailValue}>{formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  {isEditing && (
                    <div className={styles.editActions}>
                      <button type="button" className={styles.editConfirm} onClick={() => saveEdit(user.id)}><img src={checkIcon} alt="Подтвердить" /></button>
                      <button type="button" className={styles.editCancel} onClick={cancelEdit}>✕</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className={styles.errorToast}>
          <img src={errorIcon} alt="" className={styles.errorIcon} />
          <p className={styles.errorLine}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
};

export default UsersSection;
