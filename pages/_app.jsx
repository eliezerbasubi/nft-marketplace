import Link from "next/link";

import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">Diggy Marketplace</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-4 text-blue-700">Home</a>
          </Link>
          <Link href="/">
            <a className="mr-4 text-blue-700">Sell NFT</a>
          </Link>
          <Link href="/">
            <a className="mr-4 text-blue-700">Home</a>
          </Link>
          <Link href="/">
            <a className="mr-4 text-blue-700">Creator Dashboard</a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
