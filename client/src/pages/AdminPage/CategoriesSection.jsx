import React, { useEffect, useState } from 'react';
import { categoriesService } from '../../services/categoriesService';
import editIcon from '../../assets/vector/Edit.svg';
import addIcon from '../../assets/vector/add.svg';
import checkIcon from '../../assets/vector/check.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './CategoriesSection.module.css';

const InlineInput = ({ value, onChange, onConfirm, onCancel, placeholder }) => (
  <span className={styles.inlineForm}>
    <input
      className={styles.inlineInput}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
      onKeyDown={(e) => {
        if (e.key === 'Enter') onConfirm();
        if (e.key === 'Escape') onCancel();
      }}
    />
    <button type="button" className={styles.inlineConfirm} onClick={onConfirm}><img src={checkIcon} alt="Подтвердить" /></button>
    <button type="button" className={styles.inlineCancel} onClick={onCancel}>✕</button>
  </span>
);

const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showCreateRoot, setShowCreateRoot] = useState(false);
  const [newRootName, setNewRootName] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const [addingSubTo, setAddingSubTo] = useState(null);
  const [newSubName, setNewSubName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  const load = async () => {
    try {
      const res = await categoriesService.getAllCategories();
      setCategories(res.data.categories || []);
      setTotal(res.data.count || 0);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreateRoot = async () => {
    if (!newRootName.trim()) return;
    try {
      await categoriesService.createCategory({ name: newRootName.trim() });
      setNewRootName('');
      setShowCreateRoot(false);
      load();
    } catch { /* ignore */ }
  };

  const handleCreateSub = async (parentId) => {
    if (!newSubName.trim()) return;
    try {
      await categoriesService.createCategory({ name: newSubName.trim(), parent_id: parentId });
      setNewSubName('');
      setAddingSubTo(null);
      load();
    } catch { /* ignore */ }
  };

  const startEdit = (id, name) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) return;
    try {
      await categoriesService.updateCategory(editingId, { name: editingName.trim() });
      setEditingId(null);
      load();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Удалить «${name}» и все её подкатегории?`)) return;
    try {
      await categoriesService.deleteCategory(id);
      load();
    } catch (err) {
      showError(err.response?.data?.error || 'Не удалось удалить категорию');
    }
  };

  if (loading) return <p className={styles.loadingText}>Загрузка...</p>;

  return (
    <div className={styles.wrapper}>
      {/* Счётчик */}
      <p className={styles.totalText}>Всего: {total}</p>

      {/* Создать категорию */}
      <div style={{ marginTop: 70 }}>
        {showCreateRoot ? (
          <InlineInput
            value={newRootName}
            onChange={setNewRootName}
            onConfirm={handleCreateRoot}
            onCancel={() => { setShowCreateRoot(false); setNewRootName(''); }}
            placeholder="Название категории"
          />
        ) : (
          <button
            type="button"
            className={styles.createButton}
            onClick={() => setShowCreateRoot(true)}
          >
            Создать категорию
          </button>
        )}
      </div>

      <hr className={styles.divider} style={{ marginTop: 30 }} />

      {/* Список категорий */}
      <div style={{ marginTop: 70 }}>
        {categories.map((cat) => (
          <div key={cat.id} className={styles.categoryBlock}>

            {/* Строка категории */}
            <div className={styles.row}>
              <span className={styles.categoryName}>
                {editingId === cat.id ? (
                  <InlineInput
                    value={editingName}
                    onChange={setEditingName}
                    onConfirm={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                ) : cat.name}
              </span>
              <span className={styles.actions}>
                <button type="button" className={styles.iconBtn} onClick={() => startEdit(cat.id, cat.name)}>
                  <img src={editIcon} alt="Редактировать" className={styles.icon} />
                </button>
                <button type="button" className={styles.iconBtn} onClick={() => handleDelete(cat.id, cat.name)}>
                  <span className={styles.deleteIcon}>—</span>
                </button>
              </span>
            </div>

            {/* Подкатегории */}
            <div className={styles.subcategories}>
              {(cat.children || []).map((sub) => (
                <div key={sub.id} className={styles.row}>
                  <span className={styles.subName}>
                    {editingId === sub.id ? (
                      <InlineInput
                        value={editingName}
                        onChange={setEditingName}
                        onConfirm={handleSaveEdit}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : sub.name}
                  </span>
                  <span className={styles.actions}>
                    <button type="button" className={styles.iconBtn} onClick={() => startEdit(sub.id, sub.name)}>
                      <img src={editIcon} alt="Редактировать" className={styles.icon} />
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={() => handleDelete(sub.id, sub.name)}>
                      <span className={styles.deleteIcon}>—</span>
                    </button>
                  </span>
                </div>
              ))}

              {/* Добавить подкатегорию */}
              <div className={styles.addSubRow}>
                {addingSubTo === cat.id ? (
                  <InlineInput
                    value={newSubName}
                    onChange={setNewSubName}
                    onConfirm={() => handleCreateSub(cat.id)}
                    onCancel={() => { setAddingSubTo(null); setNewSubName(''); }}
                    placeholder="Название подкатегории"
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => { setAddingSubTo(cat.id); setNewSubName(''); }}
                  >
                    <img src={addIcon} alt="Добавить подкатегорию" className={styles.iconAdd} />
                  </button>
                )}
              </div>
            </div>

            <hr className={styles.divider} style={{ marginTop: 30 }} />
          </div>
        ))}
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

export default CategoriesSection;
