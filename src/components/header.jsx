import * as React from "react"
import {
  headerStyle,
  containerStyle,
  logoSpan,
  searchButton,
  cartButton,
  navSection,
} from "./header.module.css"
import { Link } from "gatsby"
import { StoreContext } from "../context/store-context"
import logo from "../icons/logo.svg"
import { Navigation } from "./navigation"
import { CartButton } from "./cart-button"
import { CgSearch } from "react-icons/cg"
import { Toast } from "./toast"

export function Header() {
  const { checkout, loading, didJustAddToCart } = React.useContext(StoreContext)

  const items = checkout ? checkout.lineItems : []

  const quantity = items.reduce((total, item) => {
    return total + item.quantity
  }, 0)

  return (
    <div className={containerStyle}>
      <header className={headerStyle}>
        <Link to="/" className={logoSpan}>
          <img src={logo} width={24} height={24} alt="My store" />
        </Link>
        <Navigation className={navSection} />
        <Link to="/search" className={searchButton}>
          <CgSearch size={24} title="Search" />
        </Link>
        <CartButton
          quantity={quantity}
          className={cartButton}
          loading={loading}
        />
      </header>
      <Toast show={loading || didJustAddToCart}>
        {!didJustAddToCart ? (
          "Updating…"
        ) : (
          <>
            Added to cart{" "}
            <svg
              width="14"
              height="14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.019 10.492l-2.322-3.17A.796.796 0 013.91 6.304L6.628 9.14a1.056 1.056 0 11-1.61 1.351z"
                fill="#fff"
              />
              <path
                d="M5.209 10.693a1.11 1.11 0 01-.105-1.6l5.394-5.88a.757.757 0 011.159.973l-4.855 6.332a1.11 1.11 0 01-1.593.175z"
                fill="#fff"
              />
              <path
                d="M5.331 7.806c.272.326.471.543.815.163.345-.38-.108.96-.108.96l-1.123-.363.416-.76z"
                fill="#fff"
              />
            </svg>
          </>
        )}
      </Toast>
    </div>
  )
}
