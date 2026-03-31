import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MenuItem } from './data';

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  status: 'pending' | 'completed';
  date: string;
  orderType: 'delivery' | 'pickup';
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  postalCode?: string;
  referencePoint?: string;
  paymentMethod?: 'dinheiro' | 'multibanco' | 'mbway';
  changeFor?: number;
}

export interface Category {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface InventoryState {
  [id: string]: MenuItem;
}

export interface LoyaltyCustomer {
  phone: string;
  name: string;
  stamps: number;
}

export interface RestaurantInfo {
  address: string;
  hours: string;
  days: string;
  lat?: number;
  lng?: number;
  deliveryFees?: { maxDistance: number; fee: number }[];
}

interface AppContextType {
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  logoSize: number;
  setLogoSize: (size: number) => void;
  bannerUrl: string;
  setBannerUrl: (url: string) => void;
  restaurantInfo: RestaurantInfo;
  setRestaurantInfo: (info: RestaurantInfo) => void;
  categories: Category[];
  addCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  inventory: InventoryState;
  updateInventory: (id: string, updates: Partial<MenuItem>) => void;
  deleteInventoryItem: (id: string) => void;
  addInventoryItem: (item: MenuItem) => void;
  orders: Order[];
  addOrder: (orderData: Omit<Order, 'id' | 'status' | 'date'>) => void;
  completeOrder: (orderId: string) => void;
  loyaltyCustomers: Record<string, LoyaltyCustomer>;
  updateLoyaltyCustomer: (phone: string, name: string, stampsToAdd: number) => void;
  editLoyaltyCustomer: (oldPhone: string, newPhone: string, name: string, stamps: number) => void;
  resetLoyaltyCustomer: (phone: string) => void;
  // Loyalty Auth State
  isLoyaltyLoggedIn: boolean;
  stamps: number;
  loginLoyalty: (name: string, phone: string) => void;
  logoutLoyalty: () => void;
  loyaltyCustomer: LoyaltyCustomer | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSize, setLogoSize] = useState(120);
  const [bannerUrl, setBannerUrl] = useState('');
  
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
    address: 'Carregando...',
    hours: '',
    days: '',
    lat: 0,
    lng: 0,
    deliveryFees: []
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<InventoryState>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<Record<string, LoyaltyCustomer>>({});
  const [loggedInPhone, setLoggedInPhone] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Settings
      const { data: settings } = await supabase.from('restaurant_settings').select('*').single();
      if (settings) {
        setLogoUrl(settings.logo_url || '');
        setLogoSize(settings.logo_size || 120);
        setBannerUrl(settings.banner_url || '');
        setRestaurantInfo({
          address: settings.address || '',
          hours: settings.hours || '',
          days: settings.days || '',
          lat: settings.lat || 0,
          lng: settings.lng || 0,
          deliveryFees: settings.delivery_fees || []
        });
      }

      // Categories
      const { data: cats } = await supabase.from('categories').select('*');
      if (cats) {
        setCategories(cats.map(c => ({ id: c.id, name: c.name, isActive: c.is_active })));
      }

      // Inventory
      const { data: inv } = await supabase.from('inventory').select('*');
      if (inv) {
        const invState: InventoryState = {};
        inv.forEach(item => {
          invState[item.id] = {
            id: item.id, name: item.name, description: item.description, price: Number(item.price),
            categoryId: item.category_id, image: item.image, stock: Number(item.stock),
            minStock: Number(item.min_stock), deduction: Number(item.deduction), unit: item.unit,
            isActive: item.is_active, isPromo: item.is_promo
          };
        });
        setInventory(invState);
      }

      // Orders
      const { data: ords } = await supabase.from('orders').select('*').order('date', { ascending: false });
      if (ords) {
        setOrders(ords.map(o => ({
          id: o.id, items: o.items, total: Number(o.total), subtotal: Number(o.subtotal),
          discount: Number(o.discount), deliveryFee: Number(o.delivery_fee), status: o.status,
          date: o.date, orderType: o.order_type, customerName: o.customer_name,
          customerPhone: o.customer_phone, deliveryAddress: o.delivery_address, postalCode: o.postal_code,
          referencePoint: o.reference_point, paymentMethod: o.payment_method, changeFor: o.change_for ? Number(o.change_for) : undefined
        })));
      }

      // Loyalty
      const { data: loyal } = await supabase.from('loyalty_customers').select('*');
      if (loyal) {
        const loyalState: Record<string, LoyaltyCustomer> = {};
        loyal.forEach(l => {
          loyalState[l.phone] = { phone: l.phone, name: l.name, stamps: l.stamps };
        });
        setLoyaltyCustomers(loyalState);
      }
    };

    loadData();

    // Realtime Subscriptions
    const settingsSub = supabase.channel('settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_settings' }, payload => {
        const settings = payload.new as any;
        if (settings) {
          setLogoUrl(settings.logo_url || '');
          setLogoSize(settings.logo_size || 120);
          setBannerUrl(settings.banner_url || '');
          setRestaurantInfo({
            address: settings.address || '', hours: settings.hours || '', days: settings.days || '',
            lat: settings.lat || 0, lng: settings.lng || 0, deliveryFees: settings.delivery_fees || []
          });
        }
      }).subscribe();

    const catsSub = supabase.channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
         const { data } = await supabase.from('categories').select('*');
         if (data) setCategories(data.map(c => ({ id: c.id, name: c.name, isActive: c.is_active })));
      }).subscribe();

    const invSub = supabase.channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, async () => {
         const { data } = await supabase.from('inventory').select('*');
         if (data) {
            const invState: InventoryState = {};
            data.forEach(item => {
              invState[item.id] = {
                id: item.id, name: item.name, description: item.description, price: Number(item.price),
                categoryId: item.category_id, image: item.image, stock: Number(item.stock),
                minStock: Number(item.min_stock), deduction: Number(item.deduction), unit: item.unit,
                isActive: item.is_active, isPromo: item.is_promo
              };
            });
            setInventory(invState);
         }
      }).subscribe();

    const ordersSub = supabase.channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
         const { data } = await supabase.from('orders').select('*').order('date', { ascending: false });
         if (data) {
            setOrders(data.map(o => ({
              id: o.id, items: o.items, total: Number(o.total), subtotal: Number(o.subtotal),
              discount: Number(o.discount), deliveryFee: Number(o.delivery_fee), status: o.status,
              date: o.date, orderType: o.order_type, customerName: o.customer_name,
              customerPhone: o.customer_phone, deliveryAddress: o.delivery_address, postalCode: o.postal_code,
              referencePoint: o.reference_point, paymentMethod: o.payment_method, changeFor: o.change_for ? Number(o.change_for) : undefined
            })));
         }
      }).subscribe();

    const loyaltySub = supabase.channel('loyalty_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_customers' }, async () => {
         const { data } = await supabase.from('loyalty_customers').select('*');
         if (data) {
            const loyalState: Record<string, LoyaltyCustomer> = {};
            data.forEach(l => {
              loyalState[l.phone] = { phone: l.phone, name: l.name, stamps: l.stamps };
            });
            setLoyaltyCustomers(loyalState);
         }
      }).subscribe();

    return () => {
      supabase.removeChannel(settingsSub);
      supabase.removeChannel(catsSub);
      supabase.removeChannel(invSub);
      supabase.removeChannel(ordersSub);
      supabase.removeChannel(loyaltySub);
    };
  }, []);

  const updateSettings = async (updates: any) => {
    await supabase.from('restaurant_settings').update(updates).eq('id', 1);
  };

  const setLogoUrlWrapper = (url: string) => { setLogoUrl(url); updateSettings({ logo_url: url }); };
  const setLogoSizeWrapper = (size: number) => { setLogoSize(size); updateSettings({ logo_size: size }); };
  const setBannerUrlWrapper = (url: string) => { setBannerUrl(url); updateSettings({ banner_url: url }); };
  const setRestaurantInfoWrapper = (info: RestaurantInfo) => { 
    setRestaurantInfo(info); 
    updateSettings({ 
      address: info.address, hours: info.hours, days: info.days, 
      lat: info.lat, lng: info.lng, delivery_fees: info.deliveryFees 
    }); 
  };

  const addCategory = async (category: Category) => {
    setCategories(prev => [...prev, category]);
    await supabase.from('categories').insert({ id: category.id, name: category.name, is_active: category.isActive ?? true });
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    await supabase.from('categories').delete().eq('id', id);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    await supabase.from('categories').update(dbUpdates).eq('id', id);
  };

  const updateInventory = async (id: string, updates: Partial<MenuItem>) => {
    setInventory(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
    if (updates.deduction !== undefined) dbUpdates.deduction = updates.deduction;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.isPromo !== undefined) dbUpdates.is_promo = updates.isPromo;
    await supabase.from('inventory').update(dbUpdates).eq('id', id);
  };

  const deleteInventoryItem = async (id: string) => {
    setInventory(prev => { const newInv = { ...prev }; delete newInv[id]; return newInv; });
    await supabase.from('inventory').delete().eq('id', id);
  };

  const addInventoryItem = async (item: MenuItem) => {
    setInventory(prev => ({ ...prev, [item.id]: item }));
    await supabase.from('inventory').insert({
      id: item.id, name: item.name, description: item.description, price: item.price,
      category_id: item.categoryId, image: item.image, stock: item.stock,
      min_stock: item.minStock, deduction: item.deduction, unit: item.unit,
      is_active: item.isActive ?? true, is_promo: item.isPromo ?? false
    });
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'status' | 'date'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const date = new Date().toISOString();
    const newOrder: Order = { id, ...orderData, status: 'pending', date };
    setOrders(prev => [newOrder, ...prev]);
    
    await supabase.from('orders').insert({
      id, items: orderData.items, total: orderData.total, subtotal: orderData.subtotal,
      discount: orderData.discount, delivery_fee: orderData.deliveryFee, status: 'pending',
      date, order_type: orderData.orderType, customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone, delivery_address: orderData.deliveryAddress,
      postal_code: orderData.postalCode, reference_point: orderData.referencePoint,
      payment_method: orderData.paymentMethod, change_for: orderData.changeFor
    });
  };

  const completeOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'completed') return;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
    await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);

    // Update inventory stock
    order.items.forEach(cartItem => {
      const invItem = inventory[cartItem.item.id];
      if (invItem) {
        const newStock = Math.max(0, invItem.stock - (invItem.deduction * cartItem.quantity));
        updateInventory(invItem.id, { stock: newStock });
      }
    });
  };

  const updateLoyaltyCustomer = async (phone: string, name: string, stampsToAdd: number) => {
    const existing = loyaltyCustomers[phone] || { phone, name, stamps: 0 };
    const newStamps = Math.min(existing.stamps + stampsToAdd, 10);
    
    setLoyaltyCustomers(prev => ({ ...prev, [phone]: { ...existing, name, stamps: newStamps } }));
    
    await supabase.from('loyalty_customers').upsert({ phone, name, stamps: newStamps });
  };

  const editLoyaltyCustomer = async (oldPhone: string, newPhone: string, name: string, stamps: number) => {
    const newStamps = Math.max(0, Math.min(stamps, 10));
    
    setLoyaltyCustomers(prev => {
      const newCustomers = { ...prev };
      if (oldPhone !== newPhone) delete newCustomers[oldPhone];
      newCustomers[newPhone] = { phone: newPhone, name, stamps: newStamps };
      return newCustomers;
    });

    if (oldPhone !== newPhone) {
      await supabase.from('loyalty_customers').delete().eq('phone', oldPhone);
    }
    await supabase.from('loyalty_customers').upsert({ phone: newPhone, name, stamps: newStamps });
  };

  const resetLoyaltyCustomer = async (phone: string) => {
    const existing = loyaltyCustomers[phone];
    if (!existing) return;
    
    setLoyaltyCustomers(prev => ({ ...prev, [phone]: { ...existing, stamps: 0 } }));
    await supabase.from('loyalty_customers').update({ stamps: 0 }).eq('phone', phone);
  };

  const isLoyaltyLoggedIn = !!loggedInPhone;
  const loyaltyCustomer = loggedInPhone ? loyaltyCustomers[loggedInPhone] : null;
  const stamps = loyaltyCustomer?.stamps || 0;

  const loginLoyalty = (name: string, phone: string) => {
    setLoggedInPhone(phone);
    if (!loyaltyCustomers[phone]) {
      updateLoyaltyCustomer(phone, name, 0);
    }
  };

  const logoutLoyalty = () => setLoggedInPhone(null);

  return (
    <AppContext.Provider value={{
      logoUrl, setLogoUrl: setLogoUrlWrapper,
      logoSize, setLogoSize: setLogoSizeWrapper,
      bannerUrl, setBannerUrl: setBannerUrlWrapper,
      restaurantInfo, setRestaurantInfo: setRestaurantInfoWrapper,
      categories, addCategory, deleteCategory, updateCategory,
      inventory, updateInventory, deleteInventoryItem, addInventoryItem,
      orders, addOrder, completeOrder,
      loyaltyCustomers, updateLoyaltyCustomer, editLoyaltyCustomer, resetLoyaltyCustomer,
      isLoyaltyLoggedIn, stamps, loginLoyalty, logoutLoyalty, loyaltyCustomer
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context as any;
};

