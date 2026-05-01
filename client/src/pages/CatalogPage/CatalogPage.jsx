import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import { productsService } from '../../services/productsService';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import { useWishlist } from '../../store/WishlistContext';
import styles from './CatalogPage.module.css';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const DEFAULT_COLOR_MAP = { 'чёрный': '#000000', black: '#000000', 'белый': '#FFFFFF', white: '#FFFFFF', 'красный': '#FF0000', red: '#FF0000', 'синий': '#0000FF', blue: '#0000FF', 'зелёный': '#00FF00', green: '#00FF00' };
const SORT_OPTIONS = [
  { key: 'new', label: 'По новизне' },
  { key: 'popular', label: 'По популярности' },
  { key: 'price_asc', label: 'По возрастанию цены' },
  { key: 'price_desc', label: 'По убыванию цены' },
];

const normalizeProducts = (payload) => Array.isArray(payload) ? payload : (payload?.products || payload?.items || payload?.data || []);
const toNumber = (value) => Number(String(value).replace(/[^\d.-]/g, '')) || 0;

const CatalogPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('new');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const response = await productsService.getProducts();
        if (active) setProducts(normalizeProducts(response?.data));
      } catch (error) {
        console.error('Failed to load catalog products', error);
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filterData = useMemo(() => ({
    brands: [...new Set(products.map((p) => p.brand).filter(Boolean))],
    colors: [...new Set(products.map((p) => p.color || p.colour).filter(Boolean))],
  }), [products]);

  const toggleSelection = (value, state, setState) => setState(state.includes(value) ? state.filter((v) => v !== value) : [...state, value]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (selectedBrands.length) list = list.filter((p) => selectedBrands.includes(p.brand));
    if (selectedSizes.length) list = list.filter((p) => selectedSizes.includes(String(p.size || '').toUpperCase()));
    if (selectedColors.length) list = list.filter((p) => selectedColors.includes(p.color || p.colour));

    if (sortBy === 'price_asc') list.sort((a, b) => toNumber(a.price) - toNumber(b.price));
    else if (sortBy === 'price_desc') list.sort((a, b) => toNumber(b.price) - toNumber(a.price));
    else if (sortBy === 'popular') list.sort((a, b) => (b.popularity || b.views || 0) - (a.popularity || a.views || 0));
    else list.sort((a, b) => toNumber(b.id) - toNumber(a.id));

    return list;
  }, [products, selectedBrands, selectedSizes, selectedColors, sortBy]);

  const cartHasProduct = (productId) => cartItems.some((item) => item.product_id === productId || item.id === productId);
  const activeSort = SORT_OPTIONS.find((o) => o.key === sortBy) || SORT_OPTIONS[0];

  return (
    <div className={styles.catalogPage}>
      <img src="../../../assets/posters/banner_catalog.png" alt="Каталог баннер" className={styles.banner} />

      <section className={styles.content}>
        <aside className={styles.filters}>{/* same filters */}
          <div className={styles.filterGroup}><h3 className={styles.filterTitle}>Бренд</h3><div className={styles.filterList}>{filterData.brands.map((brand) => <label key={brand} className={styles.checkItem}><input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleSelection(brand, selectedBrands, setSelectedBrands)} /><span className={styles.checkSquare} /><span className={styles.buttonText}>{brand}</span></label>)}</div></div>
          <div className={styles.filterGroup}><h3 className={styles.filterTitle}>Размер</h3><div className={styles.filterList}>{SIZES.map((size) => <label key={size} className={styles.checkItem}><input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSelection(size, selectedSizes, setSelectedSizes)} /><span className={styles.checkSquare} /><span className={styles.buttonText}>{size}</span></label>)}</div></div>
          <div className={styles.filterGroup}><h3 className={styles.filterTitle}>Цвет</h3><div className={styles.filterList}>{filterData.colors.map((color) => { const key = String(color).toLowerCase(); const dotColor = key.startsWith('#') ? color : (DEFAULT_COLOR_MAP[key] || '#7f7f7f'); return <label key={color} className={styles.checkItem}><input type="checkbox" checked={selectedColors.includes(color)} onChange={() => toggleSelection(color, selectedColors, setSelectedColors)} /><span className={styles.checkSquare} /><span className={styles.colorDot} style={{ backgroundColor: dotColor }} /><span className={styles.buttonText}>{color}</span></label>; })}</div></div>
        </aside>

        <div className={styles.products}>
          <div className={styles.sortRow}>
            <button type="button" className={styles.sortButton} onClick={() => setSortOpen((v) => !v)}>
              <span className={styles.buttonText}>{activeSort.label}</span>
              <img src="/assets/vector/down.svg" alt="Открыть сортировку" className={styles.sortIcon} />
            </button>
            {sortOpen && <div className={styles.sortDropdown}>{SORT_OPTIONS.map((option) => <button key={option.key} type="button" className={styles.sortOption} onClick={() => { setSortBy(option.key); setSortOpen(false); }}>{option.label}</button>)}</div>}
          </div>

          {loading ? <div className={styles.emptyText}>Загрузка...</div> : (
            <div className={styles.grid}>
              {filteredProducts.map((product) => {
                const inWishlist = user ? isInWishlist(product.id) : false;
                const inCart = user ? cartHasProduct(product.id) : false;
                return (
                  <button key={product.id} type="button" className={styles.productCard} onClick={() => navigate(`/product/${product.id}`)}>
                    <div className={styles.productImage}>
                      <img src={product.main_image?.image_url || '/assets/posters/banner_catalog.png'} alt={product.name} />
                      <div className={styles.iconStack}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={async (e) => { e.stopPropagation(); if (!user) return; if (inWishlist) await removeFromWishlist(product.id); else await addToWishlist(product.id); }}
                        >
                          <img src={inWishlist ? '/assets/vector/like_filled.svg' : '/assets/vector/like.svg'} alt="Избранное" className={styles.actionIcon} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={async (e) => { e.stopPropagation(); if (!user) return; if (inCart) await removeFromCart(product.id); else await addToCart(product.id, 1); }}
                        >
                          <img src={inCart ? '/assets/vector/cart.svg' : '/assets/vector/cart_null.svg'} alt="Корзина" className={styles.actionIcon} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.productMeta}><p>{product.name}</p><p>{product.brand}</p><p>{product.price} ₽</p></div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CatalogPage;