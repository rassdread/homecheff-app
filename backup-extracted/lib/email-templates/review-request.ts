/**
 * Review Request Email Template
 * Sent to buyers after order completion to request a review
 */

export interface ReviewRequestData {
  buyerName: string;
  buyerEmail: string;
  orderNumber: string;
  productTitle: string;
  productImage?: string;
  reviewToken: string;
  reviewUrl: string;
  sellerName: string;
}

export function renderReviewRequestEmail(data: ReviewRequestData): string {
  const { buyerName, orderNumber, productTitle, productImage, reviewUrl, sellerName } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Review Verzoek - HomeCheff</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8fafc; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #006D52 0%, #005843 100%); 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          color: white; 
          margin: 0; 
          font-size: 28px; 
          font-weight: 700; 
        }
        .content { 
          padding: 40px 30px; 
        }
        .content h2 { 
          color: #1f2937; 
          margin: 0 0 20px 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .content p { 
          color: #6b7280; 
          margin: 0 0 20px 0; 
          font-size: 16px; 
        }
        .product-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .product-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          background: #e5e7eb;
        }
        .product-info {
          flex: 1;
        }
        .product-title {
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 5px 0;
        }
        .product-seller {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #006D52 0%, #005843 100%); 
          color: white; 
          text-decoration: none; 
          padding: 16px 32px; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px; 
          margin: 20px 0; 
        }
        .button:hover { 
          background: linear-gradient(135deg, #005843 0%, #004634 100%); 
        }
        .footer { 
          background: #f9fafb; 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #e5e7eb; 
        }
        .footer p { 
          color: #6b7280; 
          font-size: 14px; 
          margin: 0; 
        }
        .logo { 
          width: 60px; 
          height: 60px; 
          background: white; 
          border-radius: 12px; 
          margin: 0 auto 20px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 24px; 
          font-weight: bold; 
          color: #006D52; 
        }
        .highlight { 
          background: #f0fdf4; 
          border: 1px solid #bbf7d0; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 20px 0; 
        }
        .highlight p { 
          color: #166534; 
          margin: 0; 
          font-weight: 500; 
        }
        .expiry-note {
          color: #9ca3af;
          font-size: 14px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">H</div>
          <h1>Hoe was je aankoop?</h1>
        </div>
        
        <div class="content">
          <h2>Hallo ${buyerName}! 👋</h2>
          
          <p>Bedankt voor je aankoop bij HomeCheff! We hopen dat je tevreden bent met je bestelling.</p>
          
          <div class="highlight">
            <p>⭐ Help andere gebruikers door een review achter te laten!</p>
          </div>

          <div class="product-card">
            ${productImage ? `<img src="${productImage}" alt="${productTitle}" class="product-image" />` : '<div class="product-image"></div>'}
            <div class="product-info">
              <p class="product-title">${productTitle}</p>
              <p class="product-seller">Van ${sellerName}</p>
              <p class="product-seller" style="margin-top: 5px;">Bestelling #${orderNumber}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}" class="button">Schrijf een Review</a>
          </div>

          <p class="expiry-note">
            Deze link is 30 dagen geldig en kan maar één keer gebruikt worden.
          </p>
          
          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
            Als je vragen hebt over je bestelling, neem dan contact op met de verkoper via je berichtenbox.
          </p>
        </div>
        
        <div class="footer">
          <p>Met vriendelijke groet,<br>Het HomeCheff Team</p>
          <p style="margin-top: 15px; font-size: 12px;">
            <a href="${process.env.NEXTAUTH_URL || 'https://homecheff.nl'}" style="color: #006D52;">homecheff.nl</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getReviewRequestSubject(buyerName: string, productTitle: string): string {
  return `Review verzoek: ${productTitle} - HomeCheff`;
}




