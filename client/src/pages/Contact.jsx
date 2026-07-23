import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Contact = () => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    toast.success(t('contact.successMessage'));
    reset();
  };

  return (
    <div className="section container-custom">
      <h1 className="heading-2 text-center mb-12">{t('contact.title')}</h1>
      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div className="card">
          <h3 className="text-xl font-semibold mb-6">{t('contact.subtitle')}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input {...register('name')} className="input" placeholder={t('contact.form.name')} required />
            <input {...register('email')} type="email" className="input" placeholder={t('contact.form.email')} required />
            <textarea {...register('message')} className="textarea" rows="5" placeholder={t('contact.form.message')} required />
            <button type="submit" className="btn btn-primary w-full">{t('contact.form.submit')}</button>
          </form>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-6">{t('contact.getInTouch')}</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <FiMail className="w-6 h-6 text-primary-500 mt-1" />
              <div>
                <p className="font-semibold">{t('contact.info.emailLabel')}</p>
                <p className="text-gray-600">{t('contact.info.emailValue1')}</p>
                <p className="text-gray-600">{t('contact.info.emailValue2')}</p>
                <p className="text-gray-600">{t('contact.info.emailValue3')}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <FiPhone className="w-6 h-6 text-primary-500 mt-1" />
              <div>
                <p className="font-semibold">{t('contact.info.phoneLabel')}</p>
                <p className="text-gray-600">{t('contact.info.phoneValue1')}</p>
                <p className="text-gray-600">{t('contact.info.phoneValue2')}</p>
                <p className="text-gray-600">{t('contact.info.phoneValue3')}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <FiMapPin className="w-6 h-6 text-primary-500 mt-1" />
              <div>
                <p className="font-semibold">{t('contact.info.addressLabel')}</p>
                <p className="text-gray-600">{t('contact.info.addressValue')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
