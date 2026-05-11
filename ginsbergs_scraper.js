// ============================================================
// GINSBERG'S CATALOG SCRAPER — Olive & Oregano
// ============================================================
// HOW TO USE:
//   1. Open https://ginsbergsfoods.pepr.app/ in your browser
//   2. Log in to your account
//   3. Press F12 to open DevTools → click the "Console" tab
//   4. Paste this ENTIRE script and press Enter
//   5. Then click the "Catalog" tab in the Ginsberg's app
//   6. Scroll through ALL categories to load every item
//   7. When done scrolling, type in console:  window._downloadGinsbergs()
//   8. A file called ginsbergs_catalog.csv will download
//   9. Upload that file to your Pricelist Comparator app
// ============================================================

(function () {
  const catalog = [];
  const seen = new Set();
  const origFetch = window.fetch;
  const origXHR = window.XMLHttpRequest.prototype.open;
  window._ginsbergsCatalog = catalog;

  function processData(data, sourceUrl) {
    let items = [];
    if (Array.isArray(data)) items = data;
    else if (data?.items) items = data.items;
    else if (data?.products) items = data.products;
    else if (data?.data && Array.isArray(data.data)) items = data.data;
    else if (data?.results) items = data.results;
    else if (data?.catalog) items = data.catalog;

    let added = 0;
    items.forEach(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return;
      seen.add(key);
      catalog.push(item);
      added++;
    });

    if (added > 0) {
      console.log(`✅ Captured ${added} items from: ${sourceUrl} (total: ${catalog.length})`);
    }
  }

  // Intercept fetch
  window.fetch = async function (...args) {
    const response = await origFetch.apply(this, args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      const keywords = ['catalog', 'product', 'item', 'inventory', 'price', 'order-guide'];
      if (keywords.some(k => url.toLowerCase().includes(k))) {
        response.clone().json().then(data => processData(data, url)).catch(() => { });
      }
    } catch (e) { }
    return response;
  };

  // Intercept XHR as fallback
  window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    this.addEventListener('load', function () {
      try {
        const keywords = ['catalog', 'product', 'item', 'inventory', 'price', 'order-guide'];
        if (keywords.some(k => this._url?.toLowerCase().includes(k))) {
          const data = JSON.parse(this.responseText);
          processData(data, this._url);
        }
      } catch (e) { }
    });
    return origXHR.apply(this, [method, url, ...rest]);
  };

  // DOM scraper fallback — reads visible cards on the page
  window._scrapeDom = function () {
    const results = [];
    // Try common price/name patterns in the DOM
    document.querySelectorAll('[class*="item"], [class*="product"], [class*="card"]').forEach(el => {
      const text = el.innerText || '';
      const priceMatch = text.match(/\$[\d,]+\.?\d*/);
      const skuMatch = text.match(/Case\s*[•·]?\s*(\d{4,})/i) || text.match(/SKU:?\s*(\d{4,})/i) || text.match(/Item #?:?\s*(\d{4,})/i);
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (priceMatch && lines.length >= 1) {
        results.push({
          name: lines[0],
          sku: skuMatch ? skuMatch[1] : '',
          price: priceMatch[0].replace('$', '').replace(',', ''),
          pack: lines.find(l => /case|lb|oz|pk|ct/i.test(l) && l !== lines[0]) || ''
        });
      }
    });
    return results;
  };

  window._downloadGinsbergs = function () {
    let items = catalog;

    // Fall back to DOM scraping if API capture got nothing
    if (items.length === 0) {
      console.log('No API data captured — trying DOM scrape...');
      items = window._scrapeDom();
    }

    if (items.length === 0) {
      console.warn('❌ No items found. Make sure you scrolled through the full Catalog after pasting this script.');
      return;
    }

    // Normalize fields — Pepr uses various field names
    const fieldGuess = (item, ...keys) => {
      for (const k of keys) {
        if (item[k] !== undefined && item[k] !== null && item[k] !== '') return String(item[k]);
      }
      return '';
    };

    const rows = items.map(item => {
      const name = fieldGuess(item, 'name', 'description', 'itemDescription', 'item_name', 'productName', 'product_name', 'title');
      const sku = fieldGuess(item, 'id', 'sku', 'itemNumber', 'item_number', 'code', 'itemCode', 'item_code', 'productId', 'product_id');
      const price = fieldGuess(item, 'price', 'unitPrice', 'unit_price', 'casePrice', 'case_price', 'cost', 'listPrice', 'list_price');
      const pack = fieldGuess(item, 'pack', 'packSize', 'pack_size', 'unitSize', 'unit_size', 'size', 'uom', 'unitOfMeasure');
      const category = fieldGuess(item, 'category', 'categoryName', 'category_name', 'department', 'group');
      return [name, sku, price, pack, category].map(v => `"${v.replace(/"/g, '""')}"`).join(',');
    });

    const csv = 'Item Name,SKU,Price,Pack Size,Category\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ginsbergs_catalog.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`✅ Downloaded ${items.length} items as ginsbergs_catalog.csv`);
    console.log('Upload this file to your Pricelist Comparator at http://localhost:8080');
  };

  console.log('');
  console.log('✅ Ginsberg\'s scraper is ACTIVE.');
  console.log('👉 Now click the CATALOG tab and scroll through all categories.');
  console.log('👉 When done, type:  window._downloadGinsbergs()');
  console.log('');
})();
