import { ArrowLeftEndOnRectangleIcon, ChartBarIcon, HomeIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useModal } from '../context/ModalContext';
import LogoutConfirmation from './LogoutConfirmation';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { openModal, closeModal } = useModal();

    const handleLogoutClick = () => {
        openModal(
            <LogoutConfirmation
                onConfirm={async () => {
                    try {
                        await apiClient.post('/api/users/logout');
                        navigate('/login');
                    } catch (error) {
                        console.error('Error logging out:', error);
                        // TODO: Handle the error (e.g., show an error message)
                    } finally {
                        closeModal();
                    }
                }}
                onCancel={() => closeModal()}
            />
        , false);
    };

    const menuItems = [
        { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
        { name: 'Data', icon: ChartBarIcon, path: '/dataVisualisation' },
        { name: 'Profile', icon: UserIcon, path: '/profile' },
        { name: 'Log Out', icon: ArrowLeftEndOnRectangleIcon, onClick: handleLogoutClick }
    ];

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-col lg:h-initial lg:shadow-lg flex-shrink-0`}
            >
                <div className="h-full p-4 space-y-4 flex flex-col">
                    {/* Sidebar Title */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-white">Menu</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-gray-700 dark:text-white lg:hidden">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    {/* Sidebar Items */}
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                className={`w-full text-left font-semibold flex items-center space-x-2 p-2 rounded transition-all ${
                                    isActive
                                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:bg-gray-300 dark:focus:bg-gray-700'
                                }`}
                                onClick={item.onClick || (() => navigate(item.path))}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}

export default Sidebar;