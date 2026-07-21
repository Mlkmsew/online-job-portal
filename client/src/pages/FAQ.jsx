const FAQ = () => {
  const faqs = [
    { q: 'How do I create an account?', a: 'Click on "Get Started" and fill in your details. Verify your email to activate your account.' },
    { q: 'Is EthioJob Portal free to use?', a: 'Yes! Creating an account and applying for jobs is completely free for job seekers.' },
    { q: 'How do I apply for a job?', a: 'Browse jobs, click on a job listing, and click "Apply Now". Make sure your profile and CV are up to date.' },
    { q: 'Can employers post jobs for free?', a: 'Yes, employers can post jobs after creating a company profile and getting admin approval.' },
    { q: 'How long does it take to get a response?', a: 'Response times vary by employer. You can track your application status in your dashboard.' },
  ];

  return (
    <div className="section container-custom">
      <h1 className="heading-2 text-center mb-12">Frequently Asked Questions</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="card">
            <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
            <p className="text-gray-600">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
