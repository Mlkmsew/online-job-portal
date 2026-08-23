// ============================================
// Contact Us Page - OnlineJob Portal
// Modern, premium contact page with hero, form & info card
// ============================================
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiMessageCircle,
  FiSend,
  FiPhone,
  FiMapPin,
  FiCheckCircle,
} from 'react-icons/fi';
import api from '../services/api';

const inputClasses =
  'w-full rounded-xl border border-[#D8E2DF] dark:border-gray-700 bg-white dark:bg-gray-900 py-3 pl-12 pr-4 text-sm text-[#0F1F33] dark:text-gray-100 placeholder:text-[#8FA0AF] dark:placeholder:text-gray-500 shadow-sm transition focus:border-[#1769E0] focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20';

const fieldIcons = {
  name: FiUser,
  email: FiMail,
  message: FiMessageCircle,
};

const Contact = () => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data) => {
    try {
      await api.post('/contact', data);
      toast.success(t('contact.successMessage', { defaultValue: 'Message sent successfully!' }));
      setSubmitted(true);
      reset();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        t('contact.errorMessage', { defaultValue: 'Unable to send your message right now.' });
      toast.error(message);
    }
  };

  const field = (name, type, placeholder, Icon, rules, multiline) => (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1769E0]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {multiline ? (
          <textarea
            {...register(name, rules)}
            rows={5}
            placeholder={placeholder}
            className={`${inputClasses} resize-none`}
          />
        ) : (
          <input
            {...register(name, rules)}
            type={type}
            placeholder={placeholder}
            className={inputClasses}
          />
        )}
      </div>
      {errors[name] && (
        <p className="mt-1.5 text-sm text-red-500">{errors[name].message}</p>
      )}
    </div>
  );

  const contactBlocks = [
    {
      icon: FiMail,
      title: t('contact.info.emailLabel', { defaultValue: 'Email' }),
      items: [
        { label: 'melkamsewalehegn@gmail.com', href: 'mailto:melkamsewalehegn@gmail.com' },
        { label: 'yimer5759@gmail.com', href: 'mailto:yimer5759@gmail.com' },
      ],
    },
    {
      icon: FiPhone,
      title: t('contact.info.phoneLabel', { defaultValue: 'Phone' }),
      items: ['+251 911 123 456', '+251 911 123 457', '+251 911 123 458'],
    },
    {
      icon: FiMapPin,
      title: t('contact.info.addressLabel', { defaultValue: 'Address' }),
      items: [t('contact.info.addressValue', { defaultValue: 'Debre Berhan, Ethiopia' })],
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F9F7] dark:bg-[#0B1220]">
      {/* ===== DECORATIVE BACKGROUND SHAPES ===== */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <svg
          className="absolute bottom-0 left-0 w-[480px] max-w-full text-[#1769E0]/15"
          viewBox="0 0 500 220"
          fill="currentColor"
        >
          <path d="M0 220 C 60 150, 140 130, 220 150 C 300 170, 380 110, 500 160 L 500 220 Z" />
        </svg>
        <svg
          className="absolute bottom-24 right-0 w-[420px] max-w-full text-[#BFDBFE]"
          viewBox="0 0 400 200"
          fill="currentColor"
        >
          <path d="M400 200 C 340 130, 240 120, 160 150 C 90 175, 40 150, 0 180 L 0 200 Z" />
        </svg>
        <svg
          className="absolute bottom-40 right-10 w-72 text-[#0F1F33]/10"
          viewBox="0 0 300 160"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M0 80 Q 75 20 150 60 T 300 30" />
          <path d="M0 120 Q 90 60 170 100 T 300 70" />
        </svg>
      </div>

      {/* ===== HERO BACKGROUND ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-bg.png"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/45 to-[#F3F9F7] dark:from-[#0B1220]/70 dark:via-[#0B1220]/45 dark:to-[#0B1220]" />
        </div>

        {/* subtle decorative elements */}
        <div
          className="absolute left-10 top-16 hidden h-24 w-24 rounded-full lg:block"
          style={{
            backgroundImage: 'radial-gradient(circle, #1769E0 1.5px, transparent 1.5px)',
            backgroundSize: '16px 16px',
            opacity: 0.35,
          }}
          aria-hidden="true"
        />
        <div className="absolute bottom-16 left-1/3 hidden h-14 w-14 rounded-full bg-white/40 blur-sm lg:block" aria-hidden="true" />

        {/* hero content */}
        <div className="relative container-custom px-4 py-16 text-center sm:py-20 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#1769E0] dark:text-blue-400">
            {t('contact.title', { defaultValue: 'Contact Us' })}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-[#0F1F33] dark:text-gray-100 sm:text-5xl lg:text-6xl">
            {t('contact.headlineA', { defaultValue: 'Have a Question?' })}{' '}
            <span className="text-[#1769E0]">
              {t('contact.headlineB', { defaultValue: "We're Here to Help." })}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#536273] dark:text-gray-400 sm:text-lg">
            {t('contact.subtitle', {
              defaultValue:
                'Whether you have a question, need support, or want to work with us, feel free to reach out. We will get back to you as soon as possible.',
            })}
          </p>
        </div>
      </section>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="container-custom relative z-10 px-4 pb-24">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT — CONTACT FORM */}
          <div className="rounded-[22px] bg-white dark:bg-gray-900 p-6 shadow-xl sm:p-8 lg:col-span-3 lg:p-10">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF2FE] dark:bg-blue-900/25 text-[#1769E0] dark:text-blue-400">
                  <FiCheckCircle className="h-10 w-10" aria-hidden="true" />
                </span>
                <h2 className="mt-6 text-2xl font-extrabold text-[#0F1F33] dark:text-gray-100">
                  {t('contact.successTitle', { defaultValue: 'Message Sent Successfully!' })}
                </h2>
                <p className="mt-3 max-w-md text-[#536273] dark:text-gray-400">
                  {t('contact.successText', {
                    defaultValue:
                      'Thank you for contacting OnlineJob Portal. We will get back to you shortly.',
                  })}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-8 rounded-xl border border-[#1769E0] px-6 py-3 text-sm font-semibold text-[#1769E0] dark:text-blue-400 transition hover:bg-[#EAF2FE] dark:hover:bg-blue-900/25"
                >
                  {t('contact.sendAnother', { defaultValue: 'Send Another Message' })}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[#EAF2FE] dark:bg-blue-900/25 text-[#1769E0] dark:text-blue-400">
                    <FiSend className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h2 className="text-lg font-bold leading-snug text-[#0F1F33] dark:text-gray-100 sm:text-xl">
                    {t('contact.subtitle2', {
                      defaultValue: 'Send us a message',
                    })}
                  </h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                  {field(
                    'name',
                    'text',
                    t('contact.form.name', { defaultValue: 'Your Name' }),
                    fieldIcons.name,
                    { required: t('contact.form.nameRequired', { defaultValue: 'Please enter your name.' }) }
                  )}
                  {field(
                    'email',
                    'email',
                    t('contact.form.email', { defaultValue: 'Your Email' }),
                    fieldIcons.email,
                    {
                      required: t('contact.form.emailRequired', { defaultValue: 'Please enter your email.' }),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('contact.form.emailInvalid', { defaultValue: 'Please enter a valid email address.' }),
                      },
                    }
                  )}
                  {field(
                    'message',
                    'text',
                    t('contact.form.message', { defaultValue: 'Your Message' }),
                    fieldIcons.message,
                    {
                      required: t('contact.form.messageRequired', { defaultValue: 'Please enter your message.' }),
                      minLength: {
                        value: 10,
                        message: t('contact.form.messageMin', { defaultValue: 'Message must be at least 10 characters.' }),
                      },
                    },
                    true
                  )}

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1769E0] to-[#0D4FB0] py-4 text-base font-semibold text-white shadow-lg shadow-[#1769E0]/20 transition hover:shadow-xl hover:brightness-110"
                  >
                    <FiSend className="h-5 w-5" aria-hidden="true" />
                    {t('contact.form.submit', { defaultValue: 'Send Message' })}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* RIGHT — GET IN TOUCH */}
          <aside className="rounded-[22px] border border-white/60 bg-white/70 dark:bg-gray-900/70 p-6 shadow-xl backdrop-blur-md sm:p-8 lg:col-span-2 lg:p-10">
            <h2 className="text-2xl font-extrabold text-[#0F1F33] dark:text-gray-100">
              {t('contact.getInTouch', { defaultValue: 'Get in Touch' })}
            </h2>
            <span className="mt-3 block h-1 w-12 rounded-full bg-[#1769E0]" aria-hidden="true" />

            <div className="mt-8 divide-y divide-[#D8E2DF] dark:divide-gray-800">
              {contactBlocks.map((block) => (
                <div key={block.title} className="flex gap-4 py-6 first:pt-0 last:pb-0">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#EAF2FE] dark:bg-blue-900/25 text-[#1769E0] dark:text-blue-400">
                    <block.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#0F1F33] dark:text-gray-100">{block.title}</p>
                    <div className="mt-2 space-y-1">
                      {block.items.map((item, i) =>
                        block.icon === FiMail ? (
                          <a
                            key={i}
                            href={item.href}
                            className="block text-sm break-all text-[#536273] dark:text-gray-400 transition hover:text-[#1769E0] dark:hover:text-blue-400"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <p key={i} className="text-sm text-[#536273] dark:text-gray-400">
                            {item}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Contact;