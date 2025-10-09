// src/pages/Category.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, Edit2, Plus, Search, Filter, ChevronDown, X, Check } from 'lucide-react';

interface CategoryItem {
  category_id: string;
  category_name: string;
  category_type: string;
  category_slug: string;
  icon: string;
  icon_color: string;
  item_count: number;
  sort_order: number;
  items: any;
  created_at?: string;
  updated_at?: string;
}

interface CategoryWithItems {
  category_id: string;
  category_name: string;
  category_type: string;
  category_slug: string;
  icon: string;
  icon_color: string;
  created_at?: string;
  updated_at?: string;
}

export const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('vi-tri-cong-viec');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState<string | false>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<{id: string, name: string, categoryId: string} | null>(null);

  // Predefined category types
  const categoryTypes = [
    { value: 'vi-tri-cong-viec', label: 'Vị trí công việc', icon: '💼' },
    { value: 'cap-do-kinh-nghiem', label: 'Cấp độ kinh nghiệm', icon: '📊' },
    { value: 'phong-ban', label: 'Phòng ban', icon: '🏢' },
    { value: 'dia-diem-lam-viec', label: 'Địa điểm làm việc', icon: '📍' },
    { value: 'loai-hinh-cong-viec', label: 'Loại hình công việc', icon: '📋' },
    { value: 'ky-nang', label: 'Kỹ năng', icon: '🎯' },
    { value: 'nguon-ung-vien', label: 'Nguồn ứng viên', icon: '👥' },
    { value: 'loai-hinh-cong-ty', label: 'Loại hình công ty', icon: '🏢' },
    { value: 'truong-dai-hoc', label: 'Trường đại học', icon: '🎓' },
    { value: 'muc-do-uu-tien', label: 'Mức độ ưu tiên', icon: '⚡' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [selectedCategory, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Fetch all categories with items
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('cv_categories_with_items')
        .select('*')
        .order('category_name');

      if (categoriesError) throw categoriesError;

      // Group items by category
      const groupedData: { [key: string]: CategoryItem } = {};
      
      categoriesData?.forEach((item: CategoryWithItems & { items: any }) => {
        const categoryKey = item.category_id;
        
        if (!groupedData[categoryKey]) {
          groupedData[categoryKey] = {
            category_id: item.category_id,
            category_name: item.category_name,
            category_type: item.category_type,
            category_slug: item.category_slug,
            icon: item.icon || '📁',
            icon_color: item.icon_color || '#6B7280',
            item_count: 0,
            sort_order: 0,
            items: []
          };
        }
        
        if (item.items) {
          groupedData[categoryKey].items.push(item.items);
          groupedData[categoryKey].item_count++;
        }
      });

      const categoriesArray = Object.values(groupedData);
      setCategories(categoriesArray);
      
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories.filter(cat => cat.category_type === selectedCategory);
    
    if (searchTerm) {
      filtered = filtered.filter(cat => 
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.items?.some((item: any) => 
          item.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    setFilteredCategories(filtered);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategory = {
        category_name: newCategoryName,
        category_type: selectedCategory,
        category_slug: selectedCategory,
        icon: categoryTypes.find(ct => ct.value === selectedCategory)?.icon || '📁',
        icon_color: '#6B7280'
      };

      const { error } = await supabase
        .from('cv_categories')
        .insert([newCategory]);

      if (error) throw error;

      setNewCategoryName('');
      setIsAddingCategory(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddItem = async (categoryId: string) => {
    if (!newItemName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('cv_categories_with_items')
        .insert([{
          category_id: categoryId,
          items: newItemName
        }]);

      if (error) throw error;

      setNewItemName('');
      setIsAddingItem(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.name.trim()) return;
    
    try {
      const { error } = await supabase
        .from('cv_categories_with_items')
        .update({ items: editingItem.name })
        .eq('category_id', editingItem.categoryId)
        .eq('items', editingItem.id);

      if (error) throw error;

      setEditingItem(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (categoryId: string, itemName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${itemName}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('cv_categories_with_items')
        .delete()
        .eq('category_id', categoryId)
        .eq('items', itemName);

      if (error) throw error;

      fetchCategories();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}" và tất cả các mục con?`)) return;
    
    try {
      // Delete all items first
      const { error: itemsError } = await supabase
        .from('cv_categories_with_items')
        .delete()
        .eq('category_id', categoryId);

      if (itemsError) throw itemsError;

      // Then delete the category
      const { error: categoryError } = await supabase
        .from('cv_categories')
        .delete()
        .eq('category_id', categoryId);

      if (categoryError) throw categoryError;

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cài đặt hệ thống</h1>
        <p className="text-gray-600">Quản lý cấu hình và tùy chỉnh hệ thống</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
            Danh mục
          </button>
        </nav>
      </div>

      {/* Category Selector */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">📁</span>
            Quản lý danh mục
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Thêm
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          Quản lý dữ liệu master cho các dropdown trong hệ thống
        </p>

        {/* Category Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categoryTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách các {categoryTypes.find(ct => ct.value === selectedCategory)?.label.toLowerCase()} trong công ty
          </p>
          <p className="text-sm text-gray-500">
            {filteredCategories.reduce((sum, cat) => sum + cat.item_count, 0)} mục
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Thêm danh mục mới..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddCategory}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName('');
              }}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(category => (
            <div key={category.category_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.category_name}</h3>
                    <p className="text-sm text-gray-500">{category.item_count} items</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(category.category_id, category.category_name)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-3">
                {category.items?.slice(0, 5).map((item: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    {editingItem?.id === item && editingItem?.categoryId === category.category_id ? (
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                        onBlur={handleUpdateItem}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateItem()}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-700">{item}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem({id: item, name: item, categoryId: category.category_id})}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(category.category_id, item)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {category.item_count > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{category.item_count - 5} more items
                  </p>
                )}
              </div>

              {isAddingItem === category.category_id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Thêm mục mới..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAddItem(category.category_id)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingItem(false);
                      setNewItemName('');
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingItem(category.category_id)}
                  className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Thêm mục
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};