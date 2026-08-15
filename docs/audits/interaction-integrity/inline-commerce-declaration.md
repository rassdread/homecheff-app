# Inline seller commerce declaration in consumer info

**Main before:** `792d99cadb10a7fb893a990c1191c21cb4e569f4`  
**Production before:** `dpl_4SBgFswhCmZigsJ9Q47S5w6bCXyC`

## Canonical owner

- Field: `SellerProfile.commerceDeclaration` (LEGAL-1)
- Mutation: `PUT /api/seller/commerce-declaration` (session user only)
- Settings: `SellerCommerceDeclarationSettings` on `/settings`
- Modal: `CommerceDeclarationModal` (paid create/edit)

## Inline UX

Seller + UNDECLARED → two confirm buttons in `ConsumerCommerceDisclosure`.  
Buyer → status not specified, no edit controls.  
No new enum/field/schema. Reject/counter remain available while undeclared; accept keeps conservative LEGAL-3 path.
