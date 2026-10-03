# Product interface refinement

Reviewed on 3 October 2026. The user approved Developer Portal's current visual treatment and asked to redo the growth and discount example interfaces. Keep the portfolio layout, native vertical scrolling, project ownership, factual evidence and Developer Portal intact.

## References and decisions

[Shopify Admin search and filtering](https://help.shopify.com/en/manual/shopify-admin/productivity-tools/searching-filtering-views) groups discovery controls around a resource list. That structure informs the growth catalog: a compact property context, search and category controls, readable program rows, and a selected program's existing mechanics. Saved views, status filters and bulk actions from the reference are outside this portfolio's original workflow and are not introduced.

[Stripe Billing](https://stripe.com/billing) presents ordinary-sized controls alongside itemized financial summaries. The input-to-summary hierarchy informs the Net Rate Simulator: room rate, the existing two discount selections, ordered deductions and one resulting room rate. Stripe's invoices, subscription controls, payment methods and tax calculations are not portfolio features.

The interfaces are original HTML/CSS compositions inspired by those visual patterns. They do not use official Shopify or Stripe components, copy their code/media, or imply a product integration. Rauno remains the portfolio-level visual reference.

## Content and calculation boundaries

Discovery uses the same eight programs, categories, descriptions and mechanics. Search, category filtering and native detail expansion remain the live interactions. Home contains a decorative preview of the first three existing programs; the full catalog is in the growth case study. Navigation context uses the existing property workflow labels.

Discounting keeps the existing room-rate field, Mega Sale at 15%, Mobile Exclusive at 10%, reset, validation and live calculation. At $150, the first deduction is $22.50, leaving $127.50; the second is $12.75, leaving $114.75. The effective discount is 23.5%. These are illustrative calculations, before commission and taxes, rather than new measured outcomes. Currency rounding and invalid-input behavior remain handled by the existing calculation module.

All current interfaces remain labeled Updated concept and link to accessible original artifacts. They do not enroll properties, save settings or connect to Agoda.

## Review

Check readable type and control targets, aligned monetary values, accurate sequence and exclusions, category/search/empty/detail states, calculator reset/zero/invalid/rounding states, keyboard focus, 320–1440 pixel layouts, no JavaScript, reduced motion/transparency and loading cost. Verify Developer Portal and its interface styling remain unchanged.

Before captures for this refinement are in `review/product-ui-revision/before/`; current captures and test evidence are in `review/after/` and the review reports. Browser automation and visual review do not certify industry-standard usability, production performance or recruiter response.
