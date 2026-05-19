import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesService } from '../../services/categoriesService';
import { productsService } from '../../services/productsService';
import downIcon from '../../assets/vector/down.svg';
import addIcon from '../../assets/vector/add.svg';
import checkIcon from '../../assets/vector/check.svg';
import errorIcon from '../../assets/vector/error.svg';
import styles from './ProductForm.module.css';

const FIXED_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/* ── Generic dropdown ── */
const Dropdown = ({ label, options, value, onChange, multiple, allowAdd, placeholder = 'Не выбрано', hasError }) => {
  const [open, setOpen] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newVal, setNewVal] = useState('');
  const [extraOptions, setExtraOptions] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setAddingNew(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allOptions = [...options, ...extraOptions];
  const displayValue = multiple
    ? (value.length > 0 ? value.join(', ') : placeholder)
    : (value || placeholder);

  const handleConfirmAdd = () => {
    const trimmed = newVal.trim();
    if (!trimmed) return;
    if (!allOptions.includes(trimmed)) setExtraOptions((prev) => [...prev, trimmed]);
    if (multiple) {
      if (!value.includes(trimmed)) onChange([...value, trimmed]);
    } else {
      onChange(trimmed);
      setOpen(false);
    }
    setNewVal('');
    setAddingNew(false);
  };

  const handleSelect = (opt) => {
    if (multiple) {
      onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    } else {
      onChange(opt);
      setOpen(false);
    }
  };

  return (
    <div className={styles.dropdownRow}>
      <span className={styles.dropdownLabel}>{label}</span>
      <div className={`${styles.dropdownWrap} ${hasError ? styles.dropdownError : ''}`} ref={wrapRef}>
        <button type="button" className={styles.dropdownBtn} onClick={() => setOpen((v) => !v)}>
          <span>{displayValue}</span>
          <img src={downIcon} alt="" className={styles.chevron} />
        </button>
        {open && (
          <div className={styles.dropdownList}>
            {allOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`${styles.dropdownOption} ${
                  (multiple ? value.includes(opt) : value === opt) ? styles.dropdownOptionActive : ''
                }`}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </button>
            ))}
            {allowAdd && (
              <div className={styles.dropdownAddRow}>
                {addingNew ? (
                  <>
                    <input
                      className={styles.dropdownAddInput}
                      value={newVal}
                      autoFocus
                      onChange={(e) => setNewVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmAdd();
                        if (e.key === 'Escape') { setAddingNew(false); setNewVal(''); }
                      }}
                    />
                    <button type="button" className={styles.dropdownAddConfirm} onClick={handleConfirmAdd}><img src={checkIcon} alt="Подтвердить" /></button>
                  </>
                ) : (
                  <button type="button" className={styles.addIconBtn} onClick={() => setAddingNew(true)}>
                    <img src={addIcon} alt="Добавить" className={styles.addIconImg} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main form ── */
const ProductForm = ({ productId = null, initialData = {}, pendingImages = [] }) => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);

  const [colors, setColors] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  /* sync text fields when initialData loads */
  useEffect(() => {
    if (!initialData?.id) return;
    setName(initialData.name || '');
    setDescription(initialData.description || '');
    setPrice(initialData.price ?? '');
    setStockQuantity(initialData.stock_quantity ?? '');
    setSelectedColor(initialData.color || '');
    setSelectedBrand(initialData.brand || '');
    setSelectedSizes(
      initialData.size
        ? initialData.size.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
        : []
    );
  }, [initialData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* load categories list */
  useEffect(() => {
    categoriesService.getAllCategories()
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  /* set category/subcategory selection once both categories and initialData are ready */
  useEffect(() => {
    if (!categories.length || !initialData?.category_id) return;
    const root = categories.find((c) => c.id === initialData.category_id);
    if (root) {
      setSelectedCategoryId(root.id);
    } else {
      for (const c of categories) {
        const sub = (c.children || []).find((s) => s.id === initialData.category_id);
        if (sub) {
          setSelectedCategoryId(c.id);
          setSelectedSubcategoryId(sub.id);
          break;
        }
      }
    }
  }, [categories, initialData?.category_id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* update subcategories list */
  useEffect(() => {
    if (!selectedCategoryId) { setSubcategories([]); return; }
    const cat = categories.find((c) => c.id === selectedCategoryId);
    setSubcategories(cat?.children || []);
  }, [selectedCategoryId, categories]);

  /* load colors & brands from catalog filters */
  useEffect(() => {
    productsService.getFilters().then((res) => {
      const avail = res.data?.filters?.available || {};
      setColors(avail.colors || []);
      setBrands(avail.brands || []);
    }).catch(() => {});
  }, []);

  const categoryOptions = categories.map((c) => c.name);
  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name || '';
  const subcategoryOptions = ['Не выбрано', ...subcategories.map((s) => s.name)];
  const selectedSubcategoryName = subcategories.find((s) => s.id === selectedSubcategoryId)?.name || 'Не выбрано';

  const handleCategoryChange = useCallback((catName) => {
    const cat = categories.find((c) => c.name === catName);
    setSelectedCategoryId(cat?.id ?? null);
    setSelectedSubcategoryId(null);
    setErrors((prev) => ({ ...prev, category: false }));
  }, [categories]);

  const handleSubcategoryChange = useCallback((subName) => {
    if (subName === 'Не выбрано') { setSelectedSubcategoryId(null); return; }
    const sub = subcategories.find((s) => s.name === subName);
    setSelectedSubcategoryId(sub?.id ?? null);
  }, [subcategories]);

  const handleSave = async () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = true;
    if (!price || parseFloat(price) <= 0) newErrors.price = true;
    if (stockQuantity === '' || parseInt(stockQuantity) < 0) newErrors.stock = true;
    if (!selectedCategoryId) newErrors.category = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Заполните обязательные поля');
      return;
    }

    const finalCategoryId = selectedSubcategoryId || selectedCategoryId;
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      stock_quantity: parseInt(stockQuantity),
      category_id: finalCategoryId,
      color: selectedColor || null,
      size: selectedSizes.length > 0 ? selectedSizes.join(',') : null,
      brand: selectedBrand || null,
    };

    setSaving(true);
    try {
      if (productId) {
        await productsService.updateProduct(productId, payload);
      } else {
        const res = await productsService.createProduct(payload);
        const newId = res.data.product?.id;
        if (newId) {
          const localImages = pendingImages.filter((img) => !img.isServer && img.file);
          for (let i = 0; i < localImages.length; i++) {
            try {
              const fd = new FormData();
              fd.append('image', localImages[i].file);
              fd.append('is_main', i === 0 ? 'true' : 'false');
              await productsService.uploadProductImage(newId, fd);
            } catch { /* ignore individual upload failures */ }
          }
        }
      }
      navigate('/admin', { state: { section: 'products' } });
    } catch (err) {
      showError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.form}>
        <div className={`${styles.textRow} ${errors.name ? styles.textRowError : ''}`}>
          <span className={styles.fieldLabel}>Название товара:</span>
          <input
            className={styles.textInput}
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })); }}
          />
        </div>

        <div className={styles.textRow}>
          <span className={styles.fieldLabel}>Описание:</span>
          <input
            className={styles.textInput}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={`${styles.textRow} ${errors.price ? styles.textRowError : ''}`}>
          <span className={styles.fieldLabel}>Цена:</span>
          <input
            type="number"
            min="0"
            className={styles.textInput}
            value={price}
            onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: false })); }}
          />
        </div>

        <div className={`${styles.textRow} ${errors.stock ? styles.textRowError : ''}`}>
          <span className={styles.fieldLabel}>Количество:</span>
          <input
            type="number"
            min="0"
            className={styles.textInput}
            value={stockQuantity}
            onChange={(e) => { setStockQuantity(e.target.value); setErrors((p) => ({ ...p, stock: false })); }}
          />
        </div>

        <Dropdown
          label="Категория:"
          options={categoryOptions}
          value={selectedCategoryName}
          onChange={handleCategoryChange}
          hasError={errors.category}
        />

        <Dropdown
          label="Подкатегория:"
          options={subcategoryOptions}
          value={selectedSubcategoryName}
          onChange={handleSubcategoryChange}
        />

        <Dropdown
          label="Цвет:"
          options={colors}
          value={selectedColor}
          onChange={setSelectedColor}
          allowAdd
        />

        <Dropdown
          label="Размер:"
          options={FIXED_SIZES}
          value={selectedSizes}
          onChange={setSelectedSizes}
          multiple
        />

        <Dropdown
          label="Бренд:"
          options={brands}
          value={selectedBrand}
          onChange={setSelectedBrand}
          allowAdd
        />

        <button
          type="button"
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {errorMsg && (
        <div className={styles.errorToast}>
          <img src={errorIcon} alt="" className={styles.errorIcon} />
          <div>
            <p className={styles.errorLine}>{errorMsg}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductForm;
