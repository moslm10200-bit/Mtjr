// طبقة تحميل المنتجات: Firestore إن كان مفعّلاً، وإلا products.js. أي فشل يعود تلقائياً للمحلي.
window.Store = {
  async getProducts() {
    const c = window.FIREBASE_CONFIG;
    if (!c || !c.enabled) return window.PRODUCTS;
    try {
      const v = "10.12.2", b = `https://www.gstatic.com/firebasejs/${v}/`;
      const { initializeApp } = await import(b + "firebase-app.js");
      const { getFirestore, collection, getDocs } = await import(b + "firebase-firestore.js");
      const db = getFirestore(initializeApp(c));
      const snap = await getDocs(collection(db, c.collection));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.length ? list : window.PRODUCTS;
    } catch (e) {
      console.warn("Firebase غير متاح، استخدام البيانات المحلية", e);
      return window.PRODUCTS;
    }
  }
};
