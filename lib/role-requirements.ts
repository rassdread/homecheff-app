/**
 * Role Requirements & Age Restrictions for HomeCheff
 */

export interface RoleRequirement {
  id: string;
  name: string;
  minAge: number;
  maxAge: number | null;
  requiresVerification: boolean;
  requiresStripe: boolean;
  requiresParentalConsent: boolean;
  agreements: {
    privacyPolicy: boolean;
    terms: boolean;
    taxResponsibility: boolean;
    marketing: boolean; // optional
  };
  description: string;
  ageRestrictionMessage?: string;
}

export const ROLE_REQUIREMENTS: Record<string, RoleRequirement> = {
  chef: {
    id: 'chef',
    name: 'Chef',
    minAge: 18,
    maxAge: null,
    requiresVerification: false,
    requiresStripe: true,
    requiresParentalConsent: false,
    agreements: {
      privacyPolicy: true,
      terms: true,
      taxResponsibility: true,
      marketing: false
    },
    description: 'Verkoop culinaire creaties',
    ageRestrictionMessage: 'Je moet minimaal 18 jaar zijn om als Chef te verkopen (i.v.m. voedselveiligheid en zakelijke verantwoordelijkheid)'
  },
  
  garden: {
    id: 'garden',
    name: 'Tuinier',
    minAge: 16,
    maxAge: null,
    requiresVerification: false,
    requiresStripe: true,
    requiresParentalConsent: false,
    agreements: {
      privacyPolicy: true,
      terms: true,
      taxResponsibility: true,
      marketing: false
    },
    description: 'Verkoop groenten en planten',
    ageRestrictionMessage: 'Je moet minimaal 16 jaar zijn om als Tuinier te verkopen'
  },
  
  designer: {
    id: 'designer',
    name: 'Designer',
    minAge: 16,
    maxAge: null,
    requiresVerification: false,
    requiresStripe: true,
    requiresParentalConsent: false,
    agreements: {
      privacyPolicy: true,
      terms: true,
      taxResponsibility: true,
      marketing: false
    },
    description: 'Verkoop handgemaakte items',
    ageRestrictionMessage: 'Je moet minimaal 16 jaar zijn om als Designer te verkopen'
  },
  
  delivery: {
    id: 'delivery',
    name: 'Bezorger',
    minAge: 15,
    maxAge: 25,
    requiresVerification: true,
    requiresStripe: false,
    requiresParentalConsent: true, // Als < 18
    agreements: {
      privacyPolicy: true,
      terms: true,
      taxResponsibility: false, // Bezorgers krijgen uitbetaald, geen BTW
      marketing: false
    },
    description: 'Lokale bezorgingen',
    ageRestrictionMessage: 'Je moet tussen 15 en 25 jaar zijn om te bezorgen (jeugdbeschermingswet)'
  }
};

/**
 * Check if user meets age requirements for a role
 */
export function checkAgeRequirement(age: number, roleId: string): {
  allowed: boolean;
  message: string | null;
  requiresParentalConsent: boolean;
} {
  const requirement = ROLE_REQUIREMENTS[roleId];
  
  if (!requirement) {
    return { allowed: false, message: 'Onbekende rol', requiresParentalConsent: false };
  }

  // Check minimum age
  if (age < requirement.minAge) {
    return {
      allowed: false,
      message: requirement.ageRestrictionMessage || `Je moet minimaal ${requirement.minAge} jaar zijn voor deze rol`,
      requiresParentalConsent: false
    };
  }

  // Check maximum age
  if (requirement.maxAge && age > requirement.maxAge) {
    return {
      allowed: false,
      message: `Deze rol is alleen beschikbaar voor mensen tot ${requirement.maxAge} jaar`,
      requiresParentalConsent: false
    };
  }

  // Check if parental consent needed
  const needsParentalConsent = requirement.requiresParentalConsent && age < 18;

  return {
    allowed: true,
    message: needsParentalConsent 
      ? 'Toestemming van ouders/verzorgers vereist (je bent jonger dan 18)'
      : null,
    requiresParentalConsent: needsParentalConsent
  };
}

/**
 * Get all required agreements for a role
 */
export function getRequiredAgreements(roleId: string): string[] {
  const requirement = ROLE_REQUIREMENTS[roleId];
  if (!requirement) return [];

  const required: string[] = [];
  if (requirement.agreements.privacyPolicy) required.push('privacyPolicy');
  if (requirement.agreements.terms) required.push('terms');
  if (requirement.agreements.taxResponsibility) required.push('taxResponsibility');

  return required;
}

/**
 * Validate if user can add a role
 */
export function validateRoleAddition(
  currentAge: number,
  roleId: string,
  providedAgreements: {
    privacyPolicy?: boolean;
    terms?: boolean;
    taxResponsibility?: boolean;
    parentalConsent?: boolean;
  }
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const ageCheck = checkAgeRequirement(currentAge, roleId);

  // Check age
  if (!ageCheck.allowed) {
    errors.push(ageCheck.message || 'Leeftijdsvereiste niet voldaan');
    return { valid: false, errors };
  }

  // Check parental consent if needed
  if (ageCheck.requiresParentalConsent && !providedAgreements.parentalConsent) {
    errors.push('Toestemming van ouders/verzorgers is vereist (je bent jonger dan 18)');
  }

  // Check required agreements
  const requirement = ROLE_REQUIREMENTS[roleId];
  if (requirement.agreements.privacyPolicy && !providedAgreements.privacyPolicy) {
    errors.push('Privacybeleid moet geaccepteerd worden');
  }
  if (requirement.agreements.terms && !providedAgreements.terms) {
    errors.push('Algemene voorwaarden moeten geaccepteerd worden');
  }
  if (requirement.agreements.taxResponsibility && !providedAgreements.taxResponsibility) {
    errors.push('Belastingverantwoordelijkheid moet geaccepteerd worden');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

