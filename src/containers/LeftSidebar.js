import routes from '../routes/sidebar'
import { NavLink, Link, useLocation} from 'react-router-dom'
import SidebarSubmenu from './SidebarSubmenu';
import XMarkIcon  from '@heroicons/react/24/outline/XMarkIcon';

function LeftSidebar(){
    const location = useLocation();

    const close = (e) => {
        document.getElementById('left-sidebar-drawer').click()
    }

    return(
        <div className="drawer-side z-30">
            <label htmlFor="left-sidebar-drawer" className="drawer-overlay"></label> 
            <ul className="menu pt-2 w-80 bg-base-100 min-h-full text-base-content">
                <button className="btn btn-ghost bg-base-300 btn-circle z-50 top-0 right-0 mt-4 mr-2 absolute lg:hidden" onClick={() => close()}>
                    <XMarkIcon className="h-5 inline-block w-5"/>
                </button>

                <li className="mb-2 font-semibold text-xl">
                    <Link to={'/app/welcome'} className="flex items-center space-x-2 hover:text-primary transition-all duration-300">
                        {/* Đặt chiều rộng logo lớn hơn, không cần h */}
                        <img className="mask mask-squircle w-16 transition-transform transform hover:scale-110" src="/logo192.png" alt="DashWind Logo"/>
                        <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400 hover:scale-105 transition-all duration-300">
                            FFund
                        </span>
                    </Link>
                </li>
                
                {routes.map((route, k) => {
                    return (
                        <li key={k}>
                            {route.submenu ? 
                                <SidebarSubmenu {...route}/> : 
                                (<NavLink
                                    end
                                    to={route.path}
                                    className={({isActive}) => `${isActive ? 'font-semibold bg-base-200' : 'font-normal'}`} >
                                       {route.icon} {route.name}
                                       {location.pathname === route.path ? (<span className="absolute inset-y-0 left-0 w-1 rounded-tr-md rounded-br-md bg-primary " aria-hidden="true"></span>) : null}
                                </NavLink>)
                            }
                        </li>
                    )
                })}

            </ul>
        </div>
    )
}

export default LeftSidebar
