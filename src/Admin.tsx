import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Package, ClipboardList, X, AlertTriangle, Award, Tags, Plus, Trash2, Star, BarChart3, Download } from 'lucide-react';
import { useAppContext, LoyaltyCustomer } from './context';
import { MenuItem } from './data';

export default function Admin({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'loyalty' | 'categories' | 'settings' | 'reports'>('orders');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  const { 
    logoUrl, setLogoUrl, 
    logoSize, setLogoSize, 
    bannerUrl, setBannerUrl,
    restaurantInfo, setRestaurantInfo,
    inventory, updateInventory, deleteInventoryItem, addInventoryItem,
    orders, completeOrder,
    loyaltyCustomers, resetLoyaltyCustomer, editLoyaltyCustomer,
    categories, addCategory, deleteCategory, updateCategory
  } = useAppContext();

  const [editingLoyalty, setEditingLoyalty] = useState<string | null>(null);
  const [editLoyaltyData, setEditLoyaltyData] = useState({ phone: '', name: '', stamps: 0 });

  const handleInventoryChange = (id: string, field: string, value: string) => {
    if (field === 'image' || field === 'name' || field === 'description' || field === 'categoryId') {
      updateInventory(id, { [field]: value });
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        updateInventory(id, { [field]: numValue });
      }
    }
  };

  const handleAddItem = (categoryId: string) => {
    const newItem: MenuItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Novo Item',
      price: 0,
      categoryId,
      stock: 0,
      minStock: 0,
      deduction: 1,
      unit: 'un',
      isActive: true
    };
    addInventoryItem(newItem);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory({
        id: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
        name: newCategoryName.trim()
      });
      setNewCategoryName('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-nonna-dark text-white">
        <h2 className="font-serif text-xl font-bold">Painel de Administração</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'orders' ? 'text-nonna-red border-b-2 border-nonna-red' : 'text-gray-500'}`}
        >
          <ClipboardList size={18} /> Pedidos
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'inventory' ? 'text-nonna-red border-b-2 border-nonna-red' : 'text-gray-500'}`}
        >
          <Package size={18} /> Estoque
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'categories' ? 'text-nonna-red border-b-2 border-nonna-red' : 'text-gray-500'}`}
        >
          <Tags size={18} /> Categorias
        </button>
        <button 
          onClick={() => setActiveTab('loyalty')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'loyalty' ? 'text-nonna-red border-b-2 border-nonna-red' : 'text-gray-500'}`}
        >
          <Award size={18} /> Fidelidade
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'reports' ? 'text-nonna-red border-b-2 border-nonna-red' : 'text-gray-500'}`}
        >
          <BarChart3 size={18} /> Relatórios
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-nonna-red border-b-2 border-nonna-red' : 'text-gray-500'}`}
        >
          <Settings size={18} /> Config
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
        {activeTab === 'orders' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {orders.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Nenhum pedido recebido.</p>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">#{order.id.toUpperCase()}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {order.orderType === 'delivery' ? 'Entrega' : 'Recolha'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{new Date(order.date).toLocaleTimeString()}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-bold text-gray-800">👤 {order.customerName} ({order.customerPhone})</p>
                        {order.orderType === 'delivery' && order.deliveryAddress && (
                          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-sm">
                            <p className="font-medium">📍 {order.deliveryAddress}</p>
                            {order.postalCode && <p className="text-gray-600 mt-1">CP: {order.postalCode}</p>}
                            {order.referencePoint && <p className="text-gray-600 italic mt-1">Ref: {order.referencePoint}</p>}
                          </div>
                        )}
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-sm mt-2">
                          <p className="font-medium">💳 Pagamento: <span className="capitalize">{order.paymentMethod}</span></p>
                          {order.paymentMethod === 'dinheiro' && order.changeFor && (
                            <p className="text-gray-600 mt-1">Troco para: {parseFloat(order.changeFor).toFixed(2)}€</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.status === 'completed' ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {order.items.map((cartItem, idx) => (
                      <div key={idx} className="text-sm flex justify-between">
                        <span>{cartItem.quantity}x {cartItem.item.name}</span>
                        <span className="text-gray-500">{(cartItem.item.price * cartItem.quantity).toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 mb-4 pt-3 border-t border-gray-100 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>{order.subtotal?.toFixed(2) || '0.00'}€</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-nonna-green">
                        <span>Desconto:</span>
                        <span>-{order.discount.toFixed(2)}€</span>
                      </div>
                    )}
                    {order.orderType === 'delivery' && (
                      <div className="flex justify-between text-gray-600">
                        <span>Taxa de Entrega:</span>
                        <span>{order.deliveryFee === -1 ? 'A consultar' : (order.deliveryFee > 0 ? `${order.deliveryFee.toFixed(2)}€` : 'Grátis')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="font-bold">Total: {order.total.toFixed(2)}€</span>
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => {
                          completeOrder(order.id);
                          setActiveTab('reports');
                        }}
                        className="bg-nonna-green hover:bg-green-800 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        Concluir Pedido
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            {categories.map(category => {
              const categoryItems = (Object.values(inventory) as MenuItem[]).filter(item => item.categoryId === category.id);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <h3 className="font-serif text-xl font-bold text-nonna-dark border-b border-gray-200 pb-2">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map(item => {
                      const isLowStock = item.stock <= item.minStock;
                      return (
                        <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border ${isLowStock ? 'border-red-300' : 'border-gray-100'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <input 
                              type="text"
                              value={item.name}
                              onChange={(e) => handleInventoryChange(item.id, 'name', e.target.value)}
                              className="font-bold text-lg w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-nonna-red focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                              {isLowStock && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                  <AlertTriangle size={12} /> Baixo
                                </span>
                              )}
                              <button 
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir este item?')) {
                                    deleteInventoryItem(item.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Excluir Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <span className="text-sm font-bold text-gray-700">Status do Item</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={item.isActive !== false}
                                  onChange={(e) => updateInventory(item.id, { isActive: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nonna-green"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900">{item.isActive !== false ? 'Ativo' : 'Inativo'}</span>
                              </label>
                            </div>

                            <div className="flex items-center justify-between bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                              <span className="text-sm font-bold text-yellow-800 flex items-center gap-2">
                                <Star size={16} className="fill-yellow-500 text-yellow-500" />
                                Promocional
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={item.isPromo || false}
                                  onChange={(e) => updateInventory(item.id, { isPromo: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                                <span className="ml-3 text-sm font-medium text-gray-900">{item.isPromo ? 'Sim' : 'Não'}</span>
                              </label>
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                              <textarea 
                                value={item.description || ''}
                                onChange={(e) => handleInventoryChange(item.id, 'description', e.target.value)}
                                placeholder="Descrição do item"
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none h-16"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                              <select 
                                value={item.categoryId}
                                onChange={(e) => handleInventoryChange(item.id, 'categoryId', e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                              >
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Imagem (URL ou Upload)</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={item.image || ''}
                                  onChange={(e) => handleInventoryChange(item.id, 'image', e.target.value)}
                                  placeholder="https://exemplo.com/imagem.jpg"
                                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                                />
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-center transition-colors">
                                  <span className="text-xs font-bold text-gray-600">Upload</span>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          handleInventoryChange(item.id, 'image', reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Preço (€)</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => handleInventoryChange(item.id, 'price', e.target.value)}
                                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Baixa/Pedido ({item.unit})</label>
                                <input 
                                  type="number" 
                                  value={item.deduction}
                                  onChange={(e) => handleInventoryChange(item.id, 'deduction', e.target.value)}
                                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Estoque Atual ({item.unit})</label>
                                <input 
                                  type="number" 
                                  value={item.stock}
                                  onChange={(e) => handleInventoryChange(item.id, 'stock', e.target.value)}
                                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Estoque Mínimo ({item.unit})</label>
                                <input 
                                  type="number" 
                                  value={item.minStock}
                                  onChange={(e) => handleInventoryChange(item.id, 'minStock', e.target.value)}
                                  className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => handleAddItem(category.id)}
                    className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-nonna-red hover:text-nonna-red transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Adicionar Item em {category.name}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'loyalty' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {(Object.values(loyaltyCustomers) as LoyaltyCustomer[]).length === 0 ? (
              <p className="text-center text-gray-500 py-10">Nenhum cliente fidelizado ainda.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.values(loyaltyCustomers) as LoyaltyCustomer[]).sort((a, b) => b.stamps - a.stamps).map(customer => (
                  editingLoyalty === customer.phone ? (
                    <div key={customer.phone} className="bg-white p-4 rounded-xl shadow-sm border border-nonna-red flex flex-col gap-3">
                      <input type="text" value={editLoyaltyData.name} onChange={e => setEditLoyaltyData({...editLoyaltyData, name: e.target.value})} className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-nonna-red" placeholder="Nome" />
                      <input type="text" value={editLoyaltyData.phone} onChange={e => setEditLoyaltyData({...editLoyaltyData, phone: e.target.value})} className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-nonna-red" placeholder="Telefone" />
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-700">Selos:</label>
                        <input type="number" value={editLoyaltyData.stamps} onChange={e => setEditLoyaltyData({...editLoyaltyData, stamps: Number(e.target.value)})} className="p-2 border border-gray-200 rounded-lg w-20 focus:outline-none focus:border-nonna-red" min="0" max="10" />
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => setEditingLoyalty(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                        <button onClick={() => {
                          editLoyaltyCustomer(customer.phone, editLoyaltyData.phone, editLoyaltyData.name, editLoyaltyData.stamps);
                          setEditingLoyalty(null);
                        }} className="px-4 py-2 text-sm bg-nonna-red text-white rounded-lg font-bold hover:bg-nonna-red-dark transition-colors">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <div key={customer.phone} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{customer.name}</h3>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`font-bold px-3 py-1 rounded-full text-sm ${customer.stamps >= 10 ? 'bg-nonna-green text-white shadow-sm' : 'bg-nonna-red/10 text-nonna-red'}`}>
                          {customer.stamps}/10 Selos
                        </span>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              setEditingLoyalty(customer.phone);
                              setEditLoyaltyData({ phone: customer.phone, name: customer.name, stamps: customer.stamps });
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 underline font-medium"
                          >
                            Editar
                          </button>
                          {customer.stamps >= 10 && (
                            <button 
                              onClick={() => resetLoyaltyCustomer(customer.phone)}
                              className="text-xs text-gray-500 hover:text-nonna-dark underline font-medium"
                            >
                              Zerar Cartela
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-4">Adicionar Nova Categoria</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da Categoria"
                  className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button 
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="bg-nonna-red hover:bg-nonna-red-dark disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus size={20} /> Adicionar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-lg">Categorias Existentes</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {categories.map(category => (
                  <div key={category.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                        className="font-medium text-lg w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-nonna-red focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={category.isActive !== false}
                          onChange={(e) => updateCategory(category.id, { isActive: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nonna-green"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{category.isActive !== false ? 'Ativa' : 'Inativa'}</span>
                      </label>
                      <button 
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta categoria e todos os itens nela?')) {
                            deleteCategory(category.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Excluir Categoria"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Nenhuma categoria cadastrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-gray-700 mb-2">Data Inicial</label>
                <input 
                  type="date" 
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-gray-700 mb-2">Data Final</label>
                <input 
                  type="date" 
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                />
              </div>
              <button 
                onClick={() => {
                  const filteredOrders = orders.filter(o => o.status === 'completed' && (!reportStartDate || o.date >= reportStartDate) && (!reportEndDate || o.date <= reportEndDate + 'T23:59:59'));
                  if (filteredOrders.length === 0) {
                    alert('Nenhum pedido encontrado neste período.');
                    return;
                  }
                  
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + "ID,Data,Cliente,Telefone,Tipo,Total\n"
                    + filteredOrders.map(o => `${o.id},${new Date(o.date).toLocaleString()},${o.customerName},${o.customerPhone},${o.orderType},${o.total.toFixed(2)}`).join("\n");
                  
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `relatorio_pedidos_${reportStartDate || 'inicio'}_ate_${reportEndDate || 'fim'}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full md:w-auto bg-nonna-green text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 h-[50px]"
              >
                <Download size={20} /> Exportar CSV
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Data</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders
                      .filter(o => o.status === 'completed')
                      .filter(o => (!reportStartDate || o.date >= reportStartDate) && (!reportEndDate || o.date <= reportEndDate + 'T23:59:59'))
                      .map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="p-4 font-mono text-xs text-gray-500">#{order.id.toUpperCase()}</td>
                        <td className="p-4">{new Date(order.date).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="font-bold">{order.customerName}</div>
                          <div className="text-xs text-gray-500">{order.customerPhone}</div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${order.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {order.orderType === 'delivery' ? 'Entrega' : 'Recolha'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-nonna-red">{order.total.toFixed(2)}€</td>
                      </tr>
                    ))}
                    {orders.filter(o => o.status === 'completed').length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum pedido concluído.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="space-y-4 pb-6 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">Informações do Restaurante</h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Morada</label>
                <input 
                  type="text" 
                  value={restaurantInfo.address}
                  onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: e.target.value })}
                  placeholder="Ex: Rua Principal, 123, Lisboa"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dias de Funcionamento</label>
                <input 
                  type="text" 
                  value={restaurantInfo.days}
                  onChange={(e) => setRestaurantInfo({ ...restaurantInfo, days: e.target.value })}
                  placeholder="Ex: Terça a Domingo"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Horário</label>
                <input 
                  type="text" 
                  value={restaurantInfo.hours}
                  onChange={(e) => setRestaurantInfo({ ...restaurantInfo, hours: e.target.value })}
                  placeholder="Ex: 12:00 - 15:00 | 19:00 - 23:00"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Taxas de Entrega</h3>
              <div className="space-y-3">
                {(restaurantInfo.deliveryFees || []).map((fee, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Distância Máx. (km)</label>
                      <input 
                        type="number" 
                        value={fee.maxDistance}
                        onChange={(e) => {
                          const newFees = [...(restaurantInfo.deliveryFees || [])];
                          newFees[index].maxDistance = Number(e.target.value);
                          setRestaurantInfo({ ...restaurantInfo, deliveryFees: newFees });
                        }}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Taxa (€)</label>
                      <input 
                        type="number" 
                        value={fee.fee}
                        onChange={(e) => {
                          const newFees = [...(restaurantInfo.deliveryFees || [])];
                          newFees[index].fee = Number(e.target.value);
                          setRestaurantInfo({ ...restaurantInfo, deliveryFees: newFees });
                        }}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newFees = [...(restaurantInfo.deliveryFees || [])];
                        newFees.splice(index, 1);
                        setRestaurantInfo({ ...restaurantInfo, deliveryFees: newFees });
                      }}
                      className="mt-5 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newFees = [...(restaurantInfo.deliveryFees || []), { maxDistance: 10, fee: 5 }];
                    setRestaurantInfo({ ...restaurantInfo, deliveryFees: newFees });
                  }}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:border-nonna-red hover:text-nonna-red transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Adicionar Taxa
                </button>
                <p className="text-xs text-gray-500 mt-2">Para distâncias maiores que a máxima configurada, a taxa será "A consultar" (-1).</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Banner Principal (URL ou Upload)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://exemplo.com/banner.jpg"
                  className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-center transition-colors">
                  <span className="text-sm font-bold text-gray-600">Upload</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setBannerUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Aparece no topo da página inicial. Deixe em branco para ocultar.</p>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Logo (URL ou Upload)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-nonna-red"
                />
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-center transition-colors">
                  <span className="text-sm font-bold text-gray-600">Upload</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setLogoUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Deixe em branco para usar a logo padrão (N).</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tamanho da Logo: {logoSize}px</label>
              <input 
                type="range" 
                min="60" 
                max="200" 
                value={logoSize}
                onChange={(e) => setLogoSize(Number(e.target.value))}
                className="w-full accent-nonna-red"
              />
            </div>
            
            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-bold mb-4">Pré-visualização da Logo</h3>
              <div className="flex justify-center items-center p-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
                ) : (
                  <div 
                    className="bg-nonna-red rounded-full flex items-center justify-center text-white font-serif font-bold italic shadow-xl border-4 border-white"
                    style={{ width: logoSize, height: logoSize, fontSize: logoSize * 0.4 }}
                  >
                    N
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
