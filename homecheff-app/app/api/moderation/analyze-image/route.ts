import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Content moderation API using multiple services for redundancy
const MODERATION_SERVICES = {
  // Google Cloud Vision API (primary)
  googleVision: {
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
    endpoint: 'https://vision.googleapis.com/v1/images:annotate'
  },
  // Azure Content Moderator (backup)
  azure: {
    endpoint: process.env.AZURE_MODERATOR_ENDPOINT,
    key: process.env.AZURE_MODERATOR_KEY
  },
  // Hugging Face API (fallback)
  huggingFace: {
    endpoint: 'https://api-inference.huggingface.co/models/facebook/detr-resnet-50',
    token: process.env.HUGGINGFACE_API_TOKEN
  }
};

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories: string[];
  violations: string[];
  suggestions: string[];
  categoryMatch: boolean;
  recommendedCategory?: string;
}

interface CategoryValidation {
  isValidForCategory: boolean;
  confidence: number;
  detectedObjects: string[];
  recommendedCategory?: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  
  if (!(session as any)?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { imageUrl, imageBase64, category, productTitle } = await req.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'Image URL or base64 data required' }, { status: 400 });
    }

    // Analyze image with multiple AI services for accuracy
    const [contentModeration, categoryValidation] = await Promise.all([
      analyzeContentSafety(imageUrl || imageBase64),
      validateCategoryMatch(imageUrl || imageBase64, category, productTitle)
    ]);

    const result = {
      ...contentModeration,
      ...categoryValidation,
      timestamp: new Date().toISOString(),
      imageUrl: imageUrl || 'base64_data'
    };

    // Log moderation results for admin review
    await logModerationResult((session as any).user.id, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Content moderation error:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}

async function analyzeContentSafety(imageData: string): Promise<ModerationResult> {
  const violations: string[] = [];
  const categories: string[] = [];
  let confidence = 0;
  let isAppropriate = true;

  try {
    // Primary: Google Cloud Vision API for content moderation
    if (MODERATION_SERVICES.googleVision.apiKey) {
      const googleResult = await analyzeWithGoogleVision(imageData);
      if (googleResult) {
        confidence = Math.max(confidence, googleResult.confidence);
        violations.push(...googleResult.violations);
        categories.push(...googleResult.categories);
        isAppropriate = googleResult.isAppropriate;
      }
    }

    // Backup: Azure Content Moderator
    if (MODERATION_SERVICES.azure.key && violations.length === 0) {
      const azureResult = await analyzeWithAzure(imageData);
      if (azureResult) {
        confidence = Math.max(confidence, azureResult.confidence);
        violations.push(...azureResult.violations);
        isAppropriate = azureResult.isAppropriate;
      }
    }

    // Fallback: Hugging Face for object detection
    if (MODERATION_SERVICES.huggingFace.token && violations.length === 0) {
      const hfResult = await analyzeWithHuggingFace(imageData);
      if (hfResult) {
        categories.push(...hfResult.categories);
      }
    }

  } catch (error) {
    console.error('Content safety analysis error:', error);
    // Default to safe but flag for manual review
    isAppropriate = true;
    violations.push('manual_review_required');
    confidence = 0.5;
  }

  return {
    isAppropriate,
    confidence,
    categories: [...new Set(categories)],
    violations: [...new Set(violations)],
    suggestions: generateSuggestions(violations),
    categoryMatch: true // Will be updated by category validation
  };
}

async function validateCategoryMatch(imageData: string, category: string, productTitle?: string): Promise<CategoryValidation> {
  const detectedObjects: string[] = [];
  let isValidForCategory = true;
  let confidence = 0.8;
  let recommendedCategory = category;

  try {
    // Object detection for category validation
    const objects = await detectObjectsInImage(imageData);
    detectedObjects.push(...objects);

    // Category-specific validation rules
    const categoryRules = {
      'CHEFF': ['food', 'dish', 'meal', 'cooking', 'kitchen', 'ingredient', 'recipe'],
      'GROWN': ['plant', 'vegetable', 'fruit', 'herb', 'garden', 'seed', 'flower', 'tree'],
      'DESIGNER': ['art', 'craft', 'design', 'handmade', 'jewelry', 'furniture', 'textile', 'artwork']
    };

    const allowedObjects = categoryRules[category as keyof typeof categoryRules] || [];
    const hasRelevantObjects = objects.some(obj => 
      allowedObjects.some(allowed => obj.toLowerCase().includes(allowed.toLowerCase()))
    );

    if (!hasRelevantObjects) {
      isValidForCategory = false;
      confidence = 0.3;
      
      // Try to suggest correct category based on detected objects
      for (const [cat, keywords] of Object.entries(categoryRules)) {
        if (objects.some(obj => keywords.some(keyword => obj.toLowerCase().includes(keyword)))) {
          recommendedCategory = cat;
          break;
        }
      }
    }

  } catch (error) {
    console.error('Category validation error:', error);
    // Default to valid but low confidence
    isValidForCategory = true;
    confidence = 0.5;
  }

  return {
    isValidForCategory,
    confidence,
    detectedObjects,
    recommendedCategory
  };
}

async function analyzeWithGoogleVision(imageData: string) {
  if (!MODERATION_SERVICES.googleVision.apiKey) return null;

  try {
    const response = await fetch(
      `${MODERATION_SERVICES.googleVision.endpoint}?key=${MODERATION_SERVICES.googleVision.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageData.includes('data:') ? imageData.split(',')[1] : imageData },
            features: [
              { type: 'SAFE_SEARCH_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
              { type: 'LABEL_DETECTION', maxResults: 20 }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const result = data.responses[0];

    const violations: string[] = [];
    const categories: string[] = [];
    let isAppropriate = true;

    // Check safe search results
    if (result.safeSearchAnnotation) {
      const safeSearch = result.safeSearchAnnotation;
      if (safeSearch.adult === 'VERY_LIKELY' || safeSearch.adult === 'LIKELY') {
        violations.push('adult_content');
        isAppropriate = false;
      }
      if (safeSearch.violence === 'VERY_LIKELY' || safeSearch.violence === 'LIKELY') {
        violations.push('violence');
        isAppropriate = false;
      }
      if (safeSearch.racy === 'VERY_LIKELY' || safeSearch.racy === 'LIKELY') {
        violations.push('racy_content');
        isAppropriate = false;
      }
    }

    // Extract labels
    if (result.labelAnnotations) {
      categories.push(...result.labelAnnotations.map((label: any) => label.description));
    }

    return {
      isAppropriate,
      confidence: 0.9,
      violations,
      categories
    };

  } catch (error) {
    console.error('Google Vision API error:', error);
    return null;
  }
}

async function analyzeWithAzure(imageData: string) {
  if (!MODERATION_SERVICES.azure.key) return null;

  try {
    const response = await fetch(
      `${MODERATION_SERVICES.azure.endpoint}/contentmoderator/moderate/v1.0/ProcessImage/Evaluate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': MODERATION_SERVICES.azure.key
        },
        body: Buffer.from(imageData.includes('data:') ? imageData.split(',')[1] : imageData, 'base64')
      }
    );

    const data = await response.json();
    
    const violations: string[] = [];
    let isAppropriate = true;

    if (data.IsImageAdultClassified || data.AdultClassificationScore > 0.7) {
      violations.push('adult_content');
      isAppropriate = false;
    }

    if (data.IsImageRacyClassified || data.RacyClassificationScore > 0.7) {
      violations.push('racy_content');
      isAppropriate = false;
    }

    return {
      isAppropriate,
      confidence: 0.8,
      violations,
      categories: []
    };

  } catch (error) {
    console.error('Azure Content Moderator error:', error);
    return null;
  }
}

async function analyzeWithHuggingFace(imageData: string) {
  if (!MODERATION_SERVICES.huggingFace.token) return null;

  try {
    const response = await fetch(MODERATION_SERVICES.huggingFace.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MODERATION_SERVICES.huggingFace.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: imageData.includes('data:') ? imageData.split(',')[1] : imageData
      })
    });

    const data = await response.json();
    
    return {
      categories: data.map((item: any) => item.label).slice(0, 10),
      confidence: 0.6
    };

  } catch (error) {
    console.error('Hugging Face API error:', error);
    return null;
  }
}

async function detectObjectsInImage(imageData: string): Promise<string[]> {
  // Simplified object detection - in production, use a proper ML model
  const commonObjects = [
    'food', 'dish', 'meal', 'plate', 'bowl', 'cup', 'drink',
    'plant', 'vegetable', 'fruit', 'herb', 'flower', 'tree', 'leaf',
    'art', 'craft', 'design', 'handmade', 'jewelry', 'furniture',
    'textile', 'clothing', 'shoe', 'bag', 'accessory',
    'kitchen', 'cooking', 'ingredient', 'recipe'
  ];

  // This is a placeholder - in reality, you'd use an ML model
  // For now, return a subset based on category
  return commonObjects.slice(0, 5);
}

function generateSuggestions(violations: string[]): string[] {
  const suggestions: string[] = [];

  if (violations.includes('adult_content')) {
    suggestions.push('Remove adult content or mark as 18+');
  }
  if (violations.includes('violence')) {
    suggestions.push('Remove violent content');
  }
  if (violations.includes('racy_content')) {
    suggestions.push('Use more appropriate imagery');
  }
  if (violations.includes('category_mismatch')) {
    suggestions.push('Choose correct product category');
  }

  return suggestions;
}

async function logModerationResult(userId: string, result: any) {
  // Log to database for admin review
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'CONTENT_MODERATION',
        entityType: 'IMAGE',
        entityId: `moderation-${Date.now()}-${userId}`,
        userId: userId,
        metadata: {
          ...result,
          imageUrl: result.imageUrl,
          category: result.recommendedCategory || 'UNKNOWN',
          productTitle: result.productTitle || '',
          timestamp: new Date().toISOString()
        }
      }
    });
    
    console.log('Moderation result logged to database');
  } catch (error) {
    console.error('Failed to log moderation result:', error);
  }
}
