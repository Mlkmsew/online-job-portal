import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const featuredCategoryMeta = {
  Technology: { icon: '💻', jobs: '284 jobs' },
  Finance: { icon: '🏦', jobs: '156 jobs' },
  Healthcare: { icon: '🏥', jobs: '203 jobs' },
  Education: { icon: '🎓', jobs: '178 jobs' },
  Engineering: { icon: '⚙️', jobs: '142 jobs' },
  Marketing: { icon: '📊', jobs: '119 jobs' },
  Legal: { icon: '⚖️', jobs: '67 jobs' },
  Logistics: { icon: '🚛', jobs: '94 jobs' },
  Hospitality: { icon: '🏨', jobs: '88 jobs' },
  Agriculture: { icon: '🌾', jobs: '73 jobs' },
  NGO: { icon: '🌍', jobs: '131 jobs' },
  Construction: { icon: '🏗️', jobs: '105 jobs' },
};

const defaultCategories = [
  { name: 'Technology & IT', slug: 'tech', icon: '💻', jobs: '284 jobs' },
  { name: 'Finance & Banking', slug: 'finance', icon: '🏦', jobs: '156 jobs' },
  { name: 'Healthcare', slug: 'health', icon: '🏥', jobs: '203 jobs' },
  { name: 'Education', slug: 'education', icon: '🎓', jobs: '178 jobs' },
  { name: 'Engineering', slug: 'engineering', icon: '⚙️', jobs: '142 jobs' },
  { name: 'Marketing & Sales', slug: 'marketing', icon: '📊', jobs: '119 jobs' },
  { name: 'Legal & Compliance', slug: 'legal', icon: '⚖️', jobs: '67 jobs' },
  { name: 'Logistics & Supply', slug: 'logistics', icon: '🚛', jobs: '94 jobs' },
  { name: 'Hospitality', slug: 'hospitality', icon: '🏨', jobs: '88 jobs' },
  { name: 'Agriculture', slug: 'agriculture', icon: '🌾', jobs: '73 jobs' },
  { name: 'NGO & Development', slug: 'ngo', icon: '🌍', jobs: '131 jobs' },
  { name: 'Construction', slug: 'construction', icon: '🏗️', jobs: '105 jobs' },
];

const PopularCategories = () => {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const categories = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCats(categories);
      } catch {
        setCats([]);
      }
    };
    fetchCategories();
  }, []);

  const rendered = cats.length
    ? cats.slice(0, 12).map((category) => {
        const key = category.name || category.title || category.category;
        const meta = featuredCategoryMeta[key.split(' ')[0]] || featuredCategoryMeta[key] || {};
        const slug = category.slug || category.name?.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || key;
        return {
          name: key,
          slug,
          icon: meta.icon || '📌',
          jobs: meta.jobs || '100+ jobs',
        };
      })
    : defaultCategories;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rendered.map((category) => (
        <Link
          key={category.slug}
          to={`/jobs?category=${encodeURIComponent(category.slug)}`}
          className="group rounded-3xl border border-gray-200 bg-white px-5 py-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-2xl">
            {category.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{category.jobs}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default PopularCategories;
