import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

// ─── Validation helpers ────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function validate(fields) {
  const errors = {};
  if (!fields.name.trim()) errors.name = 'Name is required.';
  if (!fields.email.trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(fields.email)) errors.email = 'Enter a valid email address.';
  if (!fields.subject.trim()) errors.subject = 'Subject is required.';
  if (!fields.message.trim()) errors.message = 'Message is required.';
  else if (fields.message.trim().length < 10) errors.message = 'Message must be at least 10 characters.';
  return errors;
}

// ─── Theme-driven style maps ───────────────────────────────────────────────────
function getStyles(isDark) {
  return {
    backdrop: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)',
    modalBg: isDark ? '#0f172a' : '#ffffff',
    modalBorder: isDark ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.25)',
    modalShadow: isDark
      ? '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.15)'
      : '0 25px 60px rgba(0,0,0,0.15), 0 0 40px rgba(99,102,241,0.1)',
    headingGradient: isDark
      ? 'linear-gradient(135deg, #a78bfa, #ec4899)'
      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    subtext: isDark ? 'rgba(255,255,255,0.45)' : '#6b7280',
    label: isDark ? 'rgba(255,255,255,0.7)' : '#374151',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
    inputBorder: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    inputFocusBorder: '#6366f1',
    inputText: isDark ? '#ffffff' : '#111827',
    inputPlaceholder: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af',
    closeColor: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af',
    closeHover: isDark ? '#ffffff' : '#374151',
  };
}

// ─── Field component ───────────────────────────────────────────────────────────
function Field({ label, error, s, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: s.label, letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 11.5, color: '#ef4444', fontWeight: 500 }}>{error}</span>
      )}
    </div>
  );
}

// ─── Main widget ───────────────────────────────────────────────────────────────
export default function FeedbackWidget() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const s = getStyles(isDark);

  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [tabHovered, setTabHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const firstInputRef = useRef(null);
  const timerRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Focus first input when modal opens
  useEffect(() => {
    if (open && !success) {
      setTimeout(() => firstInputRef.current?.focus(), 60);
    }
  }, [open, success]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Reset after transition
    setTimeout(() => {
      setFields({ name: '', email: '', subject: '', message: '' });
      setErrors({});
      setSuccess(false);
      setSubmitting(false);
      setSubmitError(null);
    }, 250);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('https://formspree.io/f/xojyywpo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email,
          subject: fields.subject,
          message: fields.message,
        }),
      });
      if (!response.ok) throw new Error('Failed');
      setSuccess(true);
      timerRef.current = setTimeout(handleClose, 3000);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Shared input style builder
  const inputStyle = (name) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1.5px solid ${focusedField === name ? s.inputFocusBorder : errors[name] ? '#ef4444' : s.inputBorder}`,
    background: s.inputBg,
    color: s.inputText,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    resize: 'vertical',
  });

  return (
    <>
      {/* ── Floating tab ─────────────────────────────────────────────────────── */}
      <button
        id="feedback-tab-btn"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setTabHovered(true)}
        onMouseLeave={() => setTabHovered(false)}
        aria-label="Open feedback form"
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: `translateY(-50%) translateX(${tabHovered ? '-4px' : '0px'})`,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 112,
          background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px 0 0 10px',
          cursor: 'pointer',
          boxShadow: tabHovered
            ? '-4px 0 24px rgba(99,102,241,0.5)'
            : '-2px 0 12px rgba(99,102,241,0.3)',
          filter: tabHovered ? 'brightness(1.15)' : 'brightness(1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
          padding: 0,
          userSelect: 'none',
        }}
      >
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Feedback
        </span>
      </button>

      {/* ── Modal overlay ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          id="feedback-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: s.backdrop,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Feedback form"
            style={{
              width: '100%',
              maxWidth: 480,
              background: s.modalBg,
              border: s.modalBorder,
              borderRadius: 16,
              boxShadow: s.modalShadow,
              overflow: 'hidden',
              fontFamily: 'inherit',
              animation: 'fbSlideUp 0.22s ease',
            }}
          >

            {/* Header */}
            <div style={{ padding: '28px 28px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    background: s.headingGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.3px',
                  }}
                >
                  Send us Feedback
                </h2>
                <button
                  id="feedback-modal-close"
                  onClick={handleClose}
                  onMouseEnter={() => setCloseHovered(true)}
                  onMouseLeave={() => setCloseHovered(false)}
                  aria-label="Close"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 22,
                    lineHeight: 1,
                    color: closeHovered ? s.closeHover : s.closeColor,
                    padding: '2px 4px',
                    borderRadius: 6,
                    transition: 'color 0.15s',
                    marginTop: -2,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ margin: '0 0 24px', fontSize: 13.5, color: s.subtext, lineHeight: 1.5 }}>
                We read every message. Help us improve StreakBoard.
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '0 28px 28px' }}>
              {success ? (
                /* ── Success state ── */
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px 0 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 30,
                      boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: isDark ? '#fff' : '#111827' }}>
                      Thank you! 🎉
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 14, color: s.subtext }}>
                      Your feedback has been received.
                    </p>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: s.inputPlaceholder }}>
                    Closing automatically…
                  </p>
                </div>
              ) : (
                /* ── Form ── */
                <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {submitError && (
                    <div style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.35)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#ef4444',
                      fontWeight: 500,
                    }}>
                      {submitError}
                    </div>
                  )}

                  <Field label="Name" error={errors.name} s={s}>
                    <input
                      ref={firstInputRef}
                      id="feedback-name"
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={fields.name}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      disabled={submitting}
                      style={inputStyle('name')}
                    />
                  </Field>

                  <Field label="Email" error={errors.email} s={s}>
                    <input
                      id="feedback-email"
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={fields.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      disabled={submitting}
                      style={inputStyle('email')}
                    />
                  </Field>

                  <Field label="Subject" error={errors.subject} s={s}>
                    <input
                      id="feedback-subject"
                      type="text"
                      name="subject"
                      placeholder="What's this about?"
                      value={fields.subject}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                      disabled={submitting}
                      style={inputStyle('subject')}
                    />
                  </Field>

                  <Field label="Message" error={errors.message} s={s}>
                    <textarea
                      id="feedback-message"
                      name="message"
                      rows={4}
                      placeholder="Tell us what's on your mind..."
                      value={fields.message}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      disabled={submitting}
                      style={{ ...inputStyle('message'), minHeight: 96 }}
                    />
                  </Field>

                  {/* Submit button */}
                  <button
                    id="feedback-submit-btn"
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      height: 48,
                      border: 'none',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#ffffff',
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.75 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      marginTop: 4,
                      transition: 'filter 0.2s, transform 0.15s',
                      filter: 'brightness(1)',
                      letterSpacing: '0.01em',
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.filter = 'brightness(1.12)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'brightness(1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {submitting ? (
                      <>
                        <svg
                          style={{ width: 18, height: 18, animation: 'fbSpin 0.8s linear infinite', flexShrink: 0 }}
                          viewBox="0 0 24 24" fill="none"
                        >
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      'Send Feedback ✦'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Keyframe animations injected once ───────────────────────────────── */}
      <style>{`
        @keyframes fbSlideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes fbSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        #feedback-name::placeholder,
        #feedback-email::placeholder,
        #feedback-subject::placeholder,
        #feedback-message::placeholder {
          color: ${s.inputPlaceholder};
        }
      `}</style>
    </>
  );
}
