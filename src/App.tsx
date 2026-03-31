import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, ChevronLeft, Plus, Minus, Check, Utensils, Award, User, Settings, Search, Star, AlertTriangle } from 'lucide-react';
import { cn } from './lib/utils';
import { BASES, SAUCES, TOPPINGS, UPSELLS, MenuItem } from './data';
import { useAppContext, CartItem } from './context';
import Admin from './Admin';

type ViewState = 'menu' | 'cart' | 'success' | 'loyalty';

export default function App() {
  const { 
    addOrder, 
    isLoyaltyLoggedIn, 
    stamps, 
    loginLoyalty, 
    logoutLoyalty, 
    loyaltyCustomer,
    restaurantInfo,
    categories,
    inventory
  } = useAppContext();

  const [view, setView] = useState<ViewState>('menu');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view !== 'menu') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find all intersecting entries
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);
        
        if (intersectingEntries.length > 0) {
          // If multiple sections are visible, pick the one that takes up the most space
          // or just pick the first one. Let's pick the first one for simplicity,
          // but we can sort by intersectionRatio if needed.
          const intersectingEntry = intersectingEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          
          const id = intersectingEntry.target.id.replace('category-', '');
          setSelectedCategory(id === 'promo' ? null : id);
          
          // Scroll category button into view
          const button = document.getElementById(`btn-category-${id}`);
          if (button && categoryContainerRef.current) {
            const container = categoryContainerRef.current;
            const scrollLeft = button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
          }
        }
      },
      { 
        rootMargin: '-10% 0px -50% 0px', // Adjust margins to keep it active longer
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] 
      }
    );

    const sections = document.querySelectorAll('section[id^="category-"]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [view, categories, inventory]);

  const scrollToCategory = (id: string | null) => {
    setSelectedCategory(id);
    const elementId = id === null ? 'category-promo' : `category-${id}`;
    const element = document.getElementById(elementId);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };
  
  const { 
    logoUrl, logoSize, bannerUrl, 
    loyaltyCustomers, updateLoyaltyCustomer
  } = useAppContext();

  // Loyalty State
  const [loyaltyNameInput, setLoyaltyNameInput] = useState('');
  const [loyaltyPhoneInput, setLoyaltyPhoneInput] = useState('');

  // Order Options
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [referencePoint, setReferencePoint] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'multibanco' | 'mbway'>('dinheiro');
  const [changeFor, setChangeFor] = useState('');
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
  };

  const distance = (orderType === 'delivery' && customerLat && customerLng && restaurantInfo.lat && restaurantInfo.lng) 
    ? calculateDistance(restaurantInfo.lat, restaurantInfo.lng, customerLat, customerLng)
    : 0;

  const deliveryFee = orderType === 'pickup' ? 0 : (() => {
    if (!distance) return 0;
    const fees = restaurantInfo.deliveryFees || [];
    // Sort fees by maxDistance ascending
    const sortedFees = [...fees].sort((a, b) => a.maxDistance - b.maxDistance);
    
    for (const feeTier of sortedFees) {
      if (distance <= feeTier.maxDistance) {
        return feeTier.fee;
      }
    }
    return -1; // -1 means consult availability (distance > max configured distance)
  })();

  const subtotal = cart.reduce((acc, c) => acc + (c.item.price * c.quantity), 0);
  
  // Calculate discount based on items marked as promo
  // Assuming promo items have a fixed discount or we just apply a global discount?
  // The prompt says: "Se um produto for marcado com 'PROMO X%', aplique o desconto..."
  // Since our MenuItem doesn't have a discount percentage, let's assume isPromo means 20% off for that item
  const discount = cart.reduce((acc, c) => {
    if (c.item.isPromo) {
      return acc + (c.item.price * c.quantity * 0.20); // 20% off promo items
    }
    return acc;
  }, 0);

  const cartTotal = subtotal - discount + (deliveryFee > 0 ? deliveryFee : 0);
  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);

  const handleGetLocation = async () => {
    setIsLocating(true);
    setCheckoutError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCustomerLat(lat);
          setCustomerLng(lng);
          
          try {
            // Use OpenStreetMap Nominatim API for reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            if (data && data.address) {
              const road = data.address.road || '';
              const houseNumber = data.address.house_number || '';
              const city = data.address.city || data.address.town || data.address.village || '';
              const postcode = data.address.postcode || '';
              
              const fullAddress = [road, houseNumber, city].filter(Boolean).join(', ');
              
              if (fullAddress) setDeliveryAddress(fullAddress);
              if (postcode) setPostalCode(postcode);
            }
          } catch (error) {
            console.error("Error fetching address:", error);
            // We still got the coordinates, so we don't show an error, just let them type the address
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setCheckoutError("Não foi possível obter a sua localização. Por favor, certifique-se de que deu permissão no navegador.");
          setIsLocating(false);
        }
      );
    } else {
      setCheckoutError("Geolocalização não suportada pelo seu navegador.");
      setIsLocating(false);
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 4) {
      value = value.substring(0, 4) + '-' + value.substring(4, 7);
    }
    setPostalCode(value);
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.item.id === id) {
          const newQ = c.quantity + delta;
          return { ...c, quantity: newQ };
        }
        return c;
      }).filter(c => c.quantity > 0);
    });
  };

  const handleCheckout = () => {
    setCheckoutError(null);
    if (cart.length === 0) return;
    
    if (!customerName.trim() || !customerPhone.trim()) {
      setCheckoutError('Por favor, insira o seu nome e telemóvel.');
      return;
    }

    if (orderType === 'delivery') {
      if (!deliveryAddress.trim() || !postalCode.trim()) {
        setCheckoutError('Por favor, preencha a morada e código postal para entrega.');
        return;
      }

      if (deliveryAddress.trim().length < 5) {
        setCheckoutError('Por favor, insira uma morada de entrega válida e completa.');
        return;
      }

      const postalCodeRegex = /^\d{4}-\d{3}$/;
      if (!postalCodeRegex.test(postalCode.trim())) {
        setCheckoutError('Por favor, insira um código postal válido no formato XXXX-XXX.');
        return;
      }

      if (deliveryFee === -1) {
        setCheckoutError('A sua morada encontra-se fora da nossa área de entrega configurada. Por favor, contacte-nos para consultar a disponibilidade.');
        return;
      }
    }

    if (paymentMethod === 'dinheiro' && orderType === 'delivery' && !changeFor.trim()) {
      setCheckoutError('Por favor, indique para quanto precisa de troco.');
      return;
    }

    addOrder({
      items: cart,
      total: cartTotal,
      subtotal,
      discount,
      deliveryFee,
      orderType,
      customerName,
      customerPhone,
      deliveryAddress,
      postalCode,
      referencePoint,
      paymentMethod,
      changeFor: changeFor ? parseFloat(changeFor) : undefined
    });
    setCart([]);
    
    // Always update loyalty customer with the provided name and phone
    updateLoyaltyCustomer(customerPhone, customerName, 1);
    
    if (isLoyaltyLoggedIn && loyaltyCustomer?.phone === customerPhone) {
      // Stamps are updated via updateLoyaltyCustomer
    }
    
    setView('success');
  };

  const handleLoyaltyLogin = () => {
    if (loyaltyNameInput && loyaltyPhoneInput) {
      loginLoyalty(loyaltyNameInput, loyaltyPhoneInput);
    }
  };

  const renderMenuItem = (item: MenuItem, isPromoSection: boolean = false) => {
    const cartItem = cart.find(c => c.item.id === item.id);
    const quantity = cartItem?.quantity || 0;

    return (
      <div key={`${isPromoSection ? 'promo-' : ''}${item.id}`} className={cn("bg-white border rounded-2xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden", isPromoSection ? "border-yellow-400 shadow-yellow-100 bg-yellow-50/30" : "border-gray-100")}>
        {item.isPromo && !isPromoSection && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full z-10 shadow-sm flex items-center gap-1">
            <Star size={10} className="fill-yellow-900" /> PROMO
          </div>
        )}
        <div onClick={() => quantity === 0 && handleAddToCart(item)} className={cn("cursor-pointer", quantity === 0 && "hover:opacity-80")}>
          <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-gray-50 relative">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils size={24} /></div>
            )}
          </div>
          <h3 className="font-bold text-sm leading-tight mb-1">{item.name}</h3>
          {item.description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description}</p>}
          <p className="text-nonna-red font-bold text-sm mb-3">{item.price.toFixed(2)}€</p>
        </div>
        
        <div className="mt-auto">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-gray-50 rounded-full p-1 border border-gray-200">
              <button onClick={() => handleUpdateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-nonna-dark hover:text-nonna-red">
                <Minus size={16} />
              </button>
              <span className="font-bold text-sm">{quantity}</span>
              <button onClick={() => handleUpdateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-nonna-red text-white shadow-sm hover:bg-nonna-red-dark">
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => handleAddToCart(item)} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-nonna-dark font-bold text-sm rounded-full transition-colors flex items-center justify-center gap-2">
              <Plus size={16} /> Adicionar
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-nonna-cream font-sans text-nonna-dark selection:bg-nonna-red selection:text-white">
      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        
        <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsAdminOpen(true)}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-full border border-gray-100" />
            ) : (
              <div className="w-10 h-10 bg-nonna-red rounded-full flex items-center justify-center text-white font-serif font-bold italic">N</div>
            )}
            <h1 className="font-serif font-bold text-xl tracking-tight text-nonna-red">Nonna Pasta</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setView('loyalty')} className="text-nonna-dark hover:text-nonna-red transition-colors">
              <Award size={24} />
            </button>
            <button onClick={() => setView('cart')} className="relative p-2 text-nonna-dark hover:text-nonna-red transition-colors">
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-nonna-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            {view === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col min-h-screen">
                {bannerUrl && (
                  <div className="w-full relative">
                    <img src={bannerUrl} alt="Banner" className="w-full h-40 sm:h-56 md:h-64 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
                  </div>
                )}
                
                <div className="px-4 -mt-12 relative z-10 flex flex-col items-center mb-6">
                  {logoUrl ? (
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center p-2">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-nonna-red rounded-full flex items-center justify-center text-white font-serif font-bold italic shadow-xl border-4 border-white text-4xl">
                      N
                    </div>
                  )}
                  <h1 className="font-serif font-bold text-3xl tracking-tight text-nonna-red mt-3">Nonna Pasta</h1>
                  <p className="font-serif italic text-gray-500 text-sm mb-3">Mamma è sempre mamma!</p>
                  
                  {restaurantInfo && (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-600 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                      {restaurantInfo.address && <span className="flex items-center gap-1">📍 {restaurantInfo.address}</span>}
                      {restaurantInfo.days && <span className="flex items-center gap-1">📅 {restaurantInfo.days}</span>}
                      {restaurantInfo.hours && <span className="flex items-center gap-1">⏰ {restaurantInfo.hours}</span>}
                    </div>
                  )}
                </div>

                <div className="px-4 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Procurar pratos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-nonna-red focus:border-nonna-red sm:text-sm transition-colors"
                    />
                  </div>

                  <div className="sticky top-[72px] bg-white/95 backdrop-blur-sm z-40 -mx-4 px-4 py-3 border-b border-gray-100 shadow-sm flex gap-2 overflow-x-auto scrollbar-hide" ref={categoryContainerRef}>
                    <button
                      id="btn-category-promo"
                      onClick={() => scrollToCategory(null)}
                      className={cn(
                        "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all",
                        selectedCategory === null 
                          ? "bg-nonna-red text-white shadow-md" 
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      Todos
                    </button>
                    {categories.filter(c => c.isActive !== false).map(category => (
                      <button
                        key={category.id}
                        id={`btn-category-${category.id}`}
                        onClick={() => scrollToCategory(category.id)}
                        className={cn(
                          "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all",
                          selectedCategory === category.id 
                            ? "bg-nonna-red text-white shadow-md" 
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-8 pb-8">
                    {(() => {
                      const promoItems = (Object.values(inventory) as MenuItem[])
                        .filter(i => i.isActive !== false && i.isPromo)
                        .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())));
                      
                      if (promoItems.length === 0) return null;

                      return (
                        <section key="promo" id="category-promo" className="scroll-mt-32">
                          <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-yellow-600 py-2">
                            <Star className="fill-yellow-500" size={20} />
                            Promoções
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {promoItems.map(item => renderMenuItem(item, true))}
                          </div>
                        </section>
                      );
                    })()}

                    {categories
                      .filter(c => c.isActive !== false)
                      .map(category => {
                        const categoryItems = (Object.values(inventory) as MenuItem[])
                          .filter(i => i.categoryId === category.id && i.isActive !== false)
                          .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())));
                        
                        if (categoryItems.length === 0) return null;

                        return (
                          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800 py-2">
                              {category.name}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {categoryItems.map(item => renderMenuItem(item, false))}
                            </div>
                          </section>
                        );
                    })}
                    
                    {(Object.values(inventory) as MenuItem[]).filter(i => {
                      const category = categories.find(c => c.id === i.categoryId);
                      return i.isActive !== false && category?.isActive !== false && (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())));
                    }).length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Utensils size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Nenhum prato encontrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'loyalty' && (
              <motion.div key="loyalty" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setView('menu')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronLeft size={20}/>
                  </button>
                  <h2 className="font-serif text-2xl font-bold">Família da Nonna</h2>
                </div>
                
                {!isLoyaltyLoggedIn ? (
                  <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-nonna-red/10 text-nonna-red rounded-full flex items-center justify-center mb-4">
                      <Award size={32} />
                    </div>
                    <h3 className="font-bold text-xl">Consulta os teus selos</h3>
                    <p className="text-gray-600 mb-6 text-sm">Insere os teus dados para veres quantos copos faltam para ganhares uma massa grátis!</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                        <input type="text" value={loyaltyNameInput} onChange={e => setLoyaltyNameInput(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red" placeholder="O teu nome" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Telemóvel</label>
                        <input type="tel" value={loyaltyPhoneInput} onChange={e => setLoyaltyPhoneInput(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red" placeholder="O teu número" />
                      </div>
                      <button onClick={handleLoyaltyLogin} disabled={!loyaltyNameInput || !loyaltyPhoneInput} className="w-full bg-nonna-dark hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-4 rounded-xl mt-4 transition-colors">
                        Consultar Pontos
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-nonna-cream rounded-3xl p-6 border border-nonna-red/10 shadow-sm relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-5"><Award size={120} /></div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-nonna-red/10 p-3 rounded-full text-nonna-red"><User size={24} /></div>
                        <div>
                          <h3 className="font-bold text-lg">Olá, {loyaltyCustomer?.name}!</h3>
                          <p className="text-sm text-gray-600">Faltam {10 - stamps} selos para uma massa grátis!</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className={cn("aspect-square rounded-full flex items-center justify-center text-sm font-bold transition-all", i < stamps ? "bg-nonna-red text-white shadow-md scale-105" : "bg-white border-2 border-dashed border-gray-300 text-gray-400")}>
                            {i < stamps ? <Check size={16} strokeWidth={3} /> : i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setView('menu')} className="w-full bg-nonna-red hover:bg-nonna-red-dark text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      Fazer Pedido <ChevronRight size={18} />
                    </button>
                    <button onClick={logoutLoyalty} className="text-sm text-gray-500 hover:text-nonna-dark underline text-center w-full py-2">Sair da conta</button>
                  </div>
                )}
              </motion.div>
            )}

            {view === 'cart' && (
              <motion.div key="cart" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setView('menu')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronLeft size={20}/>
                  </button>
                  <h2 className="font-serif text-3xl font-bold">O teu Pedido</h2>
                </div>
                
                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300"><ShoppingBag size={40} /></div>
                    <p className="text-gray-500">O teu carrinho está vazio.</p>
                    <button onClick={() => setView('menu')} className="text-nonna-red font-bold hover:underline">Ver Menu</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {cart.map((c) => (
                        <div key={c.item.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-sm">{c.item.name}</h3>
                            <p className="text-nonna-red font-bold text-sm">{c.item.price.toFixed(2)}€</p>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-200">
                            <button onClick={() => handleUpdateQuantity(c.item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-nonna-dark hover:text-nonna-red"><Minus size={16} /></button>
                            <span className="font-bold text-sm min-w-[1.5rem] text-center">{c.quantity}</span>
                            <button onClick={() => handleUpdateQuantity(c.item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-nonna-red text-white shadow-sm hover:bg-nonna-red-dark"><Plus size={16} /></button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setView('menu')} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-medium hover:border-nonna-red hover:text-nonna-red transition-colors flex items-center justify-center gap-2">
                        <Plus size={18} /> Adicionar mais itens
                      </button>
                    </div>

                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 space-y-4">
                      <h3 className="font-bold text-lg">Resumo do Pedido</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>{subtotal.toFixed(2)}€</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-nonna-green font-medium">
                            <span>Desconto Promocional</span>
                            <span>-{discount.toFixed(2)}€</span>
                          </div>
                        )}
                        {orderType === 'delivery' && (
                          <div className="flex justify-between text-gray-600">
                            <span>Taxa de Entrega</span>
                            <span>
                              {deliveryFee === -1 ? 'A consultar' : (deliveryFee > 0 ? `${deliveryFee.toFixed(2)}€` : 'Grátis')}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>{cartTotal.toFixed(2)}€</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 space-y-4">
                      <h3 className="font-bold text-lg">Opções de Entrega</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setOrderType('pickup')}
                          className={cn("flex-1 py-3 rounded-xl font-bold text-sm border transition-colors", orderType === 'pickup' ? "bg-nonna-red text-white border-nonna-red" : "bg-white text-gray-500 border-gray-200 hover:border-nonna-red")}
                        >
                          Recolha na Loja
                        </button>
                        <button 
                          onClick={() => setOrderType('delivery')}
                          className={cn("flex-1 py-3 rounded-xl font-bold text-sm border transition-colors", orderType === 'delivery' ? "bg-nonna-red text-white border-nonna-red" : "bg-white text-gray-500 border-gray-200 hover:border-nonna-red")}
                        >
                          Entrega ao Domicílio
                        </button>
                      </div>
                      
                      <div className="pt-2 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Nome *</label>
                          <input 
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                            placeholder="O teu nome"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Telemóvel *</label>
                          <input 
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                            placeholder="O teu número"
                          />
                        </div>

                        {orderType === 'delivery' && (
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-bold text-gray-700">Morada de Entrega *</label>
                                <button 
                                  onClick={handleGetLocation}
                                  disabled={isLocating}
                                  className="text-xs text-nonna-red font-bold flex items-center gap-1 hover:underline disabled:opacity-50 bg-nonna-red/10 px-2 py-1 rounded-lg"
                                >
                                  {isLocating ? 'A localizar...' : '📍 Usar minha localização'}
                                </button>
                              </div>
                              <textarea 
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red resize-none h-20"
                                placeholder="Rua, Número, Andar..."
                              />
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Código Postal *</label>
                                <input 
                                  type="text"
                                  value={postalCode}
                                  onChange={handlePostalCodeChange}
                                  maxLength={8}
                                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red font-mono"
                                  placeholder="0000-000"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ponto de Referência</label>
                                <input 
                                  type="text"
                                  value={referencePoint}
                                  onChange={(e) => setReferencePoint(e.target.value)}
                                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                                  placeholder="Opcional"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-100">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Forma de Pagamento *</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button 
                              onClick={() => setPaymentMethod('dinheiro')}
                              className={cn("py-2 px-1 rounded-xl font-bold text-xs border transition-colors", paymentMethod === 'dinheiro' ? "bg-nonna-red text-white border-nonna-red" : "bg-white text-gray-500 border-gray-200 hover:border-nonna-red")}
                            >
                              Dinheiro
                            </button>
                            <button 
                              onClick={() => setPaymentMethod('multibanco')}
                              className={cn("py-2 px-1 rounded-xl font-bold text-xs border transition-colors", paymentMethod === 'multibanco' ? "bg-nonna-red text-white border-nonna-red" : "bg-white text-gray-500 border-gray-200 hover:border-nonna-red")}
                            >
                              Multibanco
                            </button>
                            <button 
                              onClick={() => setPaymentMethod('mbway')}
                              className={cn("py-2 px-1 rounded-xl font-bold text-xs border transition-colors", paymentMethod === 'mbway' ? "bg-nonna-red text-white border-nonna-red" : "bg-white text-gray-500 border-gray-200 hover:border-nonna-red")}
                            >
                              MB WAY
                            </button>
                          </div>
                        </div>

                        {paymentMethod === 'dinheiro' && orderType === 'delivery' && (
                          <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Precisa de troco para quanto? *</label>
                            <div className="relative">
                              <input 
                                type="number"
                                value={changeFor}
                                onChange={(e) => setChangeFor(e.target.value)}
                                className="w-full p-3 pl-8 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                                placeholder="Ex: 50"
                                min={cartTotal}
                                step="0.01"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                            </div>
                            {changeFor && parseFloat(changeFor) >= cartTotal && (
                              <p className="text-xs text-gray-500 mt-1">
                                Troco a levar: {(parseFloat(changeFor) - cartTotal).toFixed(2)}€
                              </p>
                            )}
                          </div>
                        )}
                        
                        {checkoutError && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p>{checkoutError}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {view === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 text-center space-y-6 pt-12">
                <div className="w-24 h-24 bg-nonna-green/10 text-nonna-green rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="font-serif text-3xl font-bold">Mamma Mia!</h2>
                <p className="text-gray-600">O teu pedido foi recebido e já está a ser preparado com muito amore.</p>
                
                {isLoyaltyLoggedIn && (
                  <div className="bg-nonna-cream rounded-2xl p-6 border border-nonna-red/10 mt-8">
                    <div className="flex justify-center mb-4 text-nonna-red"><Award size={32} /></div>
                    <h3 className="font-bold text-lg mb-2">Ganhaste 1 Selo!</h3>
                    <p className="text-sm text-gray-600 mb-4">A Nonna agradece a preferência. Tens agora {stamps} selos na tua cartela.</p>
                    <div className="flex justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={cn("w-2 h-2 rounded-full", i < (stamps % 5 || 5) ? "bg-nonna-red" : "bg-gray-300")} />
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setView('menu')} className="w-full bg-nonna-dark hover:bg-black text-white font-bold py-4 px-6 rounded-xl mt-8 transition-colors">
                  Voltar ao Início
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {view === 'menu' && cartCount > 0 && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total ({cartCount} itens)</p>
                <p className="font-bold text-xl">{cartTotal.toFixed(2)}€</p>
              </div>
              <button onClick={() => setView('cart')} className="w-full bg-nonna-red hover:bg-nonna-red-dark text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Ver Pedido <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {view === 'cart' && cart.length > 0 && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 font-medium">Total a pagar</p>
                <p className="font-bold text-2xl">{cartTotal.toFixed(2)}€</p>
              </div>
              <button onClick={handleCheckout} className="w-full bg-nonna-green hover:bg-green-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Finalizar Pedido <Check size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAdminOpen && <Admin onClose={() => setIsAdminOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
