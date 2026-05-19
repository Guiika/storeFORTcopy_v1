import React, { useState } from 'react';
import AdminLayout from '../AdminLayout';
import ProductImageUploader from '../../../components/ProductImageUploader/ProductImageUploader';
import ProductForm from '../ProductForm';
import styles from '../AdminPage.module.css';

const AdminProductCreatePage = () => {
  const [images, setImages] = useState([]);

  return (
    <AdminLayout activeSection="products">
      <p className={styles.sectionTitle}>Создание товара</p>
      <div style={{ marginTop: 70 }}>
        <ProductImageUploader productId={null} initialImages={[]} onChange={setImages} />
      </div>
      <div style={{ marginTop: 70 }}>
        <ProductForm productId={null} pendingImages={images} />
      </div>
    </AdminLayout>
  );
};

export default AdminProductCreatePage;
