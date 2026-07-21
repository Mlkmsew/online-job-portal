import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Contact = () => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    toast.success('Message sent! We will get back to you soon.');
    reset();
  };

  return (
    <div className="section container-custom">
      <h1 className="heading-2 text-center mb-12">Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <div className="card">
          <h3 className="text-xl font-semibold mb-6">Send us a Message</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input {...register('name')} className="input" placeholder="Your Name" required />
            <input {...register('email')} type="email" className="input" placeholder="Your Email" required />
            <textarea {...register('message')} className="textarea" rows="5" placeholder="Your Message" required />
            <button type="submit" className="btn btn-primary w-full">Send Message</button>
          </form>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-6">Get in Touch</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <FiMail className="w-6 h-6 text-primary-500 mt-1" />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-gray-600">info@ethiojob.com</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <FiPhone className="w-6 h-6 text-primary-500 mt-1" />
              <div>
                <p className="font-semibold">Phone</p>
                <p className="text-gray-600">+251 11 555 1234</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <FiMapPin className="w-6 h-6 text-primary-500 mt-1" />
              <div>
                <p className="font-semibold">Address</p>
                <p className="text-gray-600">Bole, Addis Ababa, Ethiopia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
