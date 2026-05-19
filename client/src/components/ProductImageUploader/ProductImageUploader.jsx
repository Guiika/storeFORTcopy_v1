import React, { useEffect, useRef, useState } from 'react';
import { productsService } from '../../services/productsService';
import errorIcon from '../../assets/vector/error.svg';
import styles from './ProductImageUploader.module.css';

const ProductImageUploader = ({ productId, initialImages = [], onChange, maxImages }) => {
  const [images, setImages] = useState(
    initialImages.map((img) => ({ ...img, loading: false, isServer: true }))
  );
  const [showError, setShowError] = useState(false);
  const fileRef = useRef(null);

  const triggerError = () => {
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  const canAdd = !maxImages || images.length < maxImages;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const preview = URL.createObjectURL(file);

    if (productId) {
      const tempId = `temp-${Date.now()}`;
      setImages((prev) => [...prev, { tempId, image_url: preview, loading: true, isServer: false }]);
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('is_main', images.length === 0 ? 'true' : 'false');
        const res = await productsService.uploadProductImage(productId, formData);
        const srv = res.data.image;
        setImages((prev) =>
          prev.map((img) =>
            img.tempId === tempId
              ? { id: srv.id, image_url: srv.image_url, loading: false, isServer: true }
              : img
          )
        );
      } catch {
        setImages((prev) => prev.filter((img) => img.tempId !== tempId));
        triggerError();
      }
    } else {
      setImages((prev) => [...prev, { tempId: `local-${Date.now()}`, image_url: preview, file, loading: false, isServer: false }]);
    }
  };

  const handleDelete = async (image) => {
    if (!window.confirm('Удалить изображение?')) return;
    if (image.isServer && image.id) {
      try {
        await productsService.deleteProductImage(image.id);
      } catch {
        triggerError();
        return;
      }
    }
    setImages((prev) => prev.filter((img) => (img.id ?? img.tempId) !== (image.id ?? image.tempId)));
  };

  useEffect(() => {
    onChange?.(images);
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className={styles.row}>
        {images.map((img) => (
          <div key={img.id ?? img.tempId} className={styles.card}>
            <img src={img.image_url} alt="" className={styles.photo} />
            {img.loading ? (
              <div className={styles.overlay}>
                <span className={styles.overlayText}>Загрузка...</span>
              </div>
            ) : (
              <div className={styles.hoverOverlay} onClick={() => handleDelete(img)}>
                <span className={styles.overlayText}>удалить</span>
              </div>
            )}
          </div>
        ))}

        {canAdd && (
          <button type="button" className={styles.addCard} onClick={() => fileRef.current?.click()}>
            <span className={styles.addText}>добавить изображение</span>
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />

      {showError && (
        <div className={styles.errorToast}>
          <img src={errorIcon} alt="" className={styles.errorIcon} />
          <div>
            <p className={styles.errorLine}>Ошибка загрузки</p>
            <p className={styles.errorLine}>Попробуйте ещё раз</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductImageUploader;
