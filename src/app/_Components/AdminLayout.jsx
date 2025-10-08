import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Settings, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Bell, 
  Search,
  Menu,
  X,
  LogOut,
  Shield
} from 'lucide-react';

const AdminLayout = ({ children, title = 'Admin Panel' }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3, current: router.pathname === '/admin/dashboard' },
    { name: 'Support Tickets', href: '/admin/tickets', icon: MessageSquare, current: router.pathname === '/admin/tickets' },
    { name: 'Users', href: '/admin/users', icon: Users, current: router.pathname === '/admin/users' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: router.pathname === '/admin/settings' },
  ];

  return (
    <>
      <Head>
        <title>{title} - Support Admin</title>
        <meta name="description" content="Support ticket administration panel" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
          <div className={`fixed inset-0 bg-gray-600 transition-opacity ${sidebarOpen ? 'opacity-75' : 'opacity-0'}`} 
               onClick={() => setSidebarOpen(false)} />
          
          <div className={`fixed inset-y-0 left-0 w-64 bg-white transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <nav className="mt-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <a className={`flex items-center px-4 py-2 text-sm font-medium ${
                      item.current 
                        ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}>
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <Shield className="h-8 w-8 text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          
          <nav className="mt-4 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    item.current 
                      ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="lg:pl-64">
          {/* Top navigation */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <button
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                  )}
                </button>
                
                <div className="flex items-center space-x-2">
                  <img
                    className="h-8 w-8 rounded-full"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Admin avatar"
                  />
                  <span className="text-sm font-medium text-gray-700">Admin User</span>
                </div>
              </div>
            </div>
          </div>
          
          <main>
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;