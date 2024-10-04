import React from 'react'
import '../App.css'
const Login = () => {
    
  return (
    <div>
             <div className="background"></div>
        <div className="centering">
        <form className="my-form">
        <div className="login-welcome-row">
                    <img
                        className="login-welcome"
                        src="./assets/astronaut.jpg"
                        alt="Astronaut"
                    />
                    <h1>LogIn!</h1>
                </div>
                <div className="text-field">
                    <label htmlFor="email">Email:</label>
                    <input
                        aria-label="Email"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Your Email"
                        required
                    />
                    <img
                        alt="Email Icon"
                        title="Email Icon"
                        src="assets/email.svg"
                    />
                </div>
                <div className="text-field">
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        aria-label="Password"
                        name="password"
                        placeholder="Your Password"
                        title="Minimum 6 characters at least 1 Alphabet and 1 Number"
                        pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$"
                        required
                    />
                    <img
                        alt="Password Icon"
                        title="Password Icon"
                        src="assets/password.svg"
                    />
                </div>
                <input type="submit" className="my-form__button" value="Login" />
                <div className="my-form__actions">
                    <div className="my-form__row">
                        <span>Did you Forget your password?</span>
                        <a href="#" title="Reset Password">Reset Password</a>
                    </div>
                    <div className="my-form__signup">
                        <a href="#" title="Create Account">Create Account</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
  )
}

export default Login
