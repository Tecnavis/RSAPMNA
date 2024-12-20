import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

const LoginCover = () => {
    const [email, setEmail] = useState(""); // Admin email
    const [username, setUsername] = useState(""); // Staff username
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
    const [role, setRole] = useState("admin"); // Default to admin
    const [errorMessage, setErrorMessage] = useState(""); // State to store error messages
    const navigate = useNavigate();
    const uid = import.meta.env.VITE_REACT_APP_UID
    useEffect(() => {
        // If the user is already signed in, redirect to the home page
        if (sessionStorage.getItem('uid')) {
            navigate('/index');
        }
    }, [navigate]);

    const signIn = () => {
        // Store role in local storage
        localStorage.setItem('role', role);

        const db = getFirestore();
        const auth = getAuth();

        if (role === "staff") {
            checkStaffCredentials();
        } else {
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    const uid = user.uid;
                    sessionStorage.setItem('uid', uid);
                    sessionStorage.setItem('role', role);

                    console.log("User signed in:", uid);
                    navigate('/index'); // Redirect to home page or any other route
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error("Error signing in:", errorCode, errorMessage);
                    setErrorMessage("Incorrect email or password. Please try again."); // Set error message
                });
        }
    };

    const checkStaffCredentials = async () => {
        const db = getFirestore();
    
        try {
            console.log("Attempting to fetch staff credentials...");
            console.log(`Username: ${username}, Password: ${password}, Role:${role}`);
    
            const q = query(
                collection(db, `user/${uid}/users`),
                where('userName', '==', username),
                where('password', '==', password),
                where('role', '==', 'staff')
            );
            
            console.log("Query created, executing the query...");
            
            const querySnapshot = await getDocs(q);
            
            console.log("Query executed, processing the results...");
    
            if (!querySnapshot.empty) {
                let userId = null;
                
                querySnapshot.forEach(doc => {
                    console.log("Document found:", doc.id, doc.data());
                    userId = doc.id;
                });

                sessionStorage.setItem('role', role);
                sessionStorage.setItem('username', username); // Store username
                sessionStorage.setItem('uid', uid);
                sessionStorage.setItem('password', password);

                console.log("Staff user signed in successfully with UID:", userId);
                navigate('/index');
            } else {
                console.error("Invalid credentials for staff: No matching document found.");
                setErrorMessage("Incorrect username or password. Please try again."); // Set error message
            }
        } catch (error) {
            console.error("Error fetching staff credentials:", error);
            setErrorMessage("An error occurred. Please try again later."); // Set error message for any other errors
        }
    };
    
    const handleRoleChange = (e:any) => {
        setRole(e.target.value);
        // Clear email/username and password when role changes
        setEmail("");
        setUsername("");
        setPassword("");
        setErrorMessage(""); // Clear any previous error message
    };

    const handleSubmit = (event:any) => {
        event.preventDefault();
        setErrorMessage(""); // Clear any previous error message before attempting sign-in
        signIn();
    };

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="background" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="object1" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="object3" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="polygon" className="absolute bottom-0 end-[28%]" />
                <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative hidden w-full items-center justify-center p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]" style={{ background: 'linear-gradient(225deg, rgba(255, 255, 255, 1) 0%, rgba(255, 0, 0, 1) 100%)' }}>
                        <div className="absolute inset-y-0 w-8 from-primary/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"></div>
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                            <Link to="/" className="w-48 block lg:w-72 ms-10">
                                <img src='/assets/images/auth/rsa-png.png' alt='logo' className="w-full"/>
                            </Link>
                            <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                                <img src="/assets/images/auth/login.svg" alt="login" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                        </div>
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-danger md:text-4xl">Sign in</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Enter your email/username and password to login</p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="Role">Role</label>
                                    <select
                                        id="Role"
                                        value={role}
                                        onChange={handleRoleChange}
                                        className="form-input"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="Email">Email/Username</label>
                                    <div className="relative text-white-dark">
                                        {role === "admin" ? (
                                            <input 
                                                id="Email" 
                                                type="text" 
                                                placeholder="Enter Email" 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)} 
                                                className="form-input ps-10 placeholder:text-white-dark" 
                                            />
                                        ) : (
                                            <input 
                                                id="Username" 
                                                type="text" 
                                                placeholder="Enter Username" 
                                                value={username} 
                                                onChange={(e) => setUsername(e.target.value)} 
                                                className="form-input ps-10 placeholder:text-white-dark" 
                                            />
                                        )}
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password">Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"} // Conditionally set input type
                                            placeholder="Enter Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="form-input ps-10 placeholder:text-white-dark"
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconLockDots fill={true} />
                                        </span>
                                        {/* Toggle eye icons */}
                                        <span
                                            className="absolute end-4 top-1/2 -translate-y-1/2 cursor-pointer"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>
                                </div>
                                {/* Display error message */}
                                {errorMessage && (
                                    <div className="text-red-500 text-sm">{errorMessage}</div>
                                )}
                                <div>
                                <button
                                    type="submit"
                                    className="btn-primary mt-4 w-full rounded-md bg-danger py-3 text-center text-base font-medium text-white shadow-md transition hover:bg-danger-dark focus:outline-none focus:ring-2 focus:ring-danger-dark"
                                >
                                    Sign In
                                </button>
                                </div>
                            </form>
                            <div className="mt-4 flex items-center justify-between">
                                <Link to="#" className="block text-sm font-bold text-white-dark hover:text-danger">
                                    Forgot Password?
                                </Link>
                                <Link to="/signup-cover" className="block text-sm font-bold text-white-dark hover:text-danger">
                                    Create Account
                                </Link>
                            </div>
                        </div>
                        <div className="absolute bottom-0 end-0 hidden md:block">
                            <img src="/assets/images/auth/polygon-object2.svg" alt="polygon" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginCover;
