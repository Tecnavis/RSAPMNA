import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IRootState } from '../../store';
import { toggleSidebar, toggleTheme } from '../../store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import Dropdown from '../Dropdown';
import IconMenu from '../Icon/IconMenu';
import IconSun from '../Icon/IconSun';
import IconMoon from '../Icon/IconMoon';
import IconLaptop from '../Icon/IconLaptop';
import IconLogout from '../Icon/IconLogout';
import { FaCalculator, FaRegCalendarCheck } from 'react-icons/fa';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import Select, { SingleValue } from 'react-select';
interface ServiceData {
    name: string;
    basicSalaryKM: string;
    salaryPerKM: string;
    salary: string;
  }
  
const Header = () => {
  const location = useLocation();
  const role = sessionStorage.getItem('role');
  const userName = sessionStorage.getItem('username');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<{ value: string; label: string } | null>(null);
  const [showDistanceInput, setShowDistanceInput] = useState(false);
  const [distance, setDistance] = useState("");
  const [totalSalary, setTotalSalary] = useState<number>(0);
  let selectedServiceData: ServiceData | null = null;
  const [showSalary, setShowSalary] = useState(false);
  const uid = sessionStorage.getItem('uid') || '';
  const staffRole = sessionStorage.getItem('staffRole') || '';

  // Map serviceTypes to options for ReactSelect
  const serviceOptions = serviceTypes.map((service) => ({
    value: service,
    label: service,
  }));

  const dispatch = useDispatch();
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
  const { t } = useTranslation();

  useEffect(() => {
    // Highlight active menu link (existing logic)
    const selector = document.querySelector('ul.horizontal-menu a[href="' + window.location.pathname + '"]');
    if (selector) {
      selector.classList.add('active');
      const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
      for (let i = 0; i < all.length; i++) {
        all[0]?.classList.remove('active');
      }
      const ul: any = selector.closest('ul.sub-menu');
      if (ul) {
        let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
        if (ele) {
          ele = ele[0];
          setTimeout(() => {
            ele?.classList.add('active');
          });
        }
      }
    }
  }, [location]);

  const handleSignOut = () => {
    sessionStorage.removeItem('uid');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('username');
    navigate('/auth/cover-login');
  };
  const handleSelectChange = (newValue: SingleValue<{ value: string; label: string } | null>) => {
    setSelectedService(newValue);
  };
  // Function to fetch service types from Firestore
  const fetchServiceTypes = async () => {
    try {
      
      const db = getFirestore();
      const serviceRef = collection(db, `user/${uid}/service`);
      const querySnapshot = await getDocs(serviceRef);
      const services: string[] = [];
      querySnapshot.forEach((doc) => {
        services.push(doc.data().name);
      });
      setServiceTypes(services);
    } catch (error) {
      console.error("Error fetching service types:", error);
    }
  };

  // When the modal opens, fetch service types
  useEffect(() => {
    if (isModalOpen) {
      fetchServiceTypes();
    }
  }, [isModalOpen]);
  const handleCalculateSalary = async () => {
    if (!selectedService || !distance) {
      alert("Please select a service and enter distance.");
      return;
    }
  
    try {
     
  
      const db = getFirestore();
      const serviceRef = collection(db, `user/${uid}/service`);
      const querySnapshot = await getDocs(serviceRef);
  
      let selectedServiceData: ServiceData | null = null;
  
      querySnapshot.forEach((doc) => {
        const data = doc.data() as ServiceData;
        if (data.name === selectedService.value) {
          selectedServiceData = data;
        }
      });
  
      if (!selectedServiceData) {
        alert("Selected service not found.");
        return;
      }
  
      const { basicSalaryKM, salaryPerKM, salary } = selectedServiceData;
      const distanceValue = parseFloat(distance);
  
      if (isNaN(distanceValue)) {
        alert("Please enter a valid distance.");
        return;
      }
  
      const calculatedSalary = 
      (Number(distanceValue) - Number(basicSalaryKM)) * Number(salaryPerKM) + Number(salary);
    
    setTotalSalary(isNaN(calculatedSalary) ? 0 : calculatedSalary);
    
    } catch (error) {
      console.error("Error fetching service details:", error);
    }
  };
  
  return (
    <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
      <div className="shadow-sm">
        <div className="relative bg-white flex w-full items-center px-5 py-2.5 dark:bg-black">
          <div className="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
            <Link to="/index" className="main-logo flex items-center shrink-0">
              <img className="w-16 ltr:-ml-1 rtl:-mr-1 inline" src="/assets/images/auth/rsa-png.png" alt="logo" />
            </Link>
            <button
              type="button"
              className="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-primary dark:hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
              onClick={() => dispatch(toggleSidebar())}
            >
              <IconMenu className="w-5 h-5" />
            </button>
          </div>

          <div className="ltr:mr-2 rtl:ml-2 hidden sm:block">
            <ul className="flex items-center space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
              {/* Additional nav links can go here */}
            </ul>
          </div>

          <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
    {showSalary && <div className="sm:ltr:mr-auto sm:rtl:ml-auto">{totalSalary.toFixed(2)}</div>}
            
            <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
            <button
  className="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
  onClick={() => {
    setSelectedService(null);
    setDistance("");
    setTotalSalary(0);
    setIsModalOpen(true);
    setShowSalary(true); // Show salary when FaCalculator is clicked
  }}
>
  <FaCalculator className="w-5 h-5" />
</button>
<div className="flex items-center space-x-2">
<button
  className="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
  onClick={() => {
    if (role === 'staff') {
      navigate('/attendance');
    } else if (role === 'admin' || role === 'secondary admin') {
      navigate('/attendanceDetails');
    }
  }}
>
  <FaRegCalendarCheck className="w-5 h-5" />
</button>

</div>
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white dark:bg-black p-5 rounded-lg shadow-lg w-80 text-center">
                  <h2 className="text-xl font-semibold mb-4">Calculator</h2>
                  <div className="flex flex-col gap-3">
                    {/* ReactSelect dropdown instead of a button */}
                    <Select
  options={serviceOptions}
  value={selectedService}
  onChange={handleSelectChange} // Use explicitly typed function
  placeholder="Select Service Type"
  className="w-full"
/>
<div className="mt-4">
  <input
    type="text"
    value={distance}
    onChange={(e) => setDistance(e.target.value)}
    className="w-full border p-2 rounded"
    placeholder="Enter distance"
  />
</div>

<button className="bg-blue-500 text-white py-2 rounded" onClick={handleCalculateSalary}>
  Result
</button>
{totalSalary !== null && (
  <div className="mt-4 text-lg font-semibold">
    Total Amount: <span className="text-green-500">{totalSalary.toFixed(2)}</span>
  </div>
)}

                  </div>

                 

                  <button className="mt-4 text-gray-500 hover:text-gray-700" onClick={() => setIsModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            )}
            <div>
              {themeConfig.theme === 'light' && (
                <button
                  className="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                  onClick={() => dispatch(toggleTheme('dark'))}
                >
                  <IconSun />
                </button>
              )}

              {themeConfig.theme === 'dark' && (
                <button
                  className="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                  onClick={() => dispatch(toggleTheme('system'))}
                >
                  <IconMoon />
                </button>
              )}
              {themeConfig.theme === 'system' && (
                <button
                  className="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                  onClick={() => dispatch(toggleTheme('light'))}
                >
                  <IconLaptop />
                </button>
              )}
            </div>

            <div className="dropdown shrink-0 flex">
              <Dropdown
                offset={[0, 8]}
                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                btnClassName="relative group block"
                button={<img className="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100" src="/rsa-2[1].jpg" alt="userProfile" />}
              >
                <ul className="text-dark dark:text-white-dark !py-0 w-[230px] font-semibold dark:text-white-light/90">
                  <li>
                    <div className="flex items-center px-4 py-4">
                      <img className="rounded-md w-10 h-10 object-cover" src="/rsa-2[1].jpg" alt="userProfile" />
                      <div className="ltr:pl-4 rtl:pr-4 truncate">
                        <h4 className="text-base">{role === 'staff' ? userName : 'RSA Admin'}</h4>
                        <button type="button" className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white">
                          RSA@gmail.com
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="border-t border-white-light dark:border-white-light/10">
                    <button
                      type="button"
                      className="text-danger !py-3 flex items-center w-full"
                      onClick={handleSignOut}
                    >
                      <IconLogout className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 rotate-90 shrink-0" />
                      Sign Out
                    </button>
                  </li>
                </ul>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
