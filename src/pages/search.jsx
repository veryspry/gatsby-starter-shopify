import * as React from "react"
import { useLocation } from "@reach/router"
import { graphql } from "gatsby"
import slugify from "slugify"
import { CgSearch, CgChevronRight, CgChevronLeft } from "react-icons/cg"
import {
  RiFilterLine as FilterIcon,
  RiFilterFill as FilterIconActive,
} from "react-icons/ri"
import { MdClear, MdSort } from "react-icons/md"
import { Layout } from "../components/layout"
import { ProductCard } from "../components/product-card"

import {
  getValuesFromQueryString,
  useProductSearch,
  useSearchPagination,
} from "../utils/hooks"
import {
  main,
  search,
  searchIcon,
  sortSelector,
  results,
  productList as productListStyle,
  productListItem,
  pagination,
  selectedItem,
  progressStyle,
  resultsStyle,
  filterStyle,
  clearSearch,
  searchForm,
  sortIcon,
  filterButton,
  filterTitle,
  modalOpen,
  activeFilters,
  filterWrap,
} from "./search-page.module.css"
import { getCurrencySymbol } from "../utils/format-price"
import { Spinner } from "../components/progress"
import { Filters } from "../components/filters"

export const query = graphql`
  query {
    meta: allShopifyProduct {
      productTypes: distinct(field: productType)
      tags: distinct(field: tags)
      vendors: distinct(field: vendor)
    }
    products: allShopifyProduct(limit: 24, sort: { fields: title }) {
      edges {
        node {
          title
          vendor
          productType
          handle
          priceRangeV2 {
            minVariantPrice {
              currencyCode
              amount
            }
            maxVariantPrice {
              currencyCode
              amount
            }
          }
          id
          images {
            gatsbyImageData(aspectRatio: 1, width: 200, layout: FIXED)
          }
        }
      }
    }
  }
`

export default function SearchPage({
  data: {
    meta: { productTypes, vendors, tags },
    products,
  },
}) {
  // get query params from URL if they exist, to populate default state
  const location = useLocation()

  // These default values come from the page query string
  const queryParams = getValuesFromQueryString(location.search)

  const [filters, setFilters] = React.useState(queryParams)

  const [sortKey, setSortKey] = React.useState(queryParams.sortKey)

  // This modal is only used on mobile
  const [showModal, setShowModal] = React.useState(false)

  const {
    nextPage,
    previousPage,
    reset,
    gotoPage,
    cursor,
    setData,
    pageCount,
    nextToken,
    hasFoundLastPage,
    hasNextPage,
    hasPreviousPage,
  } = useSearchPagination()

  const { data, fetching, isDefault, filterCount } = useProductSearch(
    filters,
    {
      allProductTypes: productTypes,
      allVendors: vendors,
      allTags: tags,
    },
    sortKey,
    false,
    24, // Products per page
    nextToken
  )

  React.useEffect(() => {
    // Scroll up when navigating
    if (!showModal) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      })
    }
  }, [cursor, showModal])

  React.useEffect(() => {
    if (showModal) {
      document.documentElement.style.overflow = "hidden"
    } else {
      document.documentElement.style.overflow = ""
    }
  }, [showModal])

  const hash =
    typeof window === "undefined" ? location.hash : window.location.hash
  React.useEffect(() => {
    // Automatically load the next page if "#more" is in the URL
    if (hash === "#more" && pageCount > 1) {
      nextPage()
      const url = new URL(location.href)
      url.hash = ""
      window.history.replaceState({}, null, url.toString())
    }
  }, [hash, pageCount])

  React.useEffect(() => {
    setData(data?.products)
  }, [data])

  // If the filters change then reset the pagination
  React.useEffect(() => {
    reset()
  }, [filters, sortKey])

  const currencyCode = getCurrencySymbol(
    products?.edges?.[0]?.node?.priceRangeV2?.minVariantPrice?.currencyCode
  )

  const productList = (isDefault ? products.edges : data?.products?.edges) || []
  return (
    <Layout>
      <div className={main}>
        <div className={search} aria-hidden={modalOpen}>
          <form onSubmit={(e) => e.preventDefault()} className={searchForm}>
            <CgSearch aria-hidden className={searchIcon} size={24} />

            <input
              type="text"
              value={filters.term}
              onChange={(e) =>
                setFilters({ ...filters, term: e.currentTarget.value })
              }
              placeholder="Search..."
            />
            {filters.term ? (
              <button
                className={clearSearch}
                type="reset"
                onClick={() => setFilters({ ...filters, term: "" })}
                aria-label="Clear search query"
              >
                <MdClear size={20} />
              </button>
            ) : undefined}
          </form>
          <button
            className={[
              filterButton,
              filterCount ? activeFilters : undefined,
            ].join(" ")}
            onClick={() => setShowModal((show) => !show)}
            aria-hidden
          >
            {filterCount ? (
              <FilterIconActive size={20} />
            ) : (
              <FilterIcon size={20} />
            )}
          </button>
          <div className={sortSelector}>
            <label htmlFor="sort">
              <span>Sort by:</span>
              <select
                name="sort"
                id="sort"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="RELEVANCE">Relevance</option>
                <option value="PRICE">Price</option>
                <option value="TITLE">Title</option>
                <option value="CREATED_AT">New items</option>
                <option value="BEST_SELLING">Trending</option>
              </select>
            </label>
            <MdSort className={sortIcon} size={20} />
          </div>
        </div>
        <section className={[filterStyle, showModal && modalOpen].join(" ")}>
          <div className={filterTitle}>
            <h2>Filter</h2>
            <div></div>
            <button aria-hidden onClick={() => setShowModal(false)}>
              <MdClear size={20} />
            </button>
          </div>
          <div className={filterWrap}>
            <Filters
              setFilters={setFilters}
              filters={filters}
              tags={tags}
              vendors={vendors}
              productTypes={productTypes}
              currencyCode={currencyCode}
            />
          </div>
        </section>
        <section
          className={results}
          aria-busy={fetching}
          aria-hidden={modalOpen}
        >
          {fetching ? (
            <p className={progressStyle}>
              <Spinner aria-valuetext="Searching" /> Searching
              {filters.term ? ` for "${filters.term}"…` : `…`}
            </p>
          ) : (
            <p className={resultsStyle}>
              Search results{" "}
              {filters.term && (
                <>
                  for "<span>{filters.term}</span>"
                </>
              )}
            </p>
          )}
          <ul className={productListStyle}>
            {productList.map(({ node }) => (
              <li className={productListItem} key={node.id}>
                <ProductCard
                  product={{
                    title: node.title,
                    priceRangeV2: node.priceRangeV2,
                    slug: `/products/${slugify(node.productType, {
                      lower: true,
                    })}/${node.handle}`,
                    images: isDefault ? node.images : [],
                    storefrontImages: !isDefault && node.images,
                    vendor: node.vendor,
                  }}
                  key={node.id}
                />
              </li>
            ))}
          </ul>
          {productList?.length && pageCount ? (
            <nav className={pagination}>
              <button
                disabled={!hasPreviousPage}
                onClick={previousPage}
                aria-label="Previous page"
              >
                <CgChevronLeft />
              </button>
              {[...Array(pageCount)].map((_, index) => (
                <button
                  onClick={() => gotoPage(index)}
                  className={index === cursor ? selectedItem : undefined}
                  key={`search${index}`}
                >
                  {index === pageCount && !hasFoundLastPage ? "…" : index + 1}
                </button>
              ))}
              <button
                disabled={!hasNextPage}
                onClick={nextPage}
                aria-label="Next page"
              >
                <CgChevronRight />
              </button>
            </nav>
          ) : undefined}
        </section>
      </div>
    </Layout>
  )
}
