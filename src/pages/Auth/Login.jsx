import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, signInWithGoogle, auth } from '../../firebase/auth';
import { getRedirectResult } from 'firebase/auth';
import logo from '../../assets/images/logo.PNG';
import '../../css/Auth.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Complete Google redirect sign-in if returning from provider
    let active = true;
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!active) return;
        if (result && result.user) {
          navigate('/');
        }
      } catch (err) {
        // Swallow expected cases where no redirect is pending; show others
        console.warn('No redirect result or error completing redirect:', err);
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, displayName);
      }

      if (result.error) {
        setError(result.error);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
          <img src={logo} alt="LeafLens AI Logo" className="auth-logo" />
        
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button 
          className="google-auth-button"
          onClick={async () => {
            setLoading(true);
            setError('');
            try {
              const result = await signInWithGoogle();
              if (result.error) {
                setError(result.error);
              } else {
                // Detect Median.co Android wrapper
                const isAndroidWrapper = window.navigator.userAgent.includes("Median");
                if (isAndroidWrapper) {
                  navigate('/');
                  window.location.reload(); // Force reload for Android wrapper
                } else {
                  navigate('/');
                }
              }
            } catch (err) {
              setError('An unexpected error occurred. Please try again.');
            }
            setLoading(false);
          }}
          disabled={loading}
        >
          <img src="/google-icon.svg" alt="Google" className="google-icon" />
          Continue with Google
        </button>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            className="switch-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
