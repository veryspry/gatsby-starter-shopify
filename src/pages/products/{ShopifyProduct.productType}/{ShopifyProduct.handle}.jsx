import * as React from "react"
import { graphql, Link } from "gatsby"
import {
  productBox,
  container,
  header,
  productImageWrapper,
  productImage,
  scrollForMore,
  noImagePreview,
  infodiv,
  optionsWrapper,
  priceValue,
  selectVariant,
  labelFont,
  breadcrumb,
  tagList,
  addToCartStyle,
  metaSection,
} from "./product-page.module.css"
import isEqual from "lodash.isequal"
import { GatsbyImage, getSrc } from "gatsby-plugin-image"
import { Layout } from "../../../components/layout"
import { StoreContext } from "../../../context/store-context"
import { AddToCart } from "../../../components/add-to-cart"
import { NumericInput } from "../../../components/numeric-input"
import { formatPrice } from "../../../utils/format-price"
import { Seo } from "../../../components/seo"
import { CgChevronRight as ChevronIcon } from "react-icons/cg"

export default function Product({ data: { product, suggestions } }) {
  const {
    options,
    variants,
    variants: [initialVariant],
    priceRangeV2,
    title,
    description,
    images,
    images: [firstImage],
  } = product
  const { client } = React.useContext(StoreContext)

  const [variant, setVariant] = React.useState({ ...initialVariant })
  const [quantity, setQuantity] = React.useState(1)

  const productVariant =
    client.product.helpers.variantForOptions(product, variant) || variant

  const [available, setAvailable] = React.useState(
    productVariant.availableForSale
  )

  const checkAvailablity = React.useCallback(
    (productId) => {
      client.product.fetch(productId).then((fetchedProduct) => {
        const result =
          fetchedProduct?.variants.filter(
            (variant) => variant.id === productVariant.storefrontId
          ) ?? []

        if (result.length > 0) {
          setAvailable(result[0].available)
        }
      })
    },
    [productVariant.storefrontId, client.product]
  )

  const handleOptionChange = (index, event) => {
    const value = event.target.value

    if (value === "") {
      return
    }

    const currentOptions = [...variant.selectedOptions]

    currentOptions[index] = {
      ...currentOptions[index],
      value,
    }

    const selectedVariant = variants.find((variant) => {
      return isEqual(currentOptions, variant.selectedOptions)
    })

    setVariant({ ...selectedVariant })
  }

  React.useEffect(() => {
    checkAvailablity(product.storefrontId)
  }, [productVariant.storefrontId, checkAvailablity, product.storefrontId])

  const price = formatPrice(
    priceRangeV2.minVariantPrice.currencyCode,
    variant.price
  )

  const hasVariants = variants.length > 1
  const hasImages = images.length > 0
  const hasMultipleImages = images.length > 1

  return (
    <Layout>
      <Seo
        title={title}
        description={description}
        image={getSrc(firstImage.gatsbyImageData)}
      />
      <main>
        <div className={container}>
          <div className={productBox}>
            {hasImages && (
              <div className={productImageWrapper}>
                <div
                  role="group"
                  aria-label="gallery"
                  aria-describedby="instructions"
                  className={productImage}
                >
                  {hasImages ? (
                    <ul>
                      {images.map((image, index) => (
                        <li key={`product-image-${index}`}>
                          <GatsbyImage
                            objectFit="contain"
                            alt={
                              image.altText
                                ? image.altText
                                : `Product Image of ${title} #${index + 1}`
                            }
                            image={image.gatsbyImageData}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className={noImagePreview}>No Preview image</span>
                  )}
                </div>
                {hasMultipleImages && (
                  <div className={scrollForMore}>
                    <span aria-hidden="true">←</span> scroll for more{" "}
                    <span aria-hidden="true">→</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className={breadcrumb}>
                <Link to={product.productTypeSlug}>{product.productType}</Link>
                <ChevronIcon size={12} />
              </div>
              <h1 className={header}>{title}</h1>
              <p>{description}</p>
              <h2 className={priceValue}>
                <span>{price}</span>
              </h2>
              <fieldset className={optionsWrapper}>
                {hasVariants &&
                  options.map(({ id, name, values }, index) => (
                    <select
                      aria-label="Variants"
                      className={selectVariant}
                      onBlur={(event) => handleOptionChange(index, event)}
                      key={id}
                    >
                      <option value="">{`Select ${name}`}</option>
                      {values.map((value) => (
                        <option value={value} key={`${name}-${value}`}>
                          {value}
                        </option>
                      ))}
                    </select>
                  ))}
              </fieldset>
              <div className={addToCartStyle}>
                <NumericInput
                  aria-label="Quantity"
                  onIncrement={() => setQuantity((q) => Math.min(q + 1, 20))}
                  onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
                  onChange={(event) => setQuantity(event.currentTarget.value)}
                  value={quantity}
                  min="1"
                  max="20"
                />
                <AddToCart
                  variantId={productVariant.storefrontId}
                  quantity={quantity}
                  available={available}
                />
              </div>
              <div className={metaSection}>
                <span className={labelFont}>Type</span>
                <span className={tagList}>
                  <Link to={product.productTypeSlug}>
                    {product.productType}
                  </Link>
                </span>

                <span className={labelFont}>Tags</span>
                <span className={tagList}>
                  {product.tags.map((tag) => (
                    <Link to={`/search?t=${tag}`}>{tag}</Link>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}

export const query = graphql`
  query($id: String!, $productType: String!) {
    product: shopifyProduct(id: { eq: $id }) {
      title
      description
      productType
      productTypeSlug: gatsbyPath(
        filePath: "/products/{ShopifyProduct.productType}"
      )
      tags
      priceRangeV2 {
        maxVariantPrice {
          amount
          currencyCode
        }
        minVariantPrice {
          amount
          currencyCode
        }
      }
      storefrontId
      images {
        # altText
        gatsbyImageData(layout: CONSTRAINED, width: 640, aspectRatio: 1)
      }
      variants {
        availableForSale
        storefrontId
        title
        price
        selectedOptions {
          name
          value
        }
      }
      options {
        name
        values
        id
      }
    }
    suggestions: allShopifyProduct(
      limit: 3
      filter: { productType: { eq: $productType }, id: { ne: $id } }
    ) {
      nodes {
        ...ProductCard
      }
    }
  }
`
