import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconCaretDown from '../Icon/IconCaretDown';
import IconMinus from '../Icon/IconMinus';
import IconMenuInvoice from '../Icon/Menu/IconMenuInvoice';
import IconMenuUsers from '../Icon/Menu/IconMenuUsers';
import IconGlobe from '../Icon/IconGlobe';
import IconServer from '../Icon/IconServer';
import IconTxtFile from '../Icon/IconTxtFile';
import IconBook from '../Icon/IconBook';
import IconBarChart from '../Icon/IconBarChart';
import IconArchive from '../Icon/IconArchive';
import IconMapPin from '../Icon/IconMapPin';
import IconRouter from '../Icon/IconRouter';
import IconFolder from '../Icon/IconFolder';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-48 mx-auto p-3" src="/assets/images/auth/rsa-png.png" alt="logo" />
                        </NavLink>
                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            <li className="menu nav-item">
                                <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>
                                        <Link to="/index"> Dashboard</Link>
                                        {/* {t('user_and_pages')} */}
                                    </span>
                                </h2>
                            </li>

                            {/* <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>
                                    Users
                                </span>
                            </h2> */}

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'users' ? 'active' : ''} nav-link group w-full  py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1`} onClick={() => toggleMenu('users')}>
                                    <div className="flex items-center">
                                        <IconMenuUsers className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('users')}</span>
                                    </div>

                                    <div className={currentMenu !== 'users' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'users' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/users/staff">Staff Creation</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/users/company">Provider Creation</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/users/customer">Customer Creation</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/users/driver">Driver Creation </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/users/companycreation">Company Creation </NavLink>
                                        </li>
                                        
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {/* <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>
                                    Bookings
                                </span>
                            </h2> */}

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'bookings' ? 'active' : ''} nav-link group w-full py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1`} onClick={() => toggleMenu('bookings')}>
                                    <div className="flex items-center">
                                        <IconBook className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Bookings</span>
                                    </div>

                                    <div className={currentMenu !== 'bookings' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'bookings' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/bookings/newbooking">Bookings </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/bookings/booking">Add Booking </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/bookings/pendingbookings">Pending Bookings</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/bookings/closedbooking">Closed Bookings</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/bookings/approvedbooking">Approved Bookings</NavLink>
                                        </li>
                                       
                                        <li>
                                            <NavLink to="/bookings/cancelbooking">Canceled Bookings</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/bookings/invoicedbooking">Invoiced Bookings</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>
                            {/* <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>
                                    Status
                                </span>
                            </h2> */}
                            
                            {/* <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>
                                    ShowRooms
                                </span>
                            </h2> */}

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'showrooms' ? 'active' : ''} nav-link group w-full  py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1`} onClick={() => toggleMenu('showrooms')}>
                                    <div className="flex items-center">
                                        <IconGlobe className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">ShowRoom</span>
                                    </div>

                                    <div className={currentMenu !== 'showrooms' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'showrooms' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/showrooms/showroom">ShowRoom Details</NavLink>
                                        </li>
                                        {/* <li>
                                            <NavLink to="/showrooms/showrm">ShowRooms</NavLink>
                                        </li> */}
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {/* <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>
                                    Service
                                </span>
                            </h2> */}

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'service' ? 'active' : ''} nav-link group w-full py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1`} onClick={() => toggleMenu('service')}>
                                    <div className="flex items-center">
                                        <IconServer className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Service Types</span>
                                    </div>

                                    <div className={currentMenu !== 'service' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'service' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/service/service-type">Service Types</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/service/tarrif">Tarrif Details</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/service/adjustment"> Adjustments</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            <li className="menu nav-item ">
                                <button type="button" className={`${currentMenu === 'driverreport' ? 'active' : ''} nav-link group w-full py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1`} onClick={() => toggleMenu('driverreport')}>
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark"> &nbsp;  Driver Reports &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>
                                    </div>

                                    <div className={currentMenu !== 'driverreport' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'driverreport' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/driverreport">Driver Reports</NavLink>
                                        </li>
                                      
                                    </ul>
                                </AnimateHeight>
                            </li>

 {/* <li className="menu nav-item ">
                                <button type="button" className={`${currentMenu === 'location' ? 'active' : ''} nav-link group w-full py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1`} onClick={() => toggleMenu('location')}>
                                    <div className="flex items-center">
                                        <IconMapPin className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Base Location</span>
                                    </div>

                                    <div className={currentMenu !== 'location' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'location' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/baselocation/location">Base Location Details</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li> */}
                             <li className="menu nav-item">
                                <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>
                                       <Link to="/baselocation/location"> Base Location</Link>
                                        {/* {t('user_and_pages')} */}
                                    </span>
                                </h2>
                            </li>
                            {/* <li className="menu nav-item ">
                                <button type="button" className={`${currentMenu === 'status' ? 'active' : ''} nav-link group w-full py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1`} onClick={() => toggleMenu('status')}>
                                    <div className="flex items-center">
                                        <IconArchive className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark"> &nbsp;  Status &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>
                                    </div>

                                    <div className={currentMenu !== 'status' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'status' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/checkstatus/status">Status</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li> */}
                              <li className="menu nav-item">
                                <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>
                                       <Link to="/checkstatus/status"> Status</Link>
                                        {/* {t('user_and_pages')} */}
                                    </span>
                                </h2>
                            </li>

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>
                                    Reports
                                    {/* {t('user_and_pages')} */}
                                </span>
                            </h2>

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'general' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('general')}>
                                    <div className="flex items-center">
                                        <IconBarChart className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">General Reports</span>
                                    </div>

                                    <div className={currentMenu !== 'general' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'general' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/general/sales">Sales Summery</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/general/expense">expense Summery</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'financial' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('financial')}>
                                    <div className="flex items-center">
                                        <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Financial Reports</span>
                                    </div>

                                    <div className={currentMenu !== 'financial' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'financial' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/financial/balance">Balance Sheet</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/financial/profit">Profit and loss Report</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/financial/ledger">Ledger Report</NavLink>
                                        </li>
                                        {/* <li>
                                            <NavLink to="/users/profile">Receivable Report</NavLink>
                                        </li> */}
                                    </ul>
                                </AnimateHeight>
                            </li>

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'receivable' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('receivable')}>
                                    <div className="flex items-center">
                                        <IconTxtFile className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Receivable Report</span>
                                    </div>

                                    <div className={currentMenu !== 'receivable' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'receivable' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/receivable/invoicewise">Invoice wise Sheet</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/receivable/comcuswise">Company or Customer wise</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/receivable/comcusoutstanding">Compny /Customer Outstanding</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/receivable/payment">Payment Recieved</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>
                            <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'invoice' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('invoice')}>
                                            <div className="flex items-center">
                                                <IconMenuInvoice className="group-hover:!text-primary shrink-0" />
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('invoice')}</span>
                                            </div>

                                            <div className={currentMenu !== 'invoice' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                                <IconCaretDown />
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'invoice' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li>
                                                    <NavLink to="/apps/invoice/list">{t('list')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/apps/invoice/preview">{t('preview')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/apps/invoice/add">{t('add')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/apps/invoice/edit">{t('edit')}</NavLink>
                                                </li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>
                                    About
                                </span>
                            </h2>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
