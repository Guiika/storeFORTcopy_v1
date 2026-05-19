import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import ProductImageUploader from '../../../components/ProductImageUploader/ProductImageUploader';
import ProductForm from '../ProductForm';
import { productsService } from '../../../services/productsService';
import styles from '../AdminPage.module.css';

const AdminProductEditPage = () => {
  const { id } = useParams();
  const [initialImages, setInitialImages] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsService.getProductAdmin(id),
      productsService.getProductImages(id),
    ])
      .then(([prodRes, imgRes]) => {
        setProduct(prodRes.data?.product ?? prodRes.data);
        setInitialImages(imgRes.data.images || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <AdminLayout activeSection="products">
      <p className={styles.loadingText}>Загрузка...</p>
    </AdminLayout>
  );

  return (
    <AdminLayout activeSection="products">
      <p className={styles.sectionTitle}>Редактирование товара</p>
      <div style={{ marginTop: 70 }}>
        <ProductImageUploader productId={id} initialImages={initialImages} onChange={() => {}} />
      </div>
      <div style={{ marginTop: 70 }}>
        <ProductForm productId={id} initialData={product || {}} />
      </div>
    </AdminLayout>
  );
};

export default AdminProductEditPage;
