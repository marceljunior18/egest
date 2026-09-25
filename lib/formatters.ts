// ==============================================================================
// eGest MVP V1 - FORMATTERS (FCFA, DATES, STATUTS)
// ==============================================================================

/**
 * Formate un montant en FCFA avec espace pour les milliers et sans virgule.
 * Ex: 1250000 -> "1 250 000 FCFA"
 */
export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 FCFA';
  }
  const rounded = Math.round(amount);
  // Remplace les séparateurs par des espaces insécables
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Formate une date au format français standard (JJ/MM/AAAA)
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formate une date avec heure (JJ/MM/AAAA à HH:MM)
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const datePart = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${datePart} à ${timePart}`;
}

/**
 * Formate le nom d'un rôle pour affichage utilisateur
 */
export function formatRole(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrateur';
    case 'MANAGER':
      return 'Gérant / Manager';
    case 'CASHIER':
      return 'Caissier(ère)';
    case 'EMPLOYEE':
      return 'Employé (Lecture)';
    default:
      return role;
  }
}
