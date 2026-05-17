import { Link, useLocation } from 'react-router';
import { Plane, BarChart3, Truck, GitBranch } from 'lucide-react';
import { USE_REAL_DATA } from '../services/config';

export function Navigation() {
  const location = useLocation();

  const links = [
    { path: '/',               label: 'Manager Dashboard', icon: Plane      },
    { path: '/data-scientist', label: 'Data Analytics',    icon: BarChart3  },
    { path: '/ground-services',label: 'Ground Services',   icon: Truck      },
    { path: '/data-pipeline',  label: 'Data Pipeline',     icon: GitBranch  },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">SkyPort Operations</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {links.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {path === '/data-pipeline' && (
                  <span className={`hidden sm:inline text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    USE_REAL_DATA
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {USE_REAL_DATA ? 'Live' : 'Mock'}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}