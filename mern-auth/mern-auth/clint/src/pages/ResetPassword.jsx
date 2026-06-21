import React, { useState, useRef, useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AppContent } from '../context/AppContext'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { backendUrl } = useContext(AppContent)

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otp, setOtp] = useState('') 
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // For button states
  
  const inputRefs = useRef([])

  const handleInput = (e, index) => {
    const value = e.target.value
    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').slice(0, 6)
    paste.split('').forEach((char, index) => {
      if (inputRefs.current[index]) inputRefs.current[index].value = char
    })
  }

  // --- Step 1: Send OTP ---
  const onEmailSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/send-reset-otp`, { email })
      if (data.success) {
        toast.success(data.message)
        setIsEmailSent(true)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Step 2: VERIFY OTP (Check before moving to Step 3) ---
  const onOtpSubmit = async (e) => {
    e.preventDefault()
    const otpValue = inputRefs.current.map(i => i.value).join('')
    if (otpValue.length !== 6) {
      return toast.error('Please enter 6-digit OTP')
    }

    // Optional: If your backend has a standalone verify-otp route, call it here.
    // Otherwise, we store it and move forward. 
    // To ensure "if wrong form will appear again", we simply set state.
    setOtp(otpValue)
    setIsOtpSubmitted(true)
  }

  // --- Step 3: Final Submission ---
  const onResetSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/reset-password`, { 
        email, 
        otp, 
        newPassword 
      })
      if (data.success) {
        toast.success(data.message)
        navigate('/login')
      } else {
        toast.error(data.message)
        // If password reset fails due to wrong OTP, kick them back to OTP step
        if(data.message.toLowerCase().includes('otp')){
            setIsOtpSubmitted(false)
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || ""
      toast.error(msg || error.message)
      // BACK TO OTP FORM IF WRONG
      if(msg.toLowerCase().includes('otp')){
        setIsOtpSubmitted(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Reusable button class with click effect
  const btnClass = "w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3 transition-all active:scale-95 active:opacity-80 disabled:opacity-50"

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400">
      <img
        onClick={() => navigate('/')}
        src={assets.logo}
        alt="logo"
        className="absolute left-5 sm:left-20 top-5 w-28 sm:w-48 cursor-pointer"
      />

      {/* 1. Email Form */}
      {!isEmailSent && (
        <form onSubmit={onEmailSubmit} className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm">
          <h1 className="text-white text-2xl font-semibold text-center mb-4">Reset Password</h1>
          <p className="text-center mb-6 text-indigo-300">Enter your registered email</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <img src={assets.mail_icon} alt="" className='w-3 h-3' />
            <input type="email" placeholder='Email id' className='bg-transparent outline-none text-white w-full' value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button disabled={isLoading} className={btnClass}>
            {isLoading ? "Sending..." : "Submit"}
          </button>
        </form>
      )}

      {/* 2. OTP Form */}
      {isEmailSent && !isOtpSubmitted && (
        <form onSubmit={onOtpSubmit} className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm">
          <h1 className="text-white text-2xl font-semibold text-center mb-4">Enter OTP</h1>
          <p className="text-center mb-6 text-indigo-300">Enter the 6-digit code sent to your email.</p>
          <div className="flex justify-between mb-8" onPaste={handlePaste}>
            {Array(6).fill(0).map((_, i) => (
              <input key={i} type="text" maxLength="1" className="w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md outline-none focus:border-indigo-500 border border-transparent" ref={el => inputRefs.current[i] = el} onInput={(e) => handleInput(e, i)} onKeyDown={(e) => handleKeyDown(e, i)} required />
            ))}
          </div>
          <button className={btnClass}>Verify OTP</button>
        </form>
      )}

      {/* 3. New Password Form */}
      {isOtpSubmitted && (
        <form onSubmit={onResetSubmit} className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm">
          <h1 className="text-white text-2xl font-semibold text-center mb-4">New Password</h1>
          <p className="text-center mb-6 text-indigo-300">Enter your new password below</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <img src={assets.lock_icon} alt="" className='w-3 h-3' />
            <input type="password" placeholder='New Password' 
              className='bg-transparent outline-none text-white w-full' 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>
          <button disabled={isLoading} className={btnClass}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  )
}

export default ResetPassword