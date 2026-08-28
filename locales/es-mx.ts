import type ptBr from './pt-br';

export default {
  language: {
    label: 'Idioma',
    'pt-br': 'Português (Brasil)',
    'es-mx': 'Español (México)',
    'en-us': 'English (US)',
  },

  common: {
    loading: 'Cargando...',
    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      close: 'Cerrar',
      edit: 'Editar',
      delete: 'Eliminar',
    },
    table: {
      emptyDefault: 'No se encontraron datos',
      actionsColumn: 'Acciones',
    },
    notifications: {
      errorTitle: 'Error',
    },
  },

  errorBoundary: {
    title: 'Algo salió mal.',
    description: 'Recarga la página o contacta con soporte.',
  },

  header: {
    colorScheme: {
      label: 'Apariencia',
      light: 'Claro',
      dark: 'Oscuro',
      auto: 'Sistema',
    },
  },
} as typeof ptBr;
