export const ROLES = {
  DONOR: 'donor',
  VOLUNTEER: 'volunteer',
  ORPHANAGE: 'orphanage',
  PARTNER: 'community_partner',
  ADMIN: 'admin',
};

export const DONATION_CATEGORIES = [
  'Clothing',
  'Books',
  'Toys',
  'Food'
];

// Suggested sub-items for each donation category
export const CATEGORY_ITEMS = {
  Clothing: [
    'T-Shirts', 'Trousers', 'School Uniforms', 'Sweaters',
    'Socks', 'Undergarments', 'Shoes', 'Sandals',
    'Winter Jackets', 'Rain Coats', 'Caps & Hats', 'Bedsheets', 'Other'
  ],
  Books: [
    'Story Books', 'Notebooks', 'Textbooks', 'Drawing Books',
    'Activity Books', 'Comic Books', 'Dictionary', 'Science Books',
    'Mathematics Books', 'English Grammar Books', 'Religious Books', 'Moral Stories', 'Other'
  ],
  Toys: [
    'Soft Toys', 'Building Blocks', 'Puzzles', 'Board Games',
    'Colouring Sets', 'Action Figures', 'Dolls', 'Sports Equipment',
    'Musical Toys', 'Educational Games', 'Cars & Vehicles', 'Play-Doh / Clay', 'Other'
  ],
  Food: [
    'Rice', 'Wheat / Atta', 'Lentils / Dal', 'Oats',
    'Cooking Oil', 'Sugar', 'Salt', 'Dry Milk Powder',
    'Chickpeas', 'Vermicelli / Semolina', 'Biscuits (Sealed)', 'Canned Goods', 'Other'
  ],
};

// Helper to determine role-based redirect routes
export const getDashboardRoute = (role) => {
  switch (role) {
    case ROLES.DONOR:
      return '/donor/dashboard';
    case ROLES.VOLUNTEER:
      return '/volunteer/dashboard';
    case ROLES.ORPHANAGE:
      return '/orphanage/dashboard';
    case ROLES.PARTNER:
      return '/partner/dashboard';
    case ROLES.ADMIN:
      return '/admin/dashboard';
    default:
      return '/';
  }
};
