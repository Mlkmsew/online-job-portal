const Newsletter = () => (
  <section className="newsletter py-6">
    <div className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="heading-3">Join our newsletter</h3>
        <p className="text-sm text-gray-500">Get job alerts and career tips.</p>
      </div>
      <div className="mt-3 md:mt-0">
        <input placeholder="Your email" className="input mr-2" />
        <button className="btn btn-primary">Subscribe</button>
      </div>
    </div>
  </section>
);
export default Newsletter;
