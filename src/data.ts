export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  categoryId: string;
  stock: number;
  minStock: number;
  deduction: number;
  unit: 'g' | 'un';
  isActive?: boolean;
  isPromo?: boolean;
}

export const BASES: MenuItem[] = [
  { id: 'penne', name: 'Penne', price: 6.50, image: 'https://images.unsplash.com/photo-1626844131082-256783844137?w=500&q=80', categoryId: 'base', stock: 30000, minStock: 50000, deduction: 400, unit: 'g', isActive: true },
  { id: 'fusilli', name: 'Fusilli', price: 6.50, image: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=500&q=80', categoryId: 'base', stock: 30000, minStock: 50000, deduction: 400, unit: 'g', isActive: true },
  { id: 'spaghetti', name: 'Spaghetti', price: 6.50, image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&q=80', categoryId: 'base', stock: 30000, minStock: 50000, deduction: 400, unit: 'g', isActive: true },
  { id: 'tagliatelle', name: 'Tagliatelle', price: 7.00, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&q=80', categoryId: 'base', stock: 30000, minStock: 50000, deduction: 400, unit: 'g', isActive: true },
];

export const SAUCES: MenuItem[] = [
  { id: 'carbonara', name: 'Carbonara', price: 0, description: 'Ovo, guanciale, pecorino e pimenta preta', categoryId: 'sauce', stock: 5000, minStock: 2000, deduction: 150, unit: 'g', isActive: true },
  { id: 'bolonhesa', name: 'Bolonhesa', price: 0, description: 'Ragu de carne cozinhado lentamente', categoryId: 'sauce', stock: 5000, minStock: 2000, deduction: 150, unit: 'g', isActive: true },
  { id: 'pesto', name: 'Pesto Genovese', price: 0, description: 'Manjericão fresco, pinhões, parmesão e azeite', categoryId: 'sauce', stock: 5000, minStock: 2000, deduction: 100, unit: 'g', isActive: true },
  { id: '4queijos', name: '4 Queijos', price: 0, description: 'Mistura cremosa de queijos italianos', categoryId: 'sauce', stock: 5000, minStock: 2000, deduction: 150, unit: 'g', isActive: true },
  { id: 'alfredo', name: 'Alfredo', price: 0, description: 'Manteiga e parmesão cremoso', categoryId: 'sauce', stock: 5000, minStock: 2000, deduction: 150, unit: 'g', isActive: true },
  { id: 'arrabbiata', name: 'Arrabbiata', price: 0, description: 'Molho de tomate picante com alho', categoryId: 'sauce', stock: 5000, minStock: 2000, deduction: 150, unit: 'g', isActive: true },
];

export const TOPPINGS: MenuItem[] = [
  { id: 'bacon', name: 'Bacon Crocante', price: 1.50, categoryId: 'topping', stock: 2000, minStock: 1000, deduction: 50, unit: 'g', isActive: true },
  { id: 'frango', name: 'Frango Grelhado', price: 2.00, categoryId: 'topping', stock: 2000, minStock: 1000, deduction: 80, unit: 'g', isActive: true },
  { id: 'carne', name: 'Carne Picada', price: 2.00, categoryId: 'topping', stock: 2000, minStock: 1000, deduction: 80, unit: 'g', isActive: true },
  { id: 'cogumelos', name: 'Cogumelos Frescos', price: 1.00, categoryId: 'topping', stock: 2000, minStock: 1000, deduction: 50, unit: 'g', isActive: true },
  { id: 'parmesao', name: 'Extra Parmesão', price: 1.00, categoryId: 'topping', stock: 2000, minStock: 1000, deduction: 30, unit: 'g', isActive: true },
  { id: 'mozzarella', name: 'Mozzarella Fresca', price: 1.50, categoryId: 'topping', stock: 2000, minStock: 1000, deduction: 50, unit: 'g', isActive: true },
  { id: 'azeite', name: 'Azeite Aromatizado', price: 0.50, categoryId: 'topping', stock: 1000, minStock: 500, deduction: 15, unit: 'g', isActive: true },
];

export const UPSELLS: MenuItem[] = [
  { id: 'extra_molho', name: 'Extra Molho', price: 1.50, description: 'Mais sabor para a tua massa', categoryId: 'upsell', stock: 5000, minStock: 1000, deduction: 50, unit: 'g', isActive: true },
  { id: 'coca_cola', name: 'Coca-Cola', price: 2.00, description: 'Lata 33cl', categoryId: 'upsell', stock: 100, minStock: 24, deduction: 1, unit: 'un', isActive: true },
  { id: 'agua', name: 'Água Mineral', price: 1.50, description: 'Garrafa 50cl', categoryId: 'upsell', stock: 100, minStock: 24, deduction: 1, unit: 'un', isActive: true },
  { id: 'tiramisu', name: 'Tiramisù da Nonna', price: 3.50, description: 'A receita secreta da família', categoryId: 'upsell', stock: 30, minStock: 10, deduction: 1, unit: 'un', isActive: true },
  { id: 'panna_cotta', name: 'Panna Cotta', price: 3.00, description: 'Com coulis de frutos vermelhos', categoryId: 'upsell', stock: 30, minStock: 10, deduction: 1, unit: 'un', isActive: true },
];
