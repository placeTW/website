const Header = () => {
  return (
    <header>
      <h1>Header</h1>
    </header>
  );
};

const Footer = () => {
  return (
    <footer>
      <h1>Footer</h1>
    </footer>
  );
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Header />
      <div className="container">{children}</div>
      <Footer />
    </div>
  );
};

export default Layout;
