import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminCategories, createCategory } from '../../../store/slices/adminSlice';
import toast from 'react-hot-toast';

const ManageCategories = () => {
  const dispatch = useDispatch();
  const { categories, loading } = useSelector((state) => state.admin);
  const [name, setName] = useState('');

  useEffect(() => {
    dispatch(fetchAdminCategories());
  }, [dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await dispatch(createCategory({ name })).unwrap();
      toast.success('Category created successfully');
      setName('');
    } catch (error) {
      toast.error(error?.message || (typeof error === 'string' ? error : 'Failed to create category'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-3xl font-bold">Manage Categories</h1>
        <p className="text-gray-600 mt-2">Organize job categories and skill taxonomies for better search results.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <div>
            <label className="block text-sm font-medium mb-2">New Category</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Enter category name"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add Category
          </button>
        </form>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading categories...</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category._id} className="card">
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <p className="text-gray-500">{category.description || 'No description available.'}</p>
            </div>
          ))
        ) : (
          <div className="card">
            <p className="text-gray-600">No categories found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCategories;
