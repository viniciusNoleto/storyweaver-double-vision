import type ptBr from './pt-br';

export default {
  language: {
    label: 'Language',
    'pt-br': 'Português (Brasil)',
    'es-mx': 'Español (México)',
    'en-us': 'English (US)',
  },

  common: {
    loading: 'Loading...',
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      edit: 'Edit',
      delete: 'Delete',
    },
    table: {
      emptyDefault: 'No data found',
      actionsColumn: 'Actions',
    },
    notifications: {
      errorTitle: 'Error',
    },
  },

  errorBoundary: {
    title: 'Something went wrong.',
    description: 'Reload the page or contact support.',
  },

  header: {
    colorScheme: {
      label: 'Appearance',
      light: 'Light',
      dark: 'Dark',
      auto: 'System',
    },
  },
} as typeof ptBr;
