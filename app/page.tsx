"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type Product={id:number;name:string;category:string;description:string;price:number;compareAtPrice:number|null;image:string;tag:string;stock:number;published:boolean;featured:boolean;discount?:number};
type CartLine={product:Product;qty:number};
type OrderRecord={ref:string;items:{name:string;qty:number;price:number}[];subtotal:number;shipping:number;total:number;status:string;customerName:string;customerPhone:string;address:string;pincode:string;date:string};
type CustomerUser={name:string;email:string;phone:string};

const categories = [
  { name: "Jewellery", note: "Everyday glow", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=85" },
  { name: "Beauty", note: "Rituals, refined", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85" },
  { name: "Accessories", note: "The finishing touch", image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=85" },
];

/* ─── localStorage helpers ─── */
const loadJSON = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
};
const saveJSON = (key: string, val: unknown) => localStorage.setItem(key, JSON.stringify(val));

export default function Home() {
  /* ── core state ── */
  const [menu, setMenu] = useState(false), [search, setSearch] = useState(false);
  const [products,setProducts]=useState<Product[]>([]),[query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false), [checkout, setCheckout] = useState(false);
  const [wishlistOpen,setWishlistOpen]=useState(false);
  const [customer, setCustomer] = useState({name:"", phone:"", address:"", pincode:""});
  const [quantities, setQuantities] = useState<Record<number,number>>({});
  const [notice, setNotice] = useState("");

  /* ── wishlist ── */
  const [saved, setSaved] = useState<string[]>(()=>loadJSON<string[]>("zavelia-wishlist",[]));

  /* ── customer auth ── */
  const [user, setUser] = useState<CustomerUser|null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login"|"signup">("login");

  /* ── order history ── */
  const [historyOpen, setHistoryOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>(()=>loadJSON<OrderRecord[]>("zavelia-orders",[]));

  /* ── load products ── */
  const fetchProducts=useCallback(()=>{
    // First check localStorage for admin-managed products
    const adminProducts=loadJSON<Product[]|null>("zavelia-products",null);
    if(adminProducts&&adminProducts.length>0){setProducts(adminProducts);return}
    fetch("/api/products").then(r=>r.json()).then(d=>{if(d.products)setProducts(d.products)});
  },[]);
  useEffect(()=>{fetchProducts()},[fetchProducts]);

  /* ── real-time sync from admin ── */
  useEffect(()=>{
    const onSync=()=>fetchProducts();
    const onStorage=(e:StorageEvent)=>{if(e.key==="zavelia-sync"||e.key==="zavelia-products")fetchProducts()};
    const onVisibility=()=>{if(!document.hidden)fetchProducts()};
    window.addEventListener("zavelia-sync",onSync);
    window.addEventListener("storage",onStorage);
    document.addEventListener("visibilitychange",onVisibility);
    const poll=setInterval(fetchProducts,8000);
    return()=>{window.removeEventListener("zavelia-sync",onSync);window.removeEventListener("storage",onStorage);document.removeEventListener("visibilitychange",onVisibility);clearInterval(poll)};
  },[fetchProducts]);

  /* ── load customer from localStorage ── */
  useEffect(()=>{const u=loadJSON<CustomerUser|null>("zavelia-customer",null);if(u)setUser(u)},[]);

  /* ── sync orders when user changes ── */
  useEffect(()=>{
    if(user){
      const userOrders=loadJSON<OrderRecord[]>(`zavelia-orders-${user.email}`,[]);
      setOrders(userOrders);
    } else {
      setOrders(loadJSON<OrderRecord[]>("zavelia-orders",[]));
    }
  },[user]);

  /* ── real-time order sync from admin ── */
  const fetchOrders=useCallback(()=>{
    const local=loadJSON<OrderRecord[]>("zavelia-orders",[]);
    if(local.length>0) setOrders(local);
    /* Also check API for latest statuses (handles cross-port + DB updates) */
    fetch("/api/orders",{cache:"no-store"}).then(r=>r.json()).then(d=>{
      if(!d.orders||d.orders.length===0) return;
      /* Merge: API orders update status for matching refs */
      setOrders(prev=>{
        if(prev.length===0) return d.orders.map((o:any)=>({ref:o.ref,items:JSON.parse(o.items||"[]"),subtotal:o.subtotal,shipping:o.shipping,total:o.total,status:o.status,customerName:o.customerName,customerPhone:o.customerPhone,address:o.address,pincode:o.pincode,date:o.createdAt}));
        const apiByRef=new Map<string,any>();
        d.orders.forEach((o:any)=>apiByRef.set(o.ref,o));
        return prev.map(o=>{
          const api=apiByRef.get(o.ref);
          if(api&&api.status!==o.status) return{...o,status:api.status};
          return o;
        });
      });
    }).catch(()=>{});
  },[]);
  useEffect(()=>{
    fetchOrders();
    const onStorage=(e:StorageEvent)=>{if(e.key==="zavelia-orders"||e.key==="zavelia-sync")fetchOrders()};
    const onVisibility=()=>{if(!document.hidden)fetchOrders()};
    window.addEventListener("storage",onStorage);
    document.addEventListener("visibilitychange",onVisibility);
    const poll=setInterval(fetchOrders,8000);
    return()=>{window.removeEventListener("storage",onStorage);document.removeEventListener("visibilitychange",onVisibility);clearInterval(poll)};
  },[fetchOrders]);



  const results = useMemo(() => products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())), [query,products]);
  const toggleSaved=(id:number)=>setSaved(s=>{const next=s.includes(String(id))?s.filter(x=>x!==String(id)):[...s,String(id)];saveJSON("zavelia-wishlist",next);return next});

  /* ── cart helpers (quantity-based) ── */
  const addToCart = useCallback((product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(l => l.product.id === product.id);
      if (existing) {
        return prev.map(l => l.product.id === product.id ? { ...l, qty: Math.min(l.qty + qty, product.stock) } : l);
      }
      return [...prev, { product, qty }];
    });
    setQuantities(q => ({ ...q, [product.id]: 1 }));
    setNotice(`${qty}× ${product.name} added to your bag`);
    setTimeout(() => setNotice(""), 2200);
  }, []);

  const updateCartQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(l => l.product.id === productId ? { ...l, qty: Math.max(1, Math.min(l.qty + delta, l.product.stock)) } : l));
  };
  const removeFromCart = (productId: number) => setCart(prev => prev.filter(l => l.product.id !== productId));

  const totalItems = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = subtotal >= 999 ? 0 : 49;

  /* ── place order ── */
  const placeOrder=(e:React.FormEvent)=>{
    e.preventDefault();
    const ref=`ZAV-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
    const orderItems = cart.map(l => `${l.qty}× ${l.product.name} — ₹${(l.product.price*l.qty).toLocaleString('en-IN')}`).join('\n');
    const message=`Hello ZAVÉLIA, I would like to place an order.\n\nOrder reference: ${ref}\n${orderItems}\n\nSubtotal: ₹${subtotal.toLocaleString('en-IN')}\nShipping: ${shipping?`₹${shipping}`:'Free'}\nTotal: ₹${(subtotal+shipping).toLocaleString('en-IN')}\n\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nDelivery address: ${customer.address}, PIN ${customer.pincode}\n\nPlease confirm availability and payment details.`;
    window.open(`https://wa.me/919063266307?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');

    /* save order to history (localStorage) */
    const record:OrderRecord = {
      ref,
      items: cart.map(l => ({ name: l.product.name, qty: l.qty, price: l.product.price })),
      subtotal, shipping, total: subtotal + shipping,
      status: "pending",
      customerName: customer.name, customerPhone: customer.phone,
      address: customer.address, pincode: customer.pincode,
      date: new Date().toISOString(),
    };
    const allOrders = [record, ...orders];
    setOrders(allOrders);
    saveJSON("zavelia-orders", allOrders);
    if (user) saveJSON(`zavelia-orders-${user.email}`, allOrders);

    /* persist order to database via API (visible in admin on any port) */
    fetch("/api/orders",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        ref,items:record.items,subtotal,shipping,total:subtotal+shipping,
        customerName:customer.name,customerPhone:customer.phone,
        customerEmail:user?.email,
        address:customer.address,pincode:customer.pincode
      })
    }).catch(()=>{});

    setCart([]); setCheckout(false);
    setNotice(`Order ${ref} prepared in WhatsApp`);
  };

  /* ── customer auth ── */
  const doLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const pass = String(form.get("password"));
    const accounts = loadJSON<{email:string;name:string;phone:string;password:string}[]>("zavelia-accounts",[]);
    const match = accounts.find(a => a.email === email && a.password === pass);
    if (!match) { setNotice("Invalid email or password."); setTimeout(()=>setNotice(""),2500); return; }
    const u = { name: match.name, email: match.email, phone: match.phone };
    setUser(u); saveJSON("zavelia-customer", u);
    setAuthOpen(false); setNotice(`Welcome back, ${match.name}!`); setTimeout(()=>setNotice(""),2500);
  };
  const doSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const phone = String(form.get("phone"));
    const pass = String(form.get("password"));
    if (pass.length < 6) { setNotice("Password must be at least 6 characters."); setTimeout(()=>setNotice(""),2500); return; }
    const accounts = loadJSON<{email:string;name:string;phone:string;password:string}[]>("zavelia-accounts",[]);
    if (accounts.some(a => a.email === email)) { setNotice("An account with this email already exists."); setTimeout(()=>setNotice(""),2500); return; }
    accounts.push({ email, name, phone, password: pass });
    saveJSON("zavelia-accounts", accounts);
    const u = { name, email, phone };
    setUser(u); saveJSON("zavelia-customer", u);
    setAuthOpen(false); setNotice(`Account created! Welcome, ${name}.`); setTimeout(()=>setNotice(""),2500);
  };
  const doLogout = () => { setUser(null); localStorage.removeItem("zavelia-customer"); setNotice("Signed out successfully."); setTimeout(()=>setNotice(""),2200); };

  return <main>
    <a className="skip" href="#content">Skip to content</a>
    <div className="announcement">COMPLIMENTARY SHIPPING ABOVE ₹999 <span>•</span> EASY 7-DAY RETURNS</div>
    <header className="header">
      <button className="icon mobile" aria-label="Open menu" onClick={() => setMenu(true)}>☰</button>
      <a className="logo" href="/">ZAVÉLIA<span>adorn your every mood</span></a>
      <nav aria-label="Main navigation">{['New In','Jewellery','Beauty','Accessories','Gifting'].map(x => <a href="#new-in" key={x}>{x}</a>)}<a className="sale" href="#edit">The Edit</a></nav>
      <div className="actions">
        <button className="icon" aria-label="Search" onClick={() => setSearch(true)}>⌕</button>
        <button className="icon" aria-label={`Wishlist with ${saved.length} items`} onClick={()=>setWishlistOpen(true)}>♡</button>
        <button className="icon user-icon" aria-label={user ? `Account: ${user.name}` : "Sign in"} onClick={()=>user?setHistoryOpen(true):setAuthOpen(true)} title={user ? user.name : "Sign in"}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
        </button>
        <button className="bag" onClick={()=>setCartOpen(true)} aria-label={`Shopping bag with ${totalItems} items`}>BAG <b>{totalItems}</b></button>
      </div>
    </header>

    {/* ── Mobile menu ── */}
    {menu && <div className="overlay" role="dialog" aria-modal="true" aria-label="Navigation menu"><button className="close" onClick={() => setMenu(false)} aria-label="Close menu">×</button><p className="eyebrow">EXPLORE ZAVÉLIA</p>{['New In','Jewellery','Beauty','Accessories','Hair Accessories','Bags & Wallets','Gifting','Offers'].map(x => <a href="#content" onClick={() => setMenu(false)} key={x}>{x}<span>→</span></a>)}</div>}

    {/* ── Search ── */}
    {search && <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search products"><div><label htmlFor="search">What are you looking for?</label><input autoFocus id="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try 'gold hoops' or 'serum'"/><button onClick={() => setSearch(false)} aria-label="Close search">×</button></div><p className="eyebrow">{query ? `${results.length} RESULTS` : 'POPULAR NOW'}</p>{(query ? results : products.slice(0,3)).map(p => <button className="search-result" key={p.name} onClick={() => {setSearch(false); document.getElementById('new-in')?.scrollIntoView()}}><img src={p.image} alt=""/><span>{p.name}<small>{p.category} · ₹{p.price.toLocaleString('en-IN')}</small></span><b>→</b></button>)}</div>}

    {/* ── Auth modal ── */}
    {authOpen && <div className="checkout-modal" role="dialog" aria-modal="true" aria-label="Customer account">
      <form onSubmit={authTab==="login"?doLogin:doSignup}>
        <button type="button" className="drawer-close" onClick={()=>setAuthOpen(false)} aria-label="Close">×</button>
        <p className="eyebrow">{authTab==="login"?"WELCOME BACK":"JOIN ZAVÉLIA"}</p>
        <h2>{authTab==="login"?"Sign in to your account":"Create your account"}</h2>
        <p>{authTab==="login"?"Access your order history and saved details.":"Track orders, save addresses and build your wishlist."}</p>
        <div className="auth-tabs">
          <button type="button" className={authTab==="login"?"active":""} onClick={()=>setAuthTab("login")}>SIGN IN</button>
          <button type="button" className={authTab==="signup"?"active":""} onClick={()=>setAuthTab("signup")}>CREATE ACCOUNT</button>
        </div>
        {authTab==="signup" && <label>Full name<input name="name" required minLength={2} placeholder="Your full name"/></label>}
        <label>Email<input name="email" type="email" required placeholder="your@email.com"/></label>
        {authTab==="signup" && <label>Mobile number<input name="phone" required inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="10-digit mobile"/></label>}
        <label>Password<input name="password" type="password" required minLength={authTab==="signup"?6:1} placeholder={authTab==="signup"?"At least 6 characters":"Your password"}/></label>
        <button className="checkout-btn" type="submit">{authTab==="login"?"SIGN IN →":"CREATE ACCOUNT →"}</button>
        <p style={{textAlign:"center",fontSize:12,marginTop:16,color:"#777"}}>
          {authTab==="login"?<>Don&apos;t have an account? <button type="button" className="auth-link" onClick={()=>setAuthTab("signup")}>Create one</button></>:<>Already a member? <button type="button" className="auth-link" onClick={()=>setAuthTab("login")}>Sign in</button></>}
        </p>
      </form>
    </div>}

    {/* ── Order history modal ── */}
    {historyOpen && user && <div className="drawer-backdrop" onClick={()=>setHistoryOpen(false)}>
      <aside className="cart-drawer order-history-drawer" role="dialog" aria-modal="true" aria-label="My account" onClick={e=>e.stopPropagation()}>
        <button className="drawer-close" onClick={()=>setHistoryOpen(false)} aria-label="Close">×</button>
        <p className="eyebrow">MY ACCOUNT</p>
        <h2>Hi, {user.name}</h2>
        <div className="account-info">
          <span>{user.email}</span><span>{user.phone}</span>
        </div>
        <div className="account-actions">
          <button onClick={doLogout} className="logout-btn">SIGN OUT</button>
        </div>
        <p className="eyebrow" style={{marginTop:28}}>ORDER HISTORY · {orders.length}</p>
        {orders.length===0 ? <div className="empty-cart"><p>You haven&apos;t placed any orders yet.</p><button onClick={()=>setHistoryOpen(false)}>START SHOPPING</button></div> :
        <div className="order-list">
          {orders.map(o => <article key={o.ref} className="order-card">
            <div className="order-head"><span className="order-ref">{o.ref}</span><span className={`order-status status-${o.status}`}>{o.status.toUpperCase()}</span></div>
            <p className="order-date">{new Date(o.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
            <div className="order-items">{o.items.map((it,i)=> <div key={i} className="order-item-row"><span>{it.qty}× {it.name}</span><span>₹{(it.price*it.qty).toLocaleString('en-IN')}</span></div>)}</div>
            <div className="order-foot"><span>Total</span><b>₹{o.total.toLocaleString('en-IN')}</b></div>
          </article>)}
        </div>}
      </aside>
    </div>}

    {/* ── Wishlist ── */}
    {wishlistOpen&&<div className="drawer-backdrop" onClick={()=>setWishlistOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Wishlist" onClick={e=>e.stopPropagation()}><button className="drawer-close" onClick={()=>setWishlistOpen(false)} aria-label="Close wishlist">×</button><p className="eyebrow">YOUR WISHLIST · {saved.length}</p><h2>Saved for later.</h2>{saved.length===0?<div className="empty-cart"><p>Tap the heart on any product to save it here.</p><button onClick={()=>setWishlistOpen(false)}>DISCOVER PRODUCTS</button></div>:<div className="cart-lines">{products.filter(p=>saved.includes(String(p.id))).map(p=><article key={p.id}><img src={p.image} alt=""/><div><h3>{p.name}</h3><small>{p.category}</small><b>₹{p.price.toLocaleString('en-IN')}</b><button className="wishlist-add" onClick={()=>addToCart(p,1)}>ADD TO BAG</button></div><button aria-label={`Remove ${p.name} from wishlist`} onClick={()=>toggleSaved(p.id)}>×</button></article>)}</div>}</aside></div>}

    {/* ── Cart ── */}
    {cartOpen && <div className="drawer-backdrop" onClick={()=>setCartOpen(false)}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag" onClick={e=>e.stopPropagation()}>
      <button className="drawer-close" onClick={()=>setCartOpen(false)} aria-label="Close shopping bag">×</button>
      <p className="eyebrow">YOUR BAG · {totalItems} {totalItems===1?'ITEM':'ITEMS'}</p><h2>Ready when you are.</h2>
      {cart.length===0?<div className="empty-cart"><p>Your bag is waiting for something beautiful.</p><button onClick={()=>setCartOpen(false)}>CONTINUE SHOPPING</button></div>:<>
        <div className="cart-lines">{cart.map(l=><article key={l.product.id}>
          <img src={l.product.image} alt=""/>
          <div><h3>{l.product.name}</h3><small>{l.product.category}</small>
            <b>₹{(l.product.price*l.qty).toLocaleString('en-IN')}</b>
            <div className="cart-qty">
              <button aria-label="Decrease" onClick={()=>l.qty<=1?removeFromCart(l.product.id):updateCartQty(l.product.id,-1)}>−</button>
              <span>{l.qty}</span>
              <button aria-label="Increase" onClick={()=>updateCartQty(l.product.id,1)} disabled={l.qty>=l.product.stock}>+</button>
            </div>
          </div>
          <button aria-label={`Remove ${l.product.name}`} onClick={()=>removeFromCart(l.product.id)}>×</button>
        </article>)}</div>
        <div className="totals"><span>Subtotal <b>₹{subtotal.toLocaleString('en-IN')}</b></span><span>Shipping <b>{shipping?`₹${shipping}`:'Complimentary'}</b></span><strong>Total <b>₹{(subtotal+shipping).toLocaleString('en-IN')}</b></strong></div>
        <button className="checkout-btn" onClick={()=>{setCartOpen(false);setCheckout(true)}}>CONTINUE TO WHATSAPP ORDER →</button>
        <small className="safe-note">No payment is taken now. Your order is confirmed only after ZAVÉLIA replies on WhatsApp.</small>
      </>}</aside></div>}

    {/* ── Checkout ── */}
    {checkout && <div className="checkout-modal" role="dialog" aria-modal="true" aria-label="Delivery details"><form onSubmit={placeOrder}>
      <button type="button" className="drawer-close" onClick={()=>setCheckout(false)} aria-label="Close checkout">×</button>
      <p className="eyebrow">SECURE ORDER REQUEST</p><h2>Where should we deliver?</h2>
      <p>Enter your delivery details. We'll open WhatsApp with your order summary for confirmation.</p>
      <label>Full name<input required minLength={2} value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Your full name"/></label>
      <label>Mobile number<input required inputMode="numeric" pattern="[6-9][0-9]{9}" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value.replace(/\D/g,'').slice(0,10)})} placeholder="10-digit Indian mobile number"/></label>
      <label>Complete delivery address<textarea required minLength={10} value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="House, street, area, city and state"/></label>
      <label>PIN code<input required inputMode="numeric" pattern="[0-9]{6}" value={customer.pincode} onChange={e=>setCustomer({...customer,pincode:e.target.value.replace(/\D/g,'').slice(0,6)})} placeholder="6-digit PIN code"/></label>
      <label className="consent"><input type="checkbox" required/> I agree to share these details with ZAVÉLIA through WhatsApp to process this order.</label>
      <div className="order-total">Order total <b>₹{(subtotal+shipping).toLocaleString('en-IN')}</b></div>
      <button className="checkout-btn" type="submit">OPEN WHATSAPP TO PLACE ORDER →</button>
      <small className="safe-note">WhatsApp will open to +91 90632 66307. Opening WhatsApp does not reserve stock or confirm your order.</small>
    </form></div>}

    {/* ── Hero ── */}
    <section className="hero" id="content"><img src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1800&q=90" alt="Gold jewellery styled on warm sculptural fabric"/><div className="hero-shade"/><div className="hero-copy"><p className="eyebrow">THE FESTIVE EDIT · 2026</p><h1>Your mood.<br/><em>Your moment.</em></h1><p>Jewellery, beauty and accessories curated for every version of you.</p><a className="button light" href="#new-in">SHOP THE EDIT <span>→</span></a></div><div className="hero-index"><span>01</span><i/><span>04</span></div></section>
    <section className="intro"><p className="eyebrow">A WORLD OF SELF-EXPRESSION</p><h2>Not just what you wear.<br/><em>How you feel wearing it.</em></h2><p className="intro-copy">ZAVÉLIA brings together thoughtful details, expressive colour and modern rituals—chosen to make getting ready the best part of your day.</p></section>
    <section className="categories" aria-label="Shop categories">{categories.map((c,i) => <a href="#new-in" className={`category c${i}`} key={c.name}><img src={c.image} alt={`${c.name} collection`}/><div><span>{c.note}</span><h3>{c.name}</h3><b>EXPLORE →</b></div></a>)}</section>

    {/* ── Products ── */}
    <section className="new" id="new-in">
      <div className="section-head"><div><p className="eyebrow">FRESHLY CURATED</p><h2>Accessories & beauty</h2></div><span>{products.length} PRODUCTS</span></div>
      <div className="product-grid">{products.map(p => {
        const qty = quantities[p.id] ?? 1;
        return <article className="product" key={p.id}>
          <div className="product-image">
            <img src={p.image} alt={p.name}/>
            <span>{p.stock>0?p.tag:"SOLD OUT"}</span>
            <button className={saved.includes(String(p.id)) ? 'active' : ''} onClick={() => toggleSaved(p.id)} aria-label={`Save ${p.name}`}>♡</button>
            {p.stock > 0 ? <div className="qty-add-bar">
              <div className="qty-selector">
                <button aria-label="Decrease quantity" onClick={()=>setQuantities(q=>({...q,[p.id]:Math.max(1,(q[p.id]??1)-1)}))}>−</button>
                <span>{qty}</span>
                <button aria-label="Increase quantity" onClick={()=>setQuantities(q=>({...q,[p.id]:Math.min(p.stock,(q[p.id]??1)+1)}))}>+</button>
              </div>
              <button className="add-btn" onClick={() => addToCart(p, qty)}>ADD TO BAG</button>
            </div> : <button className="quick sold-out-btn" disabled>SOLD OUT</button>}
          </div>
          <p>{p.category}</p><h3>{p.name}</h3>
          <div className="price">₹{p.price.toLocaleString('en-IN')} {p.discount&&p.discount>0?<span className="storefront-discount">{p.discount}% OFF</span>:null} {p.compareAtPrice&&p.compareAtPrice>p.price?<del>₹{p.compareAtPrice.toLocaleString('en-IN')}</del>:null}</div>
        </article>;
      })}</div>
    </section>

    <section className="story" id="edit"><div className="story-copy"><p className="eyebrow">THE ZAVÉLIA EDIT</p><h2>Details make<br/>the <em>difference.</em></h2><p>Small rituals. Bold choices. Pieces that move from coffee runs to celebrations—and still feel unmistakably yours.</p><a href="#new-in" className="button dark">DISCOVER OUR STORY <span>→</span></a></div><div className="story-image"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=85" alt="Woman styling a contemporary fashion look"/><div className="stamp">Z<br/><span>CURATED WITH INTENT</span></div></div></section>
    <section className="promise"><p className="eyebrow">WHY ZAVÉLIA</p><div><article><b>01</b><h3>Curated, not crowded</h3><p>Thoughtful edits designed to make choosing feel effortless.</p></article><article><b>02</b><h3>Details you can trust</h3><p>Clear materials, care guidance and honest product information.</p></article><article><b>03</b><h3>Support that feels human</h3><p>Helpful assistance before, during and after your order.</p></article></div></section>
    <section className="newsletter"><p className="eyebrow">NOTES FROM ZAVÉLIA</p><h2>A little beauty in your inbox.</h2><p>New edits, styling stories and private previews—never noise.</p><form onSubmit={e => {e.preventDefault(); setNotice("You\u2019re on the list \u2014 welcome to ZAV\u00c9LIA.")}}><label className="sr-only" htmlFor="email">Email address</label><input id="email" type="email" required placeholder="Your email address"/><button>JOIN THE LIST →</button></form><small>By subscribing, you agree to receive ZAVÉLIA updates. Unsubscribe anytime.</small></section>

    {/* ── Footer ── */}
    <footer><div className="footer-brand"><a className="logo" href="#">ZAVÉLIA<span>adorn your every mood</span></a><p>A curated destination for jewellery, beauty and accessories that celebrate every version of you.</p></div><div><h3>SHOP</h3><a href="#new-in">New In</a><a href="#new-in">Jewellery</a><a href="#new-in">Beauty</a><a href="#new-in">Accessories</a><a href="#new-in">Gifting</a></div><div><h3>HELP</h3><a href="mailto:adityavardhan394@gmail.com">Contact us</a><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="https://wa.me/919063266307" target="_blank" rel="noreferrer">Order support</a><a href="#faq" onClick={e=>{e.preventDefault();document.querySelector('.promise')?.scrollIntoView({behavior:'smooth'})}}>FAQs</a></div><div><h3>ABOUT</h3><a href="#edit">Our story</a><a href="/returns">Care guide</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div><div className="footer-note"><h3>WE'RE HERE TO HELP</h3><a href="https://wa.me/919063266307" target="_blank" rel="noreferrer">WhatsApp: +91 90632 66307</a><a href="mailto:adityavardhan394@gmail.com">adityavardhan394@gmail.com</a><p>Orders are confirmed through WhatsApp after availability review.</p></div></footer>
    <div className="copyright">© 2026 ZAVÉLIA. ALL RIGHTS RESERVED. <span>MADE WITH INTENTION.</span></div>
    {notice && <div className="toast" role="status">✓ {notice}</div>}
  </main>;
}
