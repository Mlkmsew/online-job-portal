const Footer = () => (
  <footer className="site-footer py-6">
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 className="font-semibold">EthioJob</h4>
          <p className="text-sm text-gray-500">Connecting youth with work.</p>
        </div>
        <div>
          <h4 className="font-semibold">Company</h4>
          <ul className="text-sm text-gray-500">
            <li>About</li>
            <li>Careers</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Support</h4>
          <ul className="text-sm text-gray-500">
            <li>Help Center</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
);
export default Footer;
