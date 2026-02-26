// frontend/src/components/AuthModal.jsx
// Firebase auth: Email/Password + Google + Phone (OTP)
import { useState, useRef, useEffect } from "react";
import {
  loginWithEmail, registerWithEmail, loginWithGoogle,
  resetPassword, auth,
  RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider
} from "../firebase";
import { authAPI } from "../api";
import { C, S } from "../constants";

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // login | register | reset | resetSent | phone | phoneVerify
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"", phone:"", otp:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaRef = useRef(null);
  const recaptchaWidgetRef = useRef(null);
  const up = (k,v) => setForm(f => ({...f,[k]:v}));

  // Setup invisible reCAPTCHA for phone auth
  useEffect(() => {
    if (mode === "phone" && !recaptchaWidgetRef.current) {
      try {
        recaptchaWidgetRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: "invisible",
          callback: () => {},
        });
      } catch (e) {
        console.error("RecaptchaVerifier error:", e);
      }
    }
  }, [mode]);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(form.email, form.password);
      } else if (mode === "register") {
        if (form.password !== form.confirm) { setError("Passwords do not match"); setLoading(false); return; }
        if (form.password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }
        if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) { setError("Password needs at least 1 uppercase letter and 1 number"); setLoading(false); return; }
        await registerWithEmail(form.email, form.password, form.name);
        try { await authAPI.createProfile({ name: form.name, email: form.email }); } catch(_) {}
      } else if (mode === "reset") {
        await resetPassword(form.email);
        setError(""); setMode("resetSent");
        setLoading(false); return;
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      const msgs = {
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/email-already-in-use": "An account with this email already exists",
        "auth/invalid-email": "Please enter a valid email address",
        "auth/network-request-failed": "Network error — check your connection",
      };
      setError(msgs[e.code] || e.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const cred = await loginWithGoogle();
      try { await authAPI.createProfile({ name: cred.user.displayName, email: cred.user.email }); } catch(_) {}
      onSuccess?.(); onClose();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handlePhoneSend = async () => {
    setError(""); setLoading(true);
    if (!form.phone || form.phone.length < 10) { setError("Enter a valid phone number (e.g., +2348012345678)"); setLoading(false); return; }
    try {
      const result = await signInWithPhoneNumber(auth, form.phone, recaptchaWidgetRef.current);
      setConfirmationResult(result);
      setMode("phoneVerify");
    } catch (e) {
      const msgs = {
        "auth/invalid-phone-number": "Invalid phone number format. Use international format (e.g., +234...)",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/captcha-check-failed": "reCAPTCHA verification failed. Please refresh and try again.",
      };
      setError(msgs[e.code] || e.message);
    }
    setLoading(false);
  };

  const handlePhoneVerify = async () => {
    setError(""); setLoading(true);
    if (!form.otp || form.otp.length < 6) { setError("Please enter the 6-digit code"); setLoading(false); return; }
    try {
      await confirmationResult.confirm(form.otp);
      try { await authAPI.createProfile({ phone: form.phone }); } catch(_) {}
      onSuccess?.(); onClose();
    } catch (e) {
      setError(e.code === "auth/invalid-verification-code" ? "Invalid code. Please try again." : e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",padding:16 }}>
      <div style={{ background:C.bg2,borderRadius:12,width:"100%",maxWidth:420,border:`1px solid ${C.burg}40` }}>
        <div style={{ padding:"26px 28px 18px",borderBottom:`1px solid ${C.burg}30`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={S.label}>Kutunza Gourmet</div>
            <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:22,color:C.cream,fontStyle:"italic" }}>
              {mode==="login"?"Welcome Back":mode==="register"?"Create Account":mode==="reset"?"Reset Password":mode==="resetSent"?"Check Your Email":mode==="phone"?"Phone Sign-In":"Verify Code"}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.textDim,fontSize:18,cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:"20px 28px 26px",display:"flex",flexDirection:"column",gap:14 }}>
          {mode === "resetSent" ? (
            <div style={{ textAlign:"center",padding:"20px 0" }}>
              <div style={{ fontSize:44,marginBottom:12 }}>📧</div>
              <div style={{ color:C.cream,fontFamily:"'Cormorant Garamond', serif",fontSize:18,marginBottom:8 }}>Reset link sent!</div>
              <div style={{ color:C.textDim,fontSize:13,marginBottom:20 }}>Check your email for a password reset link.</div>
              <button onClick={() => setMode("login")} style={{ ...S.btn("burg") }}>Back to Login</button>
            </div>
          ) : mode === "phone" ? (
            <>
              {error && <div style={{ background:`${C.red}20`,border:`1px solid ${C.redLight}30`,borderRadius:6,padding:"10px 12px",color:C.redLight,fontSize:12 }}>{error}</div>}
              <div><label style={S.label}>Phone Number</label><input style={S.input} type="tel" placeholder="+234 801 234 5678" value={form.phone} onChange={e=>up("phone",e.target.value)}/></div>
              <div style={{ color:C.textDim, fontSize:11 }}>Enter your phone number in international format (e.g., +2348012345678). We'll send a verification code via SMS.</div>
              <button onClick={handlePhoneSend} disabled={loading} style={{ ...S.btn("gold"),width:"100%",padding:"13px",opacity:loading?0.7:1 }}>
                {loading?"⏳ Sending...":"Send Verification Code"}
              </button>
              <div ref={recaptchaRef}></div>
              <button onClick={() => { setMode("login"); setError(""); }} style={{ background:"none",border:"none",color:C.goldLight,cursor:"pointer",fontSize:12 }}>← Back to email login</button>
            </>
          ) : mode === "phoneVerify" ? (
            <>
              {error && <div style={{ background:`${C.red}20`,border:`1px solid ${C.redLight}30`,borderRadius:6,padding:"10px 12px",color:C.redLight,fontSize:12 }}>{error}</div>}
              <div style={{ textAlign:"center",padding:"10px 0" }}>
                <div style={{fontSize:36,marginBottom:8}}>📱</div>
                <div style={{color:C.cream,fontSize:14,marginBottom:4}}>Code sent to <strong>{form.phone}</strong></div>
                <div style={{color:C.textDim,fontSize:12}}>Enter the 6-digit verification code</div>
              </div>
              <div><label style={S.label}>Verification Code</label><input style={{...S.input,textAlign:"center",letterSpacing:"0.5em",fontSize:18}} maxLength={6} placeholder="000000" value={form.otp} onChange={e=>up("otp",e.target.value.replace(/\D/g,""))}/></div>
              <button onClick={handlePhoneVerify} disabled={loading} style={{ ...S.btn("gold"),width:"100%",padding:"13px",opacity:loading?0.7:1 }}>
                {loading?"⏳ Verifying...":"Verify & Sign In"}
              </button>
              <button onClick={() => { setMode("phone"); setError(""); setConfirmationResult(null); }} style={{ background:"none",border:"none",color:C.goldLight,cursor:"pointer",fontSize:12 }}>← Resend code</button>
            </>
          ) : (
            <>
              {error && <div style={{ background:`${C.red}20`,border:`1px solid ${C.redLight}30`,borderRadius:6,padding:"10px 12px",color:C.redLight,fontSize:12 }}>{error}</div>}
              {mode === "register" && <div><label style={S.label}>Full Name</label><input style={S.input} placeholder="Your full name" value={form.name} onChange={e=>up("name",e.target.value)}/></div>}
              <div><label style={S.label}>Email Address</label><input style={S.input} type="email" placeholder="your@email.com" value={form.email} onChange={e=>up("email",e.target.value)}/></div>
              {mode !== "reset" && <div><label style={S.label}>Password</label><input style={S.input} type="password" placeholder={mode==="login"?"Your password":"Min 6 characters"} value={form.password} onChange={e=>up("password",e.target.value)}/></div>}
              {mode === "register" && <div><label style={S.label}>Confirm Password</label><input style={S.input} type="password" placeholder="Repeat password" value={form.confirm} onChange={e=>up("confirm",e.target.value)}/></div>}

              <button onClick={handleSubmit} disabled={loading} style={{ ...S.btn("gold"),width:"100%",padding:"13px",opacity:loading?0.7:1 }}>
                {loading?"⏳ Please wait...":(mode==="login"?"Sign In":mode==="register"?"Create Account":"Send Reset Link")}
              </button>

              {mode !== "reset" && (
                <>
                  <button onClick={handleGoogle} disabled={loading} style={{ ...S.btn("ghost"),width:"100%",padding:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                    <span style={{ fontSize:16 }}>G</span> Continue with Google
                  </button>
                  <button onClick={() => { setMode("phone"); setError(""); }} style={{ ...S.btn("ghost"),width:"100%",padding:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                    📱 Sign in with Phone
                  </button>
                </>
              )}

              <div style={{ display:"flex",justifyContent:"space-between",paddingTop:4 }}>
                {mode === "login" ? (
                  <>
                    <button onClick={() => { setMode("reset"); setError(""); }} style={{ background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:12 }}>Forgot password?</button>
                    <button onClick={() => { setMode("register"); setError(""); }} style={{ background:"none",border:"none",color:C.goldLight,cursor:"pointer",fontSize:12 }}>Create account →</button>
                  </>
                ) : (
                  <button onClick={() => { setMode("login"); setError(""); }} style={{ background:"none",border:"none",color:C.goldLight,cursor:"pointer",fontSize:12 }}>← Back to login</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
