import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient, { isAuthenticated } from '../../api/apiClient';
import Logo from '../../components/Logo';
import ScrollingBackground from '../../components/ScrollingBackground';
import './../../index.css';
import hero from "./hero.jpg";

/**
 * Home component that serves as the landing page.
 * Includes a dynamic form to capture an email for later use on the registration page,
 * an image, and navigation links.
 */
const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          console.log('User is authenticated');
          navigate('/dashboard');
        } else {
          console.log('User is not authenticated');
        }
      } catch (error) {
        // Ignore the error. This sometimes happens in-dev if you save changes to this source file and reload too quickly.
        // Realistically, if we can't check auth (i.e. can't access the server) on the landing page, we should just show the landing page.
        console.log('Ignoring authentication error on the home page');
      }
    };

    checkAuth();
  }, [navigate]);

  const checkEmailAvailability = async () => {
    try {
      const response = await apiClient.post('/api/users/check_email', { email: email.trim() });
      return response.data.taken;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return false;
    }
  };

  const handleGetStarted = async () => {
    const isEmailInUse = await checkEmailAvailability();
    if (isEmailInUse) {
      navigate('/login', { state: { email, password } });
    } else {
      navigate('/register', { state: { email, password } });
    }
  };

  return (
    <div>
      <ScrollingBackground />
      <div className="relative z-10">
        <motion.div
          className="flex justify-center items-center min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="w-full px-4 sm:max-w-xl md:max-w-full lg:max-w-screen-2xl md:px-24 lg:px-8">
            <motion.div
              className="flex flex-col lg:flex-row items-center bg-background rounded overflow-hidden shadow-lg bg-white"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <div className="relative lg:w-1/2">
                <motion.img
                  src={hero}
                  alt=""
                  className="object-cover w-full h-550 lg:h-full"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1 }}
                />
                <svg
                  className="absolute top-0 right-0 hidden h-full text-background lg:inline-block"
                  viewBox="-1 -1 18 104"
                  fill="var(--color-background)"
                >
                  <polygon points="17.3036738 0 20 0 20 104 0.824555778 104" />
                </svg>
              </div>
              <div className="flex flex-col justify-center p-8 bg-background lg:p-16 lg:pl-10 lg:w-1/2">
                <motion.h5
                  className="mb-3 text-secondary font-extrabold leading-none lg:text-3xl md:text-3xl sm:text-2xl xs:text-lg"
                  whileHover={{ scale: 1.1 }}
                >
                  <Logo className="truncate" navigate={navigate} useClick={false} />
                </motion.h5>
                <motion.h5
                  className="mb-3 font-extrabold leading-none lg:text-xl md:text-base sm:text-sm text-secondary"
                  whileHover={{ scale: 1.06 }}
                >
                  Track issues effortlessly.
                </motion.h5>
                <motion.p
                  className="mb-5 text-secondary text-sm leading-relaxed lg:text-base md:text-sm sm:text-xs xs:text-xs"
                  whileHover={{ scale: 1.03 }}
                >
                  <span className="font-bold">IssueStream</span> simplifies how you log, track, and analyse issues of any kind, enhancing efficiency and productivity.
                  Use IssueStream to manage your tasks, get insights into better decision-making, and achieve swift, real-world problem resolution - for each and every issue.
                  Swim against the tide with IssueStream.
                </motion.p>

                {/* Get Started sign-up form */}
                <div className="flex w-full justify-between">
                  <motion.input
                    type="email"
                    id="email"
                    autoComplete="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 mb-3 mr-1 border-2 rounded hidden sm:block focus:border-primaryHover"
                  />
                  <motion.input
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="hidden"
                  />
                  <motion.button
                    type="submit"
                    onClick={handleGetStarted}
                    className="ml-4 xs:ml-0 inline-flex w-48 items-center justify-center h-12 px-6 font-medium rounded shadow-md bg-secondary hover:bg-primaryHover text-neutral"
                    whileHover={{ scale: 1.05 }}
                  >
                    Get Started
                  </motion.button>
                </div>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Alternate Sign-in link */}
                  <motion.div
                    className="pt-4 text-sm font-semibold leading-none sm:text-base md:text-lg text-secondary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                  >
                    Already a member?{' '}
                    <motion.span
                      className="text-dark"
                      whileHover={{ color: '#26A8DF' }} // Change to main accent color on hover
                    >
                      <Link to="/login">Sign in</Link>
                    </motion.span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;