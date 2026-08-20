/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ── Types ── */
type Product={id:number;name:string;category:string;description:string;price:number;compareAtPrice:number|null;image:string;tag:string;stock:number;published:boolean;featured:boolean;discount?:number};
type Order={id:number;ref:string;items:string;subtotal:number;shipping:number;total:number;status:string;customerName:string;customerPhone:string;address:string;pincode:string;createdAt:string};
type Customer={id:number;name:string;email:string;phone:string;createdAt:string};
type AdminUser={id:number;name:string;email:string;role:string;modules:string;active:boolean;createdAt:string};
type Tab="dashboard"|"products"|"orders"|"customers"|"users"|"settings";
type Settings={announcement:string;minFreeShipping:number;shippingCost:number;whatsapp:string;email:string};
const MODULES=["dashboard","products","orders","customers","users","settings"] as const;
const STATUSES=["pending","confirmed","packed","shipped","delivered","cancelled"] as const;
const empty={name:"",category:"Accessories",description:"",price:"",compareAtPrice:"",discount:"",image:"",tag:"NEW",stock:"0",published:true,featured:false};
const defaultSettings:Settings={announcement:"COMPLIMENTARY SHIPPING ABOVE ₹999 • EASY 7-DAY RETURNS",minFreeShipping:999,shippingCost:49,whatsapp:"919063266307",email:"adityavardhan394@gmail.com"};

/* ── Helpers ── */
const loadJSON=<T,>(k:string,f:T):T=>{if(typeof window==="undefined")return f;try{return JSON.parse(localStorage.getItem(k)||"null")??f}catch{return f}};
const saveJSON=(k:string,v:unknown)=>{if(typeof window!=="undefined")localStorage.setItem(k,JSON.stringify(v))};
const bump=()=>{if(typeof window!=="undefined"){localStorage.setItem("zavelia-sync",Date.now().toString());window.dispatchEvent(new Event("zavelia-sync"))}};
const fmt=(n:number)=>"₹"+n.toLocaleString("en-IN");

export default function AdminClient({user}:{user:string}){
  /* ── State: safe defaults that match SSR (no hydration mismatch) ── */
  const [tab,setTab]=useState<Tab>("dashboard");
  const [products,setProducts]=useState<Product[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [users,setUsers]=useState<AdminUser[]>([]);
  const [settings,setSettings]=useState<Settings>(defaultSettings);
  const [form,setForm]=useState(empty);
  const [msg,setMsg]=useState("");
  const [editId,setEditId]=useState<number|null>(null);
  const [orderFilter,setOrderFilter]=useState("all");
  const [productSearch,setProductSearch]=useState("");
  const [orderSearch,setOrderSearch]=useState("");
  const [selectedOrder,setSelectedOrder]=useState<Order|null>(null);
  const [userForm,setUserForm]=useState({name:"",email:"",password:"",role:"staff",modules:"[]"});
  const [userMsg,setUserMsg]=useState("");
  const [mounted,setMounted]=useState(false);

  /* ── After mount: sync state from localStorage + hash ── */
  useEffect(()=>{
    setMounted(true);
    const hash=window.location.hash.slice(1) as Tab;
    if(hash&&MODULES.includes(hash as typeof MODULES[number]))setTab(hash);
    const storedSettings=loadJSON<Settings>("zavelia-settings",defaultSettings);
    setSettings(storedSettings);
  },[]);

  /* ── Load data ── */
  const loadProducts=useCallback(async()=>{try{const r=await fetch("/api/admin/products",{cache:"no-store",credentials:"same-origin"});const d=await r.json();if(d.products)setProducts(d.products)}catch{}},[]);
  const loadOrders=useCallback(async()=>{try{const r=await fetch("/api/admin/orders",{cache:"no-store"});const d=await r.json();setOrders((d.orders||[])as Order[])}catch{setOrders([])}},[]);
  const loadCustomers=useCallback(async()=>{try{const r=await fetch("/api/admin/customers",{cache:"no-store"});const d=await r.json();setCustomers(d.customers||[])}catch{setCustomers([])}},[]);
  const loadUsers=useCallback(async()=>{try{const r=await fetch("/api/admin/users",{cache:"no-store"});const d=await r.json();setUsers(d.users||[])}catch{setUsers([])}},[]);
  const loadAll=useCallback(()=>{loadProducts();loadOrders();loadCustomers();loadUsers()},[loadProducts,loadOrders,loadCustomers,loadUsers]);
  useEffect(()=>{loadAll();setSettings(loadJSON<Settings>("zavelia-settings",defaultSettings))},[loadAll]);
  useEffect(()=>{if(typeof window!=="undefined")window.location.hash=tab},[tab]);
  useEffect(()=>{if(typeof window==="undefined")return;const h=()=>loadAll();window.addEventListener("zavelia-sync",h);document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadAll()});return()=>{window.removeEventListener("zavelia-sync",h)}},[loadAll]);

  /* ── Product CRUD ── */
  const saveProduct=async(e:React.FormEvent)=>{
    e.preventDefault();setMsg("");
    if(!form.image){setMsg("Please provide a product image (paste URL or upload).");setTimeout(()=>setMsg(""),3000);return}
    const data={...form,price:Number(form.price),compareAtPrice:form.compareAtPrice?Number(form.compareAtPrice):null,discount:form.discount?Number(form.discount):0,stock:Number(form.stock)};
    const wasEditing=editId;
    try{
      if(wasEditing){
        const r=await fetch(`/api/admin/products/${wasEditing}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
        if(!r.ok){const d=await r.json().catch(()=>({}));setMsg(d.error||"Could not update product.");setTimeout(()=>setMsg(""),3000);return}
      } else {
        const r=await fetch("/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
        if(!r.ok){try{const d=await r.json();setMsg(d.error||"Could not save product.")}catch{setMsg("Could not save product.")}setTimeout(()=>setMsg(""),3000);return}
      }
    }catch{setMsg("Network error. Please try again.");setTimeout(()=>setMsg(""),3000);return}
    setForm(empty);setEditId(null);setMsg(wasEditing?"Product updated successfully.":"Product created.");loadProducts();setTimeout(()=>setMsg(""),3000);
  };
  const [uploading,setUploading]=useState(false);
  const patchProduct=async(id:number,data:Record<string,unknown>)=>{try{const r=await fetch(`/api/admin/products/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!r.ok){const d=await r.json().catch(()=>({}));setMsg(d.error||"Update failed.");setTimeout(()=>setMsg(""),3000);return}loadProducts()}catch{setMsg("Network error updating product.");setTimeout(()=>setMsg(""),3000)}};
  const handleImageUpload=async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);try{const fd=new FormData();fd.append("file",file);const r=await fetch("/api/admin/upload",{method:"POST",body:fd});const d=await r.json();if(!r.ok){setMsg(d.error||"Upload failed.");setTimeout(()=>setMsg(""),3000);return}setForm({...form,image:d.url});setMsg("Image uploaded!");setTimeout(()=>setMsg(""),2000)}catch{setMsg("Upload failed.");setTimeout(()=>setMsg(""),3000)}finally{setUploading(false)}};
  const deleteProduct=async(id:number,name:string)=>{if(!confirm(`Delete ${name}?`))return;await fetch(`/api/admin/products/${id}`,{method:"DELETE"});loadProducts()};
  const startEdit=(p:Product)=>{setEditId(p.id);setForm({name:p.name,category:p.category,description:p.description,price:String(p.price),compareAtPrice:p.compareAtPrice?String(p.compareAtPrice):"",discount:p.discount?String(p.discount):"",image:p.image,tag:p.tag,stock:String(p.stock),published:p.published,featured:p.featured});setTab("products");if(typeof document!=="undefined")document.getElementById("product-form")?.scrollIntoView({behavior:"smooth"})};

  /* ── Order status ── */
  const updateOrderStatus=async(id:number,status:string)=>{
    const order=orders.find(o=>o.id===id);
    const ref=order?.ref||"";
    try{
      await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});
      setOrders(prev=>prev.map(o=>o.id===id?{...o,status}:o));
      setMsg(`Order ${ref} updated to "${status}".`);
      setTimeout(()=>setMsg(""),3000);
    }catch{
      setMsg("Failed to update order status.");
      setTimeout(()=>setMsg(""),3000);
    }
  };

  /* ── User CRUD ── */
  const createUser=async(e:React.FormEvent)=>{
    e.preventDefault();setUserMsg("");
    const r=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(userForm)});
    let d;try{d=await r.json()}catch{d={}};if(!r.ok){setUserMsg(d.error||"Failed.");return}
    setUserForm({name:"",email:"",password:"",role:"staff",modules:"[]"});setUserMsg("User created.");loadUsers();setTimeout(()=>setUserMsg(""),3000);
  };
  const toggleUser=async(id:number,active:boolean)=>{await fetch(`/api/admin/users/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active})});loadUsers()};
  const deleteUser=async(id:number,name:string)=>{if(!confirm(`Remove ${name}?`))return;await fetch(`/api/admin/users/${id}`,{method:"DELETE"});loadUsers()};

  /* ── Settings ── */
  const saveSettings=(e:React.FormEvent)=>{e.preventDefault();saveJSON("zavelia-settings",settings);setMsg("Settings saved.");bump();setTimeout(()=>setMsg(""),3000)};

  /* ── KPIs ── */
  const kpis=useMemo(()=>{
    const pub=products.filter(p=>p.published).length;
    const low=products.filter(p=>p.stock<5).length;
    const pending=orders.filter(o=>o.status==="pending").length;
    const revenue=orders.filter(o=>o.status==="confirmed"||o.status==="delivered").reduce((s,o)=>s+o.total,0);
    return{total:products.length,published:pub,hidden:products.length-pub,low,pending,orders:orders.length,customers:customers.length,revenue};
  },[products,orders,customers]);

  const filteredOrders=useMemo(()=>{
    let list=orderFilter==="all"?orders:orders.filter(o=>o.status===orderFilter);
    if(orderSearch.trim()){const q=orderSearch.toLowerCase();list=list.filter(o=>o.customerName.toLowerCase().includes(q)||o.customerPhone.includes(q)||o.ref.toLowerCase().includes(q))}
    return list;
  },[orders,orderFilter,orderSearch]);

  const filteredProducts=useMemo(()=>{
    if(!productSearch.trim())return products;
    const q=productSearch.toLowerCase();
    return products.filter(p=>p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q));
  },[products,productSearch]);

  const hasModule=(m:string)=>MODULES.includes(m as typeof MODULES[number]);

  /* ══════════════ RENDER ══════════════ */
  return <main className="admin-v2">
    {/* ── SIDEBAR ── */}
    <aside className="adm-sidebar">
      <div className="adm-brand"><a href="/admin" className="logo">ZAVÉLIA<span>management console</span></a></div>
      <nav className="adm-nav">
        <p className="adm-nav-label">MAIN</p>
        {hasModule("dashboard")&&<button className={tab==="dashboard"?"active":""} onClick={()=>setTab("dashboard")}><span className="adm-nav-icon">▣</span>Dashboard</button>}
        <p className="adm-nav-label">CATALOGUE</p>
        {hasModule("products")&&<button className={tab==="products"?"active":""} onClick={()=>setTab("products")}><span className="adm-nav-icon">▦</span>Products<small>{kpis.total}</small></button>}
        <p className="adm-nav-label">COMMERCE</p>
        {hasModule("orders")&&<button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}><span className="adm-nav-icon">☐</span>Orders{kpis.pending>0&&<em>{kpis.pending}</em>}</button>}
        {hasModule("customers")&&<button className={tab==="customers"?"active":""} onClick={()=>setTab("customers")}><span className="adm-nav-icon">☺</span>Customers</button>}
        <p className="adm-nav-label">SYSTEM</p>
        {hasModule("users")&&<button className={tab==="users"?"active":""} onClick={()=>setTab("users")}><span className="adm-nav-icon">♠</span>Users & Roles</button>}
        {hasModule("settings")&&<button className={tab==="settings"?"active":""} onClick={()=>setTab("settings")}><span className="adm-nav-icon">⚙</span>Settings</button>}
      </nav>
      <div className="adm-user-box">
        <div className="adm-avatar">{user.charAt(0).toUpperCase()}</div>
        <div><strong>{user}</strong><small>Super Admin</small></div>
        <a href="/api/admin/logout" title="Sign out" className="adm-signout">→</a>
      </div>
    </aside>

    {/* ── MAIN ── */}
    <div className="adm-main">
      <div className="adm-topbar">
        <div><p className="eyebrow">ADMIN CONSOLE</p><h1>{tab==="dashboard"?"Dashboard":tab==="products"?"Product Catalogue":tab==="orders"?"Order Management":tab==="customers"?"Customers":tab==="users"?"Users & Roles":"Store Settings"}</h1></div>
        <div className="adm-topbar-actions"><a href="/" target="_blank" className="adm-view-live">VIEW STORE ↗</a><button className="adm-refresh" onClick={loadAll}>↻ Refresh</button></div>
      </div>

      {/* ═══ DASHBOARD ═══ */}
      {tab==="dashboard" && <section className="adm-section">
        <div className="adm-kpi-grid">
          <article className="adm-kpi"><span>Revenue</span><b>{fmt(kpis.revenue)}</b><small>{kpis.orders} orders</small></article>
          <article className="adm-kpi"><span>Products</span><b>{kpis.published}</b><small>{kpis.hidden} hidden</small></article>
          <article className={`adm-kpi${kpis.pending?" warn":""}`}><span>Pending Orders</span><b>{kpis.pending}</b><small>awaiting action</small></article>
          <article className="adm-kpi"><span>Customers</span><b>{kpis.customers}</b><small>registered</small></article>
          <article className={`adm-kpi${kpis.low?" warn":""}`}><span>Low Stock</span><b>{kpis.low}</b><small>below 5 units</small></article>
        </div>
        <div className="adm-dash-grid">
          <div className="adm-card">
            <div className="adm-card-head"><h2>Product Catalogue</h2><button onClick={()=>setTab("products")} className="adm-link">Manage →</button></div>
            {products.length===0?<p className="adm-empty">No products yet.</p>:
            <div className="adm-product-list">{products.slice(0,6).map(p=><article key={p.id} className="adm-product-row">
              <img src={p.image} alt={p.name}/>
              <div className="adm-product-info"><h3>{p.name}</h3><span>{p.category}</span></div>
              <div className="adm-product-price"><b>{fmt(p.price)}</b>{p.discount&&p.discount>0?<span className="adm-discount-badge">{p.discount}% OFF</span>:null}</div>
              <label className="adm-switch"><span>{p.published?"Live":"Off"}</span><input type="checkbox" checked={p.published} onChange={e=>patchProduct(p.id,{published:e.target.checked})}/><i/></label>
            </article>)}</div>}
          </div>
          <div className="adm-card">
            <div className="adm-card-head"><h2>Recent Orders</h2><button onClick={()=>setTab("orders")} className="adm-link">View all →</button></div>
            {orders.slice(0,5).length===0?<p className="adm-empty">No orders yet.</p>:
            <table className="adm-table"><thead><tr><th>Ref</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>
              {orders.slice(0,5).map(o=><tr key={o.ref}><td className="adm-ref">{o.ref}</td><td>{o.customerName}</td><td>{fmt(o.total)}</td><td><span className={`adm-badge status-${o.status}`}>{o.status}</span></td></tr>)}
            </tbody></table>}
          </div>
        </div>
      </section>}

      {/* ═══ PRODUCTS ═══ */}
      {tab==="products" && <section className="adm-section">
        <div className="adm-card" id="product-form">
          <div className="adm-card-head"><h2>{editId?"Edit Product":"Add New Product"}</h2>{editId&&<button className="adm-link" onClick={()=>{setEditId(null);setForm(empty)}}>Cancel edit</button>}</div>
          <form className="adm-product-form" onSubmit={saveProduct}>
            <label>Name<input required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Product name"/></label>
            <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Accessories</option><option>Jewellery</option><option>Beauty</option></select></label>
            <label>Price ₹<input required type="number" min="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
            <label>Compare at ₹<input type="number" min="1" value={form.compareAtPrice} onChange={e=>setForm({...form,compareAtPrice:e.target.value})}/></label>
            <label>Discount %<input type="number" min="0" max="90" value={form.discount} onChange={e=>setForm({...form,discount:e.target.value})} placeholder="0"/></label>
            <label>Stock<input required type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
            <label>Badge<input value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} placeholder="NEW"/></label>
            <label className="adm-wide">Description<textarea required minLength={10} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Product description"/></label>
            <label className="adm-wide">Image URL<input type="url" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} placeholder="Paste image URL or upload below"/></label>
            <label className="adm-wide adm-upload-area"><span>{uploading?"Uploading...":"Upload product image"}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} disabled={uploading}/><em>JPEG, PNG, WebP, GIF (max 5MB)</em></label>
            {form.image&&<div className="adm-image-preview"><img src={form.image} alt="Preview"/><button type="button" onClick={()=>setForm({...form,image:""})} className="adm-remove-img">×</button></div>}
            <label className="adm-check"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/>Published</label>
            <label className="adm-check"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/>Featured</label>
            <button className="adm-btn-primary" type="submit">{editId?"UPDATE PRODUCT":"ADD PRODUCT"}</button>
          </form>
          {msg&&<p className="adm-msg">{msg}</p>}
        </div>
        <div className="adm-card">
          <div className="adm-card-head"><h2>All Products</h2><span>{filteredProducts.length} of {products.length} items</span></div>
          {products.length>3&&<div style={{padding:"0 0 0.75rem"}}><input placeholder="Search products..." value={productSearch} onChange={e=>setProductSearch(e.target.value)} style={{width:"100%",padding:"0.5rem 0.75rem",border:"1px solid #ddd",borderRadius:6,fontSize:"0.9rem"}}/></div>}
          <div className="adm-product-list">
            {filteredProducts.map(p=><article key={p.id} className="adm-product-row">
              <img src={p.image} alt={p.name}/>
              <div className="adm-product-info"><h3>{p.name}</h3><span>{p.category}</span></div>
              <div className="adm-product-price"><b>{fmt(p.price)}</b>{p.discount&&p.discount>0?<span className="adm-discount-badge">{p.discount}% OFF</span>:null}{p.compareAtPrice&&p.compareAtPrice>p.price?<del>{fmt(p.compareAtPrice)}</del>:null}</div>
              <label className="adm-stock-inline">Stock<input type="number" min="0" defaultValue={p.stock} onBlur={e=>{const v=Number(e.target.value);if(v!==p.stock)patchProduct(p.id,{stock:v})}}/></label>
              <label className="adm-switch"><span>{p.published?"Live":"Off"}</span><input type="checkbox" checked={p.published} onChange={e=>patchProduct(p.id,{published:e.target.checked})}/><i/></label>
              <div className="adm-product-actions"><button onClick={()=>startEdit(p)} title="Edit">✎</button><button onClick={()=>deleteProduct(p.id,p.name)} title="Delete" className="adm-del">✖</button></div>
            </article>)}
          </div>
        </div>
      </section>}

      {/* ═══ ORDERS ═══ */}
      {tab==="orders" && <section className="adm-section">
        <div className="adm-card">
          <div className="adm-card-head"><h2>All Orders</h2>
            <div className="adm-filters">{["all",...STATUSES].map(s=><button key={s} className={orderFilter===s?"active":""} onClick={()=>setOrderFilter(s)}>{s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)}{s==="all"?` (${orders.length})`:` (${orders.filter(o=>o.status===s).length})`}</button>)}</div>
          </div>
          {orders.length>3&&<div style={{padding:"0 0 0.75rem"}}><input placeholder="Search by name, phone or ref..." value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} style={{width:"100%",padding:"0.5rem 0.75rem",border:"1px solid #ddd",borderRadius:6,fontSize:"0.9rem"}}/></div>}
          {filteredOrders.length===0?<p className="adm-empty">No orders found.</p>:
          <table className="adm-table adm-orders-table"><thead><tr><th>Reference</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {filteredOrders.map(o=><tr key={o.ref||o.id} style={{cursor:"pointer"}} onClick={()=>setSelectedOrder(o)}>
              <td><div className="adm-ref">{o.ref}</div><small>{new Date(o.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</small></td>
              <td><strong>{o.customerName}</strong><br/><small>{o.customerPhone}</small></td>
              <td className="adm-order-items">{(() => { try { return JSON.parse(o.items).map((it:{name:string;qty:number},i:number)=><span key={i}>{it.qty}× {it.name}</span>) } catch { return <span>{o.items}</span> } })()}</td>
              <td><b>{fmt(o.total)}</b><br/><small>{o.address}, {o.pincode}</small></td>
              <td><span className={`adm-badge status-${o.status}`}>{o.status}</span></td>
              <td><select value={o.status} onChange={e=>updateOrderStatus(o.id, e.target.value)}>{STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></td>
            </tr>)}
          </tbody></table>}
          {msg&&<p className="adm-msg">{msg}</p>}
        </div>
      </section>}

      {/* ═══ ORDER DETAIL MODAL ═══ */}
      {selectedOrder && <div className="adm-modal-backdrop" onClick={()=>setSelectedOrder(null)}>
        <div className="adm-modal" onClick={e=>e.stopPropagation()}>
          <div className="adm-modal-head"><h2>Order {selectedOrder.ref}</h2><button onClick={()=>setSelectedOrder(null)}>×</button></div>
          <div className="adm-modal-body">
            <div className="adm-order-detail-grid">
              <div><strong>Customer</strong><p>{selectedOrder.customerName}</p><p>{selectedOrder.customerPhone}</p></div>
              <div><strong>Status</strong><p><span className={`adm-badge status-${selectedOrder.status}`}>{selectedOrder.status}</span></p></div>
              <div><strong>Date</strong><p>{new Date(selectedOrder.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</p></div>
              <div><strong>Delivery</strong><p>{selectedOrder.address}, {selectedOrder.pincode}</p></div>
            </div>
            <h3>Items</h3>
            <table className="adm-table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead><tbody>
              {(() => { try { return JSON.parse(selectedOrder.items).map((it:{name:string;qty:number;price:number},i:number)=><tr key={i}><td>{it.name}</td><td>{it.qty}</td><td>{fmt(it.price*it.qty)}</td></tr>) } catch { return <tr><td>{selectedOrder.items}</td></tr> } })()}
            </tbody></table>
            <div className="adm-order-totals">
              <span>Subtotal <b>{fmt(selectedOrder.subtotal)}</b></span>
              <span>Shipping <b>{selectedOrder.shipping?fmt(selectedOrder.shipping):"Free"}</b></span>
              <strong>Total <b>{fmt(selectedOrder.total)}</b></strong>
            </div>
            <div style={{marginTop:"1rem",display:"flex",gap:"0.5rem",alignItems:"center"}}>
              <span>Update status:</span>
              <select value={selectedOrder.status} onChange={e=>{updateOrderStatus(selectedOrder.id,e.target.value);setSelectedOrder({...selectedOrder,status:e.target.value})}}>{STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select>
            </div>
          </div>
        </div>
      </div>}

      {/* ═══ CUSTOMERS ═══ */}
      {tab==="customers" && <section className="adm-section">
        <div className="adm-card">
          <div className="adm-card-head"><h2>Registered Customers</h2><span>{customers.length} total</span></div>
          {customers.length===0?<p className="adm-empty">No registered customers yet. Customers appear here when they create accounts on the storefront.</p>:
          <table className="adm-table"><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead><tbody>
            {customers.map(c=><tr key={c.id}><td>{c.id}</td><td><strong>{c.name}</strong></td><td>{c.email}</td><td>{c.phone}</td><td>{new Date(c.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td></tr>)}
          </tbody></table>}
        </div>
      </section>}

      {/* ═══ USERS & ROLES ═══ */}
      {tab==="users" && <section className="adm-section">
        <div className="adm-card">
          <div className="adm-card-head"><h2>Create Admin User</h2></div>
          <form className="adm-user-form" onSubmit={createUser}>
            <label>Full Name<input required value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} placeholder="Full name"/></label>
            <label>Email<input required type="email" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} placeholder="admin@email.com"/></label>
            <label>Password<input required type="password" minLength={6} value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} placeholder="Min 6 chars"/></label>
            <label>Role<select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}><option value="super_admin">Super Admin</option><option value="manager">Manager</option><option value="staff">Staff</option></select></label>
            <div className="adm-modules-grid">
              <p className="adm-modules-label">Module Access</p>
              <div className="adm-modules">{MODULES.map(m=>{
                const sel=JSON.parse(userForm.modules).includes(m);
                return <label key={m} className="adm-module-check"><input type="checkbox" checked={sel} onChange={e=>{const arr=JSON.parse(userForm.modules) as string[];setUserForm({...userForm,modules:JSON.stringify(e.target.checked?[...arr,m]:arr.filter((x:string)=>x!==m))})}}/>{m.charAt(0).toUpperCase()+m.slice(1)}</label>;
              })}</div>
            </div>
            <button className="adm-btn-primary" type="submit">CREATE USER</button>
          </form>
          {userMsg&&<p className="adm-msg">{userMsg}</p>}
        </div>
        <div className="adm-card">
          <div className="adm-card-head"><h2>Admin Users</h2><span>{users.length} users</span></div>
          {users.length===0?<p className="adm-empty">No admin users created yet.</p>:
          <table className="adm-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Modules</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {users.map(u=><tr key={u.id}>
              <td><strong>{u.name}</strong></td><td>{u.email}</td>
              <td><span className={`adm-role-badge role-${u.role}`}>{u.role.replace("_"," ")}</span></td>
              <td className="adm-module-tags">{(JSON.parse(u.modules||"[]") as string[]).map((m:string)=><span key={m} className="adm-tag">{m}</span>)}</td>
              <td><label className="adm-switch"><span>{u.active?"Active":"Inactive"}</span><input type="checkbox" checked={u.active} onChange={e=>toggleUser(u.id,e.target.checked)}/><i/></label></td>
              <td><button onClick={()=>deleteUser(u.id,u.name)} className="adm-del">✖ Remove</button></td>
            </tr>)}
          </tbody></table>}
        </div>
      </section>}

      {/* ═══ SETTINGS ═══ */}
      {tab==="settings" && <section className="adm-section">
        <div className="adm-card">
          <div className="adm-card-head"><h2>Store Configuration</h2></div>
          <form className="adm-settings-form" onSubmit={saveSettings}>
            <label>Announcement Bar Text<input value={settings.announcement} onChange={e=>setSettings({...settings,announcement:e.target.value})}/></label>
            <label>Free Shipping Minimum ₹<input type="number" min="0" value={settings.minFreeShipping} onChange={e=>setSettings({...settings,minFreeShipping:Number(e.target.value)})}/></label>
            <label>Shipping Cost ₹<input type="number" min="0" value={settings.shippingCost} onChange={e=>setSettings({...settings,shippingCost:Number(e.target.value)})}/></label>
            <label>WhatsApp Number (with country code)<input value={settings.whatsapp} onChange={e=>setSettings({...settings,whatsapp:e.target.value})} placeholder="919063266307"/></label>
            <label>Support Email<input type="email" value={settings.email} onChange={e=>setSettings({...settings,email:e.target.value})}/></label>
            <button className="adm-btn-primary" type="submit">SAVE SETTINGS</button>
          </form>
          {msg&&<p className="adm-msg">{msg}</p>}
        </div>
        <div className="adm-card">
          <div className="adm-card-head"><h2>Sync Status</h2></div>
          <div className="adm-sync-info">
            <p>Products and orders sync automatically from the database.</p>
            <button className="adm-btn-secondary" onClick={()=>{loadAll();setMsg("Data refreshed.");setTimeout(()=>setMsg(""),2000)}}>REFRESH DATA</button>
          </div>
        </div>
      </section>}
    </div>
  </main>;
}
